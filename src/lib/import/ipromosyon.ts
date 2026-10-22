import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import type { CatalogFile, Product, Variant } from "../catalog/schema";
import { budgetTierFromPrice, classifyCategory, classifySubcategory, colorHex, completeness, deriveTags, slugify } from "../catalog/enrich";

/**
 * ipromosyon.com XML beslemeleri:
 *  - "hepsi"  (iproapi):    1 satır = 1 ürün; açıklama, liste/iskontolu fiyat, MOQ, baskı yöntemleri
 *  - "stoklu" (iproapi_cl): 1 satır = 1 varyant; varyant stoğu, gelecek stok, varyant fiyatı
 * Liste fiyatı (iskontosuz) müşteriye gösterilir; iskontolu fiyat MALİYETTİR ve ayrı dosyada tutulur.
 */

export type CostTable = Record<string, { cost: number | null; currency: string | null; variants: Record<string, number | null> }>;

export type FeedInfo = { generatedAt: string | null; count: number };
export type ImportResult = {
  catalog: CatalogFile;
  costs: CostTable;
  feeds: { all: FeedInfo; stock: FeedInfo };
  stats: { products: number; variants: number; inStock: number; outOfStock: number; sets: number; withPrice: number };
};

const ACRONYMS = new Set(["USB", "LED", "GB", "MB", "TB", "MAH", "PU", "ABS", "RPET", "PVC", "PP", "PET", "UV", "A4", "A5", "A6", "B5", "OTG", "TYPE-C", "LCD", "RGB", "3D", "2D", "XL", "XXL", "ML", "CM", "MM"]);

/** "KARE AHŞAP ANAHTARLIK" → "Kare Ahşap Anahtarlık" (kısaltmalar ve kodlar korunur) */
export function titleCaseTr(s: string): string {
  return s
    .trim()
    .split(/\s+/)
    .map((w) => {
      const up = w.toLocaleUpperCase("tr-TR");
      if (ACRONYMS.has(up) || /\d/.test(w)) return up;
      // W/Q/X içeren kelimeler İngilizcedir ("WIRELESS" → "Wireless", "Wıreless" değil)
      const loc = /[WQX]/i.test(w) ? "en-US" : "tr-TR";
      const lower = w.toLocaleLowerCase(loc);
      return lower.charAt(0).toLocaleUpperCase(loc) + lower.slice(1);
    })
    .join(" ");
}

/** XML içine kaçışlı gömülmüş HTML varlıklarını (&Ccedil; vb.) çözer, etiketleri temizler */
function decodeHtml(s: string | null | undefined): string | null {
  if (!s) return null;
  const t = cheerio.load(`<div>${s}</div>`)("div").text().replace(/\s+/g, " ").trim();
  return t || null;
}

const num = (t: string | null | undefined): number | null => {
  if (!t) return null;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
};

const currencyOf = (t: string | null | undefined) => (t === "$" ? "USD" : t === "€" ? "EUR" : "TRY");

/** Açıklamadaki tedarikçi ürün kodlarını ("* İMÖ3701- BEGE ...") ve madde işaretlerini temizler */
export function cleanDescription(t: string | null): string | null {
  if (!t) return null;
  const out = t
    .replace(/\*\s*/g, " · ")
    .replace(/(?<![\p{L}\d])[İI][A-ZÇĞİÖŞÜ]{2}\d{3,5}[A-Z]?(?![\p{L}\d])\s*-?\s*/gu, "")
    .replace(/\s+/g, " ")
    .replace(/^(\s*·\s*)+|(\s*·\s*)+$/g, "")
    .replace(/(\s*·\s*){2,}/g, " · ")
    .trim();
  return out || null;
}

