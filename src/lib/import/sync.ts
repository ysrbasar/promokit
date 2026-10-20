import path from "node:path";
import type { Product } from "../catalog/schema";
import type { ReadyKit } from "../kit/readyKits";
import { DATA_DIR, readText, writeData } from "../server/storage";
import { parseIpromosyon, type FeedInfo } from "./ipromosyon";

/**
 * Katalog senkronizasyonu (ipromosyon XML). Hem sunucu zamanlayıcısı (instrumentation.ts)
 * hem komut satırı (npm run catalog:update) bu modülü kullanır.
 *
 *  data/runtime/catalog.json      → müşteriye açık katalog (liste fiyatı, stok)
 *  data/runtime/synced-kits.json  → kutulu setlerden üretilen hazır kitler
 *  data/private/costs.json        → ALIŞ FİYATLARI (yalnızca yönetim paneli; depoya girmez)
 *  data/runtime/sync-status.json  → son güncelleme durumu
 *  --seed ile ayrıca data/catalog.json ve data/kits.json (depodaki başlangıç verisi) yazılır.
 */

export { DATA_DIR };
export const STATUS_FILE = path.join(DATA_DIR, "runtime", "sync-status.json");
export const COSTS_FILE = path.join(DATA_DIR, "private", "costs.json");
/** Otomatik güncellemenin çıktısı runtime/ altına yazılır (git'e girmez, "git pull" ile çakışmaz) */
export const SYNCED_CATALOG_FILE = path.join(DATA_DIR, "runtime", "catalog.json");
export const SYNCED_KITS_FILE = path.join(DATA_DIR, "runtime", "synced-kits.json");

export type SyncStatus = {
  running: boolean;
  lastStartedAt: string | null;
  lastFinishedAt: string | null;
  lastSuccessAt: string | null;
  ok: boolean | null;
  error: string | null;
  durationMs: number | null;
  intervalMinutes: number;
  nextRunAt: string | null;
  feeds: { all: FeedInfo; stock: FeedInfo } | null;
  stats: Record<string, number> | null;
};

export const syncIntervalMinutes = () => Math.max(5, Number(process.env.IPRO_SYNC_MINUTES) || 30);
export const syncConfigured = () => /^[0-9a-f]{16,64}$/i.test(process.env.IPRO_XML_KEY ?? "");

const feedUrl = (kind: "all" | "stock") =>
  `https://www.ipromosyon.com/xml_things/${kind === "all" ? "iproapi" : "iproapi_cl"}/${process.env.IPRO_XML_KEY}`;

const writeJsonAtomic = (file: string, data: unknown) => writeData(file, JSON.stringify(data, null, 2) + "\n");

export async function readSyncStatus(): Promise<SyncStatus> {
  try {
    const text = await readText(STATUS_FILE);
    if (text) {
      const s = JSON.parse(text) as SyncStatus;
      // Sunucusuz ortamda yarıda kesilen çalışma "sürüyor" olarak takılı kalmasın
      if (s.running && Date.now() - Date.parse(s.lastStartedAt ?? "") > 5 * 60_000) s.running = false;
      return s;
    }
    throw new Error("yok");
  } catch {
    return {
      running: false, lastStartedAt: null, lastFinishedAt: null, lastSuccessAt: null, ok: null, error: null,
      durationMs: null, intervalMinutes: syncIntervalMinutes(), nextRunAt: null, feeds: null, stats: null,
    };
  }
}

async function fetchText(url: string): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 120_000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "PromoKitCatalogSync/1.0" } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const body = await r.text();
    if (!body.includes("<urunler")) throw new Error("Beklenmeyen yanıt (XML değil)");
    if (/<durum>\s*(?!basarili)/i.test(body.slice(0, 500))) throw new Error("Tedarikçi XML'i başarısız durum bildirdi");
    return body;
  } finally {
    clearTimeout(t);
  }
}

