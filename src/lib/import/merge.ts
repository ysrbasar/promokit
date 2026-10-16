import type { Product, SourceNote, Variant } from "../catalog/schema";
import { budgetTierFromPrice, classifyCategory, colorHex, completeness, deriveTags, slugify } from "../catalog/enrich";
import { normalizeCode } from "../catalog/search";
import type { RawRecord } from "./prmstkParser";
import type { SiteRecord } from "./siteParser";

/**
 * CatalogImportService — kaynakları ürün koduna göre birleştirir.
 *  - Ana anahtar: normalize edilmiş ana ürün kodu
 *  - Aynı varyant birden çok kez gelirse tek kayıt olur; stok çelişkisi raporlanır
 *  - Fiyat yalnızca site kaydında açıkça varsa "source" tipinde alınır
 *  - Birden fazla ürüne ait görünen görsel güvenilmez kabul edilir ve incelemeye alınır
 * Çıktı deterministiktir: aynı girdiyle tekrar çalıştırmak mükerrer kayıt üretmez.
 */

export type PdfIndex = { codes: Record<string, number[]> };

export type ReviewItem = { productCode: string; reason: string; detail?: string };

export type MergeInput = {
  prmstk: RawRecord[];
  site?: SiteRecord[];
  pdf?: PdfIndex | null;
  fetchedAt: Record<number, string>;
  now: string;
};