/** "19-10-2026 12:40:36" → ISO */
export function parseFeedDate(t: string | null | undefined): string | null {
  const m = t?.match(/^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:${m[6]}+03:00` : null;
}

const COLOR_KEYS = ["RENK", "ÜRÜN RENK", "KUTU RENK", "KUTU"];

export function parseIpromosyon(allXml: string, stockXml: string, now = new Date().toISOString()): ImportResult {
  const $a = cheerio.load(allXml, { xml: true });
  const $s = cheerio.load(stockXml, { xml: true });
  const txt = ($: cheerio.CheerioAPI, el: Element, sel: string) => $(el).children(sel).first().text().trim() || null;

  // ── Stoklu besleme: ürün_id → varyantlar
  type SV = { variant: Variant; cost: number | null; images: string[] };
  const stockBy = new Map<string, SV[]>();
  $s("urunler > urun").each((_, el) => {
    const id = txt($s, el, "urun_id");
    if (!id) return;
    const opts = $s(el)
      .find("urun_secenekleri > secenek")
      .toArray()
      .map((o) => ({ key: ($s(o).attr("adi") ?? "").toLocaleUpperCase("tr-TR"), value: titleCaseTr($s(o).text()) }))
      .filter((o) => o.value);
    const colorOpt = COLOR_KEYS.map((k) => opts.find((o) => o.key === k)).find(Boolean);
    const images = $s(el).find("resimler > resim").toArray().map((r) => $s(r).text().trim()).filter(Boolean);
    const incoming = $s(el)
      .find("gelecek_stoklar > gelecek_stok")
      .toArray()
      .map((g) => ({ qty: Number($s(g).children("stok").text()) || 0, date: $s(g).children("tarih").text().trim() }))
      .filter((g) => g.qty > 0 && g.date);
    const stock = Number(txt($s, el, "toplam_stok") ?? "");
    const code = (txt($s, el, "kod") ?? `${id}-${txt($s, el, "stok_id")}`).toLocaleUpperCase("tr-TR");
    const list = stockBy.get(id) ?? [];
    list.push({
      variant: {
        code,
        color: colorOpt?.value ?? null,
        colorHex: colorHex(colorOpt?.value ?? null),
        stockQuantity: Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : null,
        stockUpdatedAt: now,
        imageUrl: images[0] ?? null,
        label: opts.map((o) => o.value).join(" / ") || null,
        options: opts.map((o) => ({ name: titleCaseTr(o.key), value: o.value })),
        price: num(txt($s, el, "iskontosuz_stoklu_urun_fiyat")),
        incoming,
      },
      cost: num(txt($s, el, "stoklu_urun_fiyat")),
      images,
    });
    stockBy.set(id, list);
  });

  // ── Ana besleme: ürünler
  const products: Product[] = [];
  const costs: CostTable = {};
  const nameByCode = new Map<string, string>();
  const rawSets: { product: Product; desc: string }[] = [];

  $a("urunler > urun").each((_, el) => {
    const id = txt($a, el, "urun_id");
    const code = txt($a, el, "urun_kodu");
    const rawName = txt($a, el, "urun_adi");
    if (!id || !code || !rawName) return;
    const name = titleCaseTr(rawName);
    const subcategory = decodeHtml($a(el).children("urun_kategori").text());
    const descRaw = $a(el).children("urun_aciklama").text();
    const description = cleanDescription(decodeHtml(descRaw));
    const svs = stockBy.get(id) ?? [];
    const variants = svs.map((x) => x.variant);
    const images = [...new Set([...$a(el).find("resimler > resim").toArray().map((r) => $a(r).text().trim()), ...svs.flatMap((x) => x.images)])].filter(Boolean);
    const currency = currencyOf(txt($a, el, "para_birimi"));
    const listPrice = num(txt($a, el, "iskontosuz_fiyat")) ?? (variants.length ? Math.min(...variants.map((v) => v.price ?? Infinity)) : null);
    const price = listPrice !== null && Number.isFinite(listPrice) ? listPrice : null;
    const cost = num(txt($a, el, "urun_fiyat")) ?? (svs.length ? Math.min(...svs.map((x) => x.cost ?? Infinity)) : null);
    const known = variants.map((v) => v.stockQuantity).filter((q): q is number => q !== null);
    const isSet = /kutulu.*set|özel set/i.test(subcategory ?? "") || /kutulu .*set/i.test(name);
    const category = isSet ? "hediye-set" : classifySubcategory(subcategory) ?? classifyCategory(name) ?? "diger";
    const moq = Number(txt($a, el, "minimum_siparis_adeti"));
    const printing = $a(el).find("baski_alternatifleri > baski").toArray().map((b) => titleCaseTr($a(b).text())).filter(Boolean);

    costs[code] = {
      cost: cost !== null && Number.isFinite(cost) ? cost : null,
      currency,
      variants: Object.fromEntries(svs.map((x) => [x.variant.code, x.cost])),
    };
    nameByCode.set(code.toLocaleUpperCase("tr-TR"), name);

    const base = {
      id: `ipro-${id}`,
      productCode: code,
      name,
      slug: `${slugify(name)}-${slugify(code)}`,
      category,
      subcategory,
      description,
      technicalSpecifications: {} as Record<string, string>,
      dimensions: null,
      material: null,
      capacity: null,
      availableColors: [...new Set(variants.map((v) => v.color).filter((c): c is string => !!c))],
      variants,
      // Stoklu beslemede olmayan ürün: tedarikçide stok yok (siparişe özel üretim olabilir)
      stockQuantity: known.length ? known.reduce((a, b) => a + b, 0) : 0,
      stockStatus: "unknown" as const,
      stockUpdatedAt: now,
      price,
      priceCurrency: price !== null ? currency : null,
      priceType: price !== null ? ("source" as const) : null,
      sourcePage: null,
      sourceProductUrl: null,
      sourcePdfPage: null,
      imageOriginalUrl: images[0] ?? null,
      localImagePath: null,
      gallery: images,
      printingMethods: printing,
      tags: subcategory ? [subcategory] : [],
      budgetTier: budgetTierFromPrice(currency === "TRY" ? price : null),
      isActive: true,
      isFeatured: false,
      lastVerifiedAt: now,
      sources: [{ field: "*", source: "ipromosyon" as const, value: `urun_id ${id}` }],
      needsReview: images.length ? [] : ["missing-image"],
      isDemo: false,
      vatRate: num(txt($a, el, "kdv_orani")),
      minOrderQty: Number.isFinite(moq) && moq > 0 ? moq : null,
      stockKept: txt($a, el, "stoklu_urun") === "true",
      setContents: [] as { code: string; name: string }[],
      supplier: "ipromosyon" as const,
    };
    const p: Product = { ...base, ...deriveTags(base), dataCompleteness: 0 };
    p.dataCompleteness = completeness(p);
    products.push(p);
    if (isSet) rawSets.push({ product: p, desc: descRaw });
  });

  // Set içerikleri: açıklamadaki "* İXX1234 - AD" satırları
  for (const { product, desc } of rawSets) {
    const text = decodeHtml(desc) ?? "";
    const seen = new Set<string>();
    for (const m of text.matchAll(/\*\s*(İ[A-ZÇĞİÖŞÜ]{2}\d{3,5}[A-Z]?)\s*-\s*([^*]+?)(?=\s*\*|\s*KUTU EBAT|\s*SET İÇERİĞİ|$)/gu)) {
      const c = m[1].toLocaleUpperCase("tr-TR");
      if (seen.has(c) || c === product.productCode.toLocaleUpperCase("tr-TR")) continue;
      seen.add(c);
      product.setContents.push({ code: c, name: nameByCode.get(c) ?? titleCaseTr(m[2].replace(/\/.*$/, "").trim()) });
    }
  }

  // Slug çakışmalarını önle
  const slugs = new Map<string, number>();
  for (const p of products) {
    const n = slugs.get(p.slug) ?? 0;
    if (n) p.slug = `${p.slug}-${n + 1}`;
    slugs.set(p.slug, n + 1);
  }

  const allDate = parseFeedDate($a("urunler > olusturma_tarihi").text().trim());
  const stockDate = parseFeedDate($s("urunler > olusturma_tarihi").text().trim());
  const inStock = products.filter((p) => (p.stockQuantity ?? 0) > 0).length;
  return {
    catalog: {
      meta: { kind: "import", generatedAt: now, note: `ipromosyon XML · ürün: ${allDate ?? "?"} · stok: ${stockDate ?? "?"}` },
      products,
    },
    costs,
    feeds: { all: { generatedAt: allDate, count: products.length }, stock: { generatedAt: stockDate, count: [...stockBy.values()].flat().length } },
    stats: {
      products: products.length,
      variants: products.reduce((s, p) => s + p.variants.length, 0),
      inStock,
      outOfStock: products.length - inStock,
      sets: rawSets.length,
      withPrice: products.filter((p) => p.price !== null).length,
    },
  };
}