/** Setlerden hazır kit tanımları üretir (stokta olanlar öne çıkar) */
export function kitsFromSets(products: Product[]): ReadyKit[] {
  const sets = products
    .filter((p) => p.category === "hediye-set" && p.setContents.length > 0)
    .sort((a, b) => Number((b.stockQuantity ?? 0) > 0) - Number((a.stockQuantity ?? 0) > 0) || (a.price ?? 0) - (b.price ?? 0));
  return sets.map((p, i) => ({
    slug: p.slug,
    name: p.name.replace(/\s*Kutulu Özel Set$/i, " Seti"),
    tagline: p.setContents.map((c) => c.name).slice(0, 3).join(" · "),
    description: `${p.setContents.map((c) => c.name).join(", ")}. Özel kutusunda, logonuzla kişiselleştirilmiş olarak teslim edilir.`,
    story: `${p.setContents.length} parçadan oluşan, özel kutusunda teslim edilen kurumsal hediye seti. Kutu ve ürün renkleri seçilebilir; logonuz ${p.printingMethods.slice(0, 2).join(" veya ") || "uygun baskı yöntemiyle"} uygulanır.`,
    audience: "Kurumsal hediye",
    purpose: "Müşteri, çalışan ve iş ortağı hediyesi",
    recommendedQuantity: p.minOrderQty ? `${p.minOrderQty}+ adet` : "Adet seçimi serbest",
    personalization: p.printingMethods.slice(0, 5),
    tone: i % 3 === 1 ? "dark" : "light",
    rule: { purpose: "client", categories: ["hediye-set"] },
    items: [{ productCode: p.productCode, qty: 1, role: "Kutulu set" }],
    isFeatured: i < 6 && (p.stockQuantity ?? 0) > 0,
  }));
}

let inFlight: Promise<SyncStatus> | null = null;

/** XML'leri çekip kataloğu yeniler. Aynı anda tek çalışma; hata olursa eski katalog korunur. */
export function runSync(opts: { seed?: boolean } = {}): Promise<SyncStatus> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const prev = await readSyncStatus();
    const started = Date.now();
    const base: SyncStatus = { ...prev, running: true, lastStartedAt: new Date(started).toISOString(), intervalMinutes: syncIntervalMinutes() };
    await writeJsonAtomic(STATUS_FILE, base);
    let status: SyncStatus;
    try {
      if (!syncConfigured()) throw new Error("IPRO_XML_KEY tanımlı değil (.env)");
      const [all, stock] = await Promise.all([fetchText(feedUrl("all")), fetchText(feedUrl("stock"))]);
      const r = parseIpromosyon(all, stock);
      if (r.stats.products < 50) throw new Error(`Şüpheli küçük besleme (${r.stats.products} ürün); katalog değiştirilmedi`);
      const kits = { kits: kitsFromSets(r.catalog.products) };
      await writeJsonAtomic(COSTS_FILE, { generatedAt: r.catalog.meta.generatedAt, products: r.costs });
      await writeJsonAtomic(SYNCED_KITS_FILE, kits);
      await writeJsonAtomic(SYNCED_CATALOG_FILE, r.catalog);
      if (opts.seed) {
        await writeJsonAtomic(path.join(DATA_DIR, "catalog.json"), r.catalog);
        await writeJsonAtomic(path.join(DATA_DIR, "kits.json"), kits);
      }
      const fin = new Date().toISOString();
      status = { ...base, running: false, lastFinishedAt: fin, lastSuccessAt: fin, ok: true, error: null, durationMs: Date.now() - started, feeds: r.feeds, stats: r.stats };
    } catch (e) {
      status = { ...base, running: false, lastFinishedAt: new Date().toISOString(), ok: false, error: (e instanceof Error ? e.message : String(e)).replaceAll(process.env.IPRO_XML_KEY || "\u0000", "***"), durationMs: Date.now() - started };
    }
    status.nextRunAt = new Date(Date.now() + syncIntervalMinutes() * 60_000).toISOString();
    await writeJsonAtomic(STATUS_FILE, status);
    return status;
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}
