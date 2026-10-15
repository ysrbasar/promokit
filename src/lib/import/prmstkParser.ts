import * as cheerio from "cheerio";
import type { AnyNode, Element } from "domhandler";
import { cleanText, parsePrice, parseStock } from "./parseValues";
import { normalize } from "../catalog/search";

/**
 * prmstk.com/2027/N.html stok sayfası ayrıştırıcısı.
 *
 * Gerçek sayfa yapısı bu ortamdan doğrulanamadığı için üç strateji sırayla denenir:
 *  1. config.selectors — `npm run scrape:inspect` çıktısına göre elle ayarlanan seçiciler
 *  2. Başlık satırı tanınan tablolar (Kod / Ürün / Renk / Stok / Fiyat sütunları)
 *  3. "Stok" etiketi içeren ürün blokları (Kod: … Renk: … Stok: …)
 * Hiçbiri sonuç vermezse sayfa "parse-empty" uyarısıyla raporlanır; veri uydurulmaz.
 */

export type RawRecord = {
  page: number;
  sourceUrl: string;
  code: string;
  baseCode: string;
  name: string | null;
  color: string | null;
  stock: number | null;
  stockRaw: string | null;
  price: number | null;
  priceCurrency: string | null;
  imageUrl: string | null;
  specs: Record<string, string>;
  strategy: "selectors" | "table" | "block";
};

export type ParserConfig = {
  /** Ürün kodu deseni (varsayılan: harf/rakam karışık, en az bir rakam, 3–20 karakter) */
  codePattern?: string;
  /** Varyant kodundan ana kodu çıkaran desen; 1. yakalama grubu ana koddur */
  baseCodePattern?: string;
  selectors?: {
    product: string;
    code: string;
    name?: string;
    color?: string;
    stock: string;
    price?: string;
    image?: string;
  } | null;
};

export const DEFAULT_CODE_PATTERN = "\\b(?=[A-Z0-9.\\-/]*\\d)[A-Z0-9][A-Z0-9.\\-/]{2,19}\\b";
export const DEFAULT_BASE_PATTERN = "^(.+?)(?:[-_ /](?:[A-Z]{1,3}|\\d{1,2}))?$";

export function baseCodeOf(code: string, pattern = DEFAULT_BASE_PATTERN): string {
  const m = code.trim().toUpperCase().match(new RegExp(pattern));
  return (m?.[1] ?? code).trim();
}

export function absoluteUrl(src: string | undefined | null, pageUrl: string): string | null {
  if (!src) return null;
  const s = src.trim().split(/\s+/)[0];
  if (!s || s.startsWith("data:")) return null;
  try {
    return new URL(s, pageUrl).toString();
  } catch {
    return null;
  }
}

function imgSrc($: cheerio.CheerioAPI, el: cheerio.Cheerio<AnyNode>, pageUrl: string): string | null {
  const img = el.is("img") ? el : el.find("img").first();
  if (!img.length) return null;
  const candidate =
    img.attr("data-src") || img.attr("data-original") || img.attr("data-lazy") || img.attr("srcset") || img.attr("src");
  const url = absoluteUrl(candidate, pageUrl);
  // Logo, ikon, boşluk görsellerini ele
  if (url && /(logo|icon|spacer|blank|pixel|banner|sprite)\b/i.test(url)) return null;
  return url;
}

const BLOCK_TAGS = new Set(["p", "div", "li", "br", "tr", "td", "th", "h1", "h2", "h3", "h4", "h5", "h6", "section", "article", "dd", "dt"]);

/** Blok öğeler arasına satır sonu koyarak metin çıkarır ("Kod: 1Renk: Gri" birleşmesini önler) */
export function blockText(node: AnyNode): string {
  if (node.type === "text") return (node as unknown as { data: string }).data;
  if (node.type !== "tag" && node.type !== "root") return "";
  const el = node as Element;
  const inner = (el.children ?? []).map(blockText).join("");
  return el.type === "tag" && BLOCK_TAGS.has(el.name) ? `\n${inner}\n` : inner;
}

type ColumnMap = { code?: number; name?: number; color?: number; stock?: number; price?: number; image?: number };

const HEADER_RULES: [keyof ColumnMap, RegExp][] = [
  ["code", /^(urun |stok )?kod(u)?$|^kod no$|^code$|^sku$|^urun no$|^model$/],
  ["stock", /stok|miktar|mevcut|adet|qty|quantity/],
  ["color", /renk|colou?r/],
  ["price", /fiyat|price|tutar/],
  ["image", /resim|gorsel|foto|image/],
  ["name", /urun|aciklama|adi|tanim|isim|name|description/],
];

export function mapHeader(cells: string[]): ColumnMap {
  const map: ColumnMap = {};
  cells.forEach((raw, i) => {
    const t = normalize(raw).replace(/[^a-z0-9 ]/g, "").trim();
    if (!t) return;
    for (const [k, re] of HEADER_RULES) {
      if (map[k] === undefined && re.test(t)) {
        map[k] = i;
        return;
      }
    }
  });
  return map;
}