export function mergeCatalog(input: MergeInput): { products: Product[]; review: ReviewItem[] } {
  const review: ReviewItem[] = [];
  const groups = new Map<string, RawRecord[]>();
  // Aynı sayfadaki aynı varyant kodu tek kayıttır (tekrar çalıştırma / mükerrer girdi)
  const unique = new Map<string, RawRecord>();
  for (const r of input.prmstk) unique.set(`${r.page}|${normalizeCode(r.code)}`, r);
  for (const r of unique.values()) {
    const key = normalizeCode(r.baseCode);
    if (!key) continue;
    const g = groups.get(key);
    if (g) g.push(r);
    else groups.set(key, [r]);
  }

  // Site kayıtlarını hem ana koda hem varyant koduna göre indeksle
  const siteByCode = new Map<string, SiteRecord>();
  for (const s of input.site ?? []) if (s.code) siteByCode.set(normalizeCode(s.code), s);

  // Aynı görsel URL'si birden fazla ana koda atanmışsa güvenilmez
  const imageOwners = new Map<string, Set<string>>();
  for (const [key, recs] of groups) {
    for (const r of recs) {
      if (!r.imageUrl) continue;
      const set = imageOwners.get(r.imageUrl) ?? new Set();
      set.add(key);
      imageOwners.set(r.imageUrl, set);
    }
  }

  const products: Product[] = [];
  for (const [key, recs] of [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const productCode = recs[0].baseCode.trim().toUpperCase();
    const sources: SourceNote[] = [];
    const needsReview: string[] = [];

    // Varyantlar: kod başına tek kayıt
    const byVariant = new Map<string, RawRecord>();
    for (const r of recs) {
      const vk = normalizeCode(r.code);
      const prev = byVariant.get(vk);
      if (!prev) {
        byVariant.set(vk, r);
        continue;
      }
      if (prev.stock !== r.stock) {
        sources.push({ field: `stock:${r.code}`, source: "prmstk", value: `${prev.stock} / ${r.stock}`, note: `sayfa ${prev.page} ve ${r.page} farklı` });
        needsReview.push("stock-conflict");
        review.push({ productCode, reason: "stock-conflict", detail: `${r.code}: s.${prev.page}=${prev.stock}, s.${r.page}=${r.stock}` });
        // Muhafazakâr: daha düşük (bilinen) stoğu kullan
        const keep = prev.stock === null ? r : r.stock === null ? prev : prev.stock <= r.stock ? prev : r;
        byVariant.set(vk, keep);
      }
    }

    const variants: Variant[] = [...byVariant.values()]
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((r) => ({
        code: r.code.toUpperCase(),
        color: r.color,
        colorHex: colorHex(r.color),
        stockQuantity: r.stock,
        stockUpdatedAt: input.fetchedAt[r.page] ?? null,
        imageUrl: r.imageUrl && (imageOwners.get(r.imageUrl)?.size ?? 0) === 1 ? r.imageUrl : null,
      }));

    const site = siteByCode.get(key) ?? variants.map((v) => siteByCode.get(normalizeCode(v.code))).find(Boolean) ?? null;

    // Ad: en sık geçen kaynak adı; site adıyla farklıysa kaydet
    const nameCounts = new Map<string, number>();
    for (const r of recs) if (r.name) nameCounts.set(r.name, (nameCounts.get(r.name) ?? 0) + 1);
    const stockName = [...nameCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const name = stockName ?? site?.name ?? null;
    if (stockName && site?.name && slugify(stockName) !== slugify(site.name)) {
      sources.push({ field: "name", source: "site", value: site.name, note: "stok sayfasındaki addan farklı" });
    }
    if (!name) {
      needsReview.push("missing-name");
      review.push({ productCode, reason: "missing-name" });
    }

    // Görsel
    const ownImages = recs.map((r) => r.imageUrl).filter((u): u is string => !!u && (imageOwners.get(u)?.size ?? 0) === 1);
    const shared = recs.some((r) => r.imageUrl && (imageOwners.get(r.imageUrl)?.size ?? 0) > 1);
    if (shared) {
      needsReview.push("image-shared");
      review.push({ productCode, reason: "image-shared", detail: "aynı görsel birden fazla ürün koduna atanmış" });
    }
    const gallery = [...new Set([...ownImages, ...(site?.images ?? [])])];
    const imageOriginalUrl = gallery[0] ?? null;
    if (!imageOriginalUrl) {
      needsReview.push("missing-image");
      review.push({ productCode, reason: "missing-image" });
    }

    // Kategori
    const category =
      classifyCategory(site?.breadcrumbs.slice(1).join(" ")) ??
      classifyCategory(name, recs[0].specs["Tür"], site?.description) ??
      classifyCategory(recs.map((r) => r.imageUrl?.split("/").pop()?.replace(/[-_]/g, " ")).join(" ")) ??
      "diger";
    if (category === "diger") review.push({ productCode, reason: "category-unknown", detail: name ?? undefined });

    // Fiyat: yalnızca sitede açıkça varsa
    const price = site?.price ?? null;
    const stockPrices = recs.map((r) => r.price).filter((p): p is number => p !== null);
    if (price === null && stockPrices.length) {
      sources.push({ field: "price", source: "prmstk", value: String(stockPrices[0]), note: "stok sayfasında görülen fiyat; doğrulanmadı" });
    }

    const specs: Record<string, string> = { ...Object.assign({}, ...recs.map((r) => r.specs)), ...(site?.specs ?? {}) };
    const pick = (re: RegExp) => Object.entries(specs).find(([k]) => re.test(k.toLocaleLowerCase("tr-TR")))?.[1] ?? null;

    const known = variants.map((v) => v.stockQuantity).filter((q): q is number => q !== null);
    if (known.length === 0) review.push({ productCode, reason: "stock-unknown" });

    const pdfPages = input.pdf?.codes[key] ?? null;
    const resolvedName = name ?? productCode;
    const base = {
      id: key,
      productCode,
      name: resolvedName,
      slug: `${slugify(resolvedName)}-${slugify(productCode)}`,
      category,
      subcategory: site?.breadcrumbs.at(-1) ?? null,
      description: site?.description ?? null,
      technicalSpecifications: specs,
      dimensions: pick(/ölçü|olcu|ebat|boyut/),
      material: pick(/malzeme/),
      capacity: pick(/kapasite|hacim/),
      availableColors: [...new Set(variants.map((v) => v.color).filter((c): c is string => !!c))],
      variants,
      stockQuantity: known.length ? known.reduce((a, b) => a + b, 0) : null,
      stockStatus: "unknown" as const,
      stockUpdatedAt: variants.map((v) => v.stockUpdatedAt).filter(Boolean).sort().at(-1) ?? null,
      price,
      priceCurrency: price !== null ? site?.priceCurrency ?? "TRY" : null,
      priceType: price !== null ? ("source" as const) : null,
      sourcePage: recs.map((r) => r.sourceUrl)[0] ?? null,
      sourceProductUrl: site?.url ?? null,
      sourcePdfPage: pdfPages?.[0] ?? null,
      imageOriginalUrl,
      localImagePath: null,
      gallery,
      printingMethods: [],
      tags: site?.breadcrumbs.slice(1) ?? [],
      budgetTier: budgetTierFromPrice(price),
      isActive: true,
      isFeatured: false,
      lastVerifiedAt: input.now,
      sources: [
        { field: "stock", source: "prmstk" as const, value: `sayfa ${[...new Set(recs.map((r) => r.page))].join(", ")}` },
        ...(site ? [{ field: "detail", source: "site" as const, value: site.url }] : []),
        ...(pdfPages ? [{ field: "pdf", source: "pdf" as const, value: `sayfa ${pdfPages.join(", ")}` }] : []),
        ...sources,
      ],
      needsReview: [...new Set(needsReview)],
      isDemo: false,
    };
    const p: Product = { ...base, ...deriveTags(base), dataCompleteness: 0 };
    p.dataCompleteness = completeness(p);
    products.push(p);
  }

  // Slug çakışmalarını önle
  const slugs = new Map<string, number>();
  for (const p of products) {
    const n = slugs.get(p.slug) ?? 0;
    if (n > 0) p.slug = `${p.slug}-${n + 1}`;
    slugs.set(p.slug, n + 1);
  }
  return { products, review };
}
