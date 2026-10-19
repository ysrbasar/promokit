import "server-only";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  QUOTE_STATUSES,
  UPLOAD_LIMIT_BYTES,
  UPLOAD_TYPES,
  sniffFileType,
  type QuoteRequest,
  type QuoteStatus,
  type StoredQuote,
} from "../quote/schema";
import { RUNTIME_DIR, readJson, writeJson } from "./jsonStore";
import { quotePrint } from "../config/printPricing";
import { computeProfit, type ProfitLine } from "../quote/profit";
import { getCosts, unitCost } from "./costs";
import { getCatalog, getSettings } from "./repositories";

/**
 * QuoteService: teklif taleplerini doğrular ve kalıcı olarak saklar.
 * E-posta/CRM entegrasyonu YAPILANDIRILMAMIŞTIR; talepler yönetim panelinde listelenir.
 */

const QUOTES_DIR = path.join(RUNTIME_DIR, "quotes");
const UPLOADS_DIR = path.join(RUNTIME_DIR, "uploads");

export class QuoteError extends Error {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message);
  }
}

export async function validateAttachment(file: File | null) {
  if (!file || file.size === 0) return null;
  if (file.size > UPLOAD_LIMIT_BYTES) throw new QuoteError("Dosya en fazla 5 MB olabilir", "attachment");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const sniffed = sniffFileType(bytes);
  if (!sniffed || !UPLOAD_TYPES[sniffed]) {
    throw new QuoteError("Yalnızca PNG, JPG, SVG veya PDF dosyası yükleyebilirsiniz", "attachment");
  }
  return { bytes, type: sniffed, ext: UPLOAD_TYPES[sniffed], name: file.name.slice(0, 120) };
}

function printFields(p: { subcategory: string | null; name: string; printingMethods: string[] }, method: string | null, units: number, markupPct: number) {
  if (!method || !p.printingMethods.includes(method)) return { printMethod: null, printPrice: null, printCost: null };
  const sale = quotePrint(p.subcategory, p.name, method, units, markupPct);
  const cost = quotePrint(p.subcategory, p.name, method, units, 0);
  return {
    printMethod: method,
    printPrice: sale.kind === "price" ? sale.total : sale.kind === "included" ? 0 : null,
    printCost: cost.kind === "price" ? cost.total : cost.kind === "included" ? 0 : null,
  };
}

export async function createQuote(req: QuoteRequest, file: File | null): Promise<StoredQuote> {
  const attachment = await validateAttachment(file);
  const [{ products, info }, costs, settings] = await Promise.all([getCatalog(), getCosts(), getSettings()]);
  const map = new Map(products.map((p) => [p.productCode, p]));

  const snapshot = req.kit.lines.map((l) => {
    const p = map.get(l.productCode);
    if (!p) throw new QuoteError(`Kitteki ${l.productCode} kodlu ürün katalogda bulunamadı`, "kit");
    const v = p.variants.find((x) => x.code === l.variantCode) ?? null;
    if (l.variantCode && !v) throw new QuoteError(`${p.name} için seçilen varyant bulunamadı`, "kit");
    return {
      productCode: p.productCode,
      name: p.name,
      variantCode: v?.code ?? null,
      color: v?.color ?? null,
      qty: l.qty,
      stockStatus: p.stockStatus,
      ...printFields(p, l.printMethod ?? null, l.qty * req.kit.kitQuantity, settings.printMarkupPct),
      listPrice: p.isDemo ? null : (v?.price ?? p.price),
      cost: unitCost(costs, p.productCode, v?.code),
      currency: p.priceCurrency,
    };
  });

  const id = `T-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomUUID().slice(0, 6).toUpperCase()}`;
  let stored: StoredQuote["attachment"] = null;
  if (attachment) {
    await mkdir(UPLOADS_DIR, { recursive: true });
    const storedAs = `${id}.${attachment.ext}`;
    await writeFile(path.join(UPLOADS_DIR, storedAs), attachment.bytes);
    stored = { fileName: attachment.name, storedAs, size: attachment.bytes.byteLength, type: attachment.type };
  }

  const quote: StoredQuote = {
    ...req,
    id,
    createdAt: new Date().toISOString(),
    status: "new",
    snapshot,
    attachment: stored,
    catalogKind: info.kind,
  };
  await writeJson(path.join(QUOTES_DIR, `${id}.json`), quote);
  return quote;
}

export async function listQuotes(): Promise<StoredQuote[]> {
  let files: string[] = [];
  try {
    files = (await readdir(QUOTES_DIR)).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  const all = await Promise.all(files.map((f) => readJson<StoredQuote>(path.join(QUOTES_DIR, f))));
  return all.filter((q): q is StoredQuote => !!q).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateQuoteStatus(id: string, status: QuoteStatus) {
  if (!/^T-\d{8}-[A-Z0-9]{6}$/.test(id)) throw new QuoteError("Geçersiz teklif numarası");
  if (!QUOTE_STATUSES.includes(status)) throw new QuoteError("Geçersiz durum");
  const file = path.join(QUOTES_DIR, `${id}.json`);
  const q = await readJson<StoredQuote>(file);
  if (!q) throw new QuoteError("Teklif bulunamadı");
  await writeJson(file, { ...q, status });
}

/** Yönetim paneli: teklif + satır fiyatları + kâr. Eski kayıtlarda fiyat yoksa güncel katalogdan tahmin edilir. */
export async function listQuotesWithProfit() {
  const [quotes, { products }, costs] = await Promise.all([listQuotes(), getCatalog(), getCosts()]);
  const map = new Map(products.map((p) => [p.productCode, p]));
  return quotes.map((q) => {
    let estimated = false;
    const lines: (ProfitLine & { productCode: string })[] = q.snapshot.map((s) => {
      if (s.listPrice !== undefined)
        return { productCode: s.productCode, qty: s.qty, listPrice: s.listPrice ?? null, cost: s.cost ?? null, currency: s.currency ?? null, printPrice: s.printPrice ?? null, printCost: s.printCost ?? null };
      estimated = true;
      const p = map.get(s.productCode);
      const v = p?.variants.find((x) => x.code === s.variantCode);
      return {
        productCode: s.productCode,
        qty: s.qty,
        listPrice: p && !p.isDemo ? (v?.price ?? p.price) : null,
        cost: unitCost(costs, s.productCode, s.variantCode),
        currency: p?.priceCurrency ?? null,
      };
    });
    return { quote: q, lines, profit: computeProfit(lines, q.kit.kitQuantity), estimated };
  });
}