function tableStrategy($: cheerio.CheerioAPI, page: number, pageUrl: string, cfg: Required<Pick<ParserConfig, "codePattern" | "baseCodePattern">>): RawRecord[] {
  const out: RawRecord[] = [];
  const codeRe = new RegExp(`^${cfg.codePattern}$`);

  $("table").each((_, table) => {
    const rows = $(table).find("tr").toArray();
    let cols: ColumnMap | null = null;
    let headerIdx = -1;
    for (let i = 0; i < Math.min(rows.length, 5); i++) {
      const cells = $(rows[i]).children("th,td").toArray().map((c) => $(c).text());
      const m = mapHeader(cells);
      if (m.code !== undefined && m.stock !== undefined) {
        cols = m;
        headerIdx = i;
        break;
      }
    }
    if (!cols) return;

    // Tablo düzeyinde görsel (tablodan hemen önceki öğe veya başlık satırı)
    const tableImage =
      rows.slice(0, headerIdx + 1).map((r) => imgSrc($, $(r), pageUrl)).find(Boolean) ??
      imgSrc($, $(table).prev(), pageUrl);
    let lastName: string | null = null;
    let lastImage: string | null = null;

    for (const row of rows.slice(headerIdx + 1)) {
      const cells = $(row).children("td,th").toArray();
      const at = (i: number | undefined) => (i === undefined || !cells[i] ? null : cleanText($(cells[i]).text()));
      const code = at(cols.code)?.toUpperCase().replace(/\s+/g, "") ?? null;
      if (!code || !codeRe.test(code)) continue;
      const name: string | null = at(cols.name) ?? lastName;
      const rowImage = (cols.image !== undefined && cells[cols.image] ? imgSrc($, $(cells[cols.image]), pageUrl) : null) ?? imgSrc($, $(row), pageUrl);
      const image = rowImage ?? lastImage ?? tableImage;
      const stockRaw = at(cols.stock);
      const price = parsePrice(at(cols.price));
      lastName = name;
      if (rowImage) lastImage = rowImage;
      out.push({
        page,
        sourceUrl: pageUrl,
        code,
        baseCode: baseCodeOf(code, cfg.baseCodePattern),
        name,
        color: at(cols.color),
        stock: parseStock(stockRaw),
        stockRaw,
        price: price?.amount ?? null,
        priceCurrency: price?.currency ?? null,
        imageUrl: image,
        specs: {},
        strategy: "table",
      });
    }
  });
  return out;
}

const LABEL = {
  code: /(?:ürün\s*|urun\s*|stok\s*)?kod(?:u)?\s*(?:no)?\s*[:：]\s*([A-Z0-9][A-Z0-9.\-/]{1,19})/i,
  color: /renk\s*[:：]\s*([^\n|;:]{2,30}?)(?=\s{2,}|\s*(?:stok|kod|fiyat|ölçü|olcu|malzeme|kapasite)\b|[\n|;]|$)/i,
  stock: /stok(?:\s*(?:adedi|miktarı|miktari|durumu))?\s*[:：]?\s*((?:[<>]?\s*\d[\d.,]*\s*\+?)|stokta yok|yok|tükendi|tukendi|-)/i,
  price: /fiyat(?:ı|i)?\s*[:：]\s*([\d.,]+\s*(?:tl|₺|usd|\$|eur|€)?)/i,
  spec: /(malzeme|ölçü|olcu|ebat|boyut|kapasite|baskı|baski)\s*[:：]\s*([^\n|;]{2,60}?)(?=\s{2,}|[\n|;]|$)/gi,
};

function blockStrategy($: cheerio.CheerioAPI, page: number, pageUrl: string, cfg: Required<Pick<ParserConfig, "codePattern" | "baseCodePattern">>): RawRecord[] {
  const out: RawRecord[] = [];
  const seen = new Set<Element>();

  // "stok" içeren en küçük öğeler; ardından kod ve görsel içeren ilk ataya çıkılır
  const leaves = $("body *")
    .toArray()
    .filter((el): el is Element => el.type === "tag" && /stok/i.test($(el).text()) && $(el).children().filter((_, c) => /stok/i.test($(c).text())).length === 0);

  for (const leaf of leaves) {
    let node: cheerio.Cheerio<Element> = $(leaf);
    let found: Element | null = null;
    for (let depth = 0; depth < 6 && node.length; depth++) {
      const text = node.text();
      if (LABEL.code.test(text) && (node.find("img").length || node.is("img"))) {
        found = node.get(0) ?? null;
        break;
      }
      node = node.parent() as cheerio.Cheerio<Element>;
    }
    if (!found || seen.has(found)) continue;
    // Birden fazla ürünü kapsayan bir kapsayıcıya çıkıldıysa atla
    const block = $(found);
    const text = blockText(found).replace(/[ \t\u00a0]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
    const codeMatches = text.match(new RegExp(LABEL.code.source, "gi")) ?? [];
    if (codeMatches.length > 1) continue;
    seen.add(found);

    const code = text.match(LABEL.code)?.[1]?.toUpperCase() ?? null;
    if (!code) continue;
    const stockRaw = text.match(LABEL.stock)?.[1]?.trim() ?? null;
    const specs: Record<string, string> = {};
    for (const m of text.matchAll(LABEL.spec)) specs[m[1][0].toLocaleUpperCase("tr-TR") + m[1].slice(1).toLocaleLowerCase("tr-TR")] = m[2].trim();
    const price = parsePrice(text.match(LABEL.price)?.[1]);
    const heading = cleanText(block.find("h1,h2,h3,h4,h5,strong,b,.title,.name,.urun-adi").first().text());

    out.push({
      page,
      sourceUrl: pageUrl,
      code,
      baseCode: baseCodeOf(code, cfg.baseCodePattern),
      name: heading && !LABEL.code.test(heading) ? heading : null,
      color: cleanText(text.match(LABEL.color)?.[1]),
      stock: parseStock(stockRaw),
      stockRaw,
      price: price?.amount ?? null,
      priceCurrency: price?.currency ?? null,
      imageUrl: imgSrc($, block, pageUrl),
      specs,
      strategy: "block",
    });
  }
  return out;
}

function selectorStrategy($: cheerio.CheerioAPI, page: number, pageUrl: string, cfg: ParserConfig & Required<Pick<ParserConfig, "baseCodePattern">>): RawRecord[] {
  const s = cfg.selectors;
  if (!s) return [];
  const out: RawRecord[] = [];
  $(s.product).each((_, el) => {
    const block = $(el);
    const pick = (sel?: string) => (sel ? cleanText(block.find(sel).first().text()) : null);
    const code = pick(s.code)?.toUpperCase().replace(/\s+/g, "");
    if (!code) return;
    const stockRaw = pick(s.stock);
    const price = parsePrice(pick(s.price));
    out.push({
      page,
      sourceUrl: pageUrl,
      code,
      baseCode: baseCodeOf(code, cfg.baseCodePattern),
      name: pick(s.name),
      color: pick(s.color),
      stock: parseStock(stockRaw),
      stockRaw,
      price: price?.amount ?? null,
      priceCurrency: price?.currency ?? null,
      imageUrl: imgSrc($, s.image ? block.find(s.image) : block, pageUrl),
      specs: {},
      strategy: "selectors",
    });
  });
  return out;
}

export function parsePrmstkPage(html: string, pageUrl: string, page: number, config: ParserConfig = {}) {
  const $ = cheerio.load(html);
  const cfg = {
    ...config,
    codePattern: config.codePattern ?? DEFAULT_CODE_PATTERN,
    baseCodePattern: config.baseCodePattern ?? DEFAULT_BASE_PATTERN,
  };
  const warnings: string[] = [];
  let records = selectorStrategy($, page, pageUrl, cfg);
  if (!records.length) records = tableStrategy($, page, pageUrl, cfg);
  if (!records.length) records = blockStrategy($, page, pageUrl, cfg);
  if (!records.length) warnings.push("parse-empty: sayfada tanınan ürün yapısı bulunamadı (scrape:inspect ile seçicileri ayarlayın)");
  const noImage = records.filter((r) => !r.imageUrl).length;
  if (noImage) warnings.push(`${noImage} kayıtta görsel bulunamadı`);
  const unknownStock = records.filter((r) => r.stock === null).length;
  if (unknownStock) warnings.push(`${unknownStock} kayıtta stok değeri okunamadı`);
  return { records, warnings };
}

/** --inspect: gerçek sayfanın yapısını özetler, seçicileri ayarlamak için */
export function inspectPage(html: string, pageUrl: string) {
  const $ = cheerio.load(html);
  const tables = $("table")
    .toArray()
    .slice(0, 10)
    .map((t) => ({
      rows: $(t).find("tr").length,
      firstRows: $(t)
        .find("tr")
        .toArray()
        .slice(0, 3)
        .map((r) => $(r).children("td,th").toArray().map((c) => cleanText($(c).text())?.slice(0, 40) ?? "")),
      images: $(t).find("img").length,
    }));
  const images = $("img")
    .toArray()
    .slice(0, 15)
    .map((i) => ({ src: absoluteUrl($(i).attr("src"), pageUrl), dataSrc: $(i).attr("data-src") ?? null, alt: $(i).attr("alt") ?? null, parentClass: $(i).parent().attr("class") ?? null }));
  const stockSnippets = ($("body").text().replace(/\s+/g, " ").match(/.{0,80}stok.{0,80}/gi) ?? []).slice(0, 10);
  const classCounts = new Map<string, number>();
  $("[class]").each((_, el) => {
    for (const c of ($(el).attr("class") ?? "").split(/\s+/)) if (c) classCounts.set(c, (classCounts.get(c) ?? 0) + 1);
  });
  const repeatedClasses = [...classCounts.entries()].filter(([, n]) => n >= 4).sort((a, b) => b[1] - a[1]).slice(0, 20);
  return { title: $("title").text().trim(), tables, images, stockSnippets, repeatedClasses, bytes: html.length };
}
