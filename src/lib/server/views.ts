import "server-only";
import { toLite, type LiteProduct } from "../catalog/lite";
import { priceKit, type KitPricing } from "../catalog/pricing";
import type { Product } from "../catalog/schema";
import { isProductEligible } from "../catalog/stock";
import { kindOf } from "../kit/recommendation";
import { resolveReadyKit, type ReadyKit, type ResolvedLine } from "../kit/readyKits";
import { getCatalog, getReadyKits, getSettings } from "./repositories";

export type KitView = {
  kit: ReadyKit;
  lines: (ResolvedLine & { product: LiteProduct })[];
  availability: "available" | "partial";
  notes: string[];
  pricing: KitPricing;
  pieces: number;
};

export async function getKitViews(): Promise<KitView[]> {
  const [{ products }, kits, settings] = await Promise.all([getCatalog(), getReadyKits(), getSettings()]);
  const map = new Map(products.map((p) => [p.productCode, p]));
  return kits.map((kit) => {
    const r = resolveReadyKit(kit, products, settings);
    const lines = r.lines.map((l) => ({ ...l, product: toLite(map.get(l.productCode)!) }));
    return {
      kit,
      lines,
      availability: r.availability,
      notes: r.notes,
      pricing: priceKit(lines.map((l) => ({ productCode: l.productCode, qtyPerKit: l.qty })), map, 1),
      pieces: lines.reduce((s, l) => s + l.qty, 0),
    };
  });
}

export async function getKitView(slug: string) {
  return (await getKitViews()).find((k) => k.kit.slug === slug) ?? null;
}

export async function getFeaturedProducts(limit = 8): Promise<LiteProduct[]> {
  const [{ products }, settings] = await Promise.all([getCatalog(), getSettings()]);
  const eligible = products.filter((p) => isProductEligible(p, settings.minStock));
  const featured = eligible.filter((p) => p.isFeatured);
  const rest = eligible.filter((p) => !p.isFeatured).sort((a, b) => b.dataCompleteness - a.dataCompleteness);
  return [...featured, ...rest].slice(0, limit).map(toLite);
}

export async function getCategoryCounts() {
  const { products } = await getCatalog();
  const counts = new Map<string, number>();
  // Katalog varsayılan olarak tüm ürünleri (stokta olmayanlar etiketli) listeler; sayılar da öyle
  for (const p of products) if (p.isActive) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  return counts;
}

/**
 * Hero vitrini: stoktaki, görselli ürünlerden kategorileri sırayla karıştırarak bir havuz kurar.
 * Ardışık her 4'lü grup mümkün olduğunca farklı kategorilerden (ve farklı alt kategorilerden) oluşur.
 */
export async function getShowcaseProducts(limit = 48): Promise<LiteProduct[]> {
  const [{ products }, settings] = await Promise.all([getCatalog(), getSettings()]);
  const byCat = new Map<string, Product[]>();
  for (const p of products) {
    if (!p.isActive || !p.imageOriginalUrl || !isProductEligible(p, settings.minStock)) continue;
    const list = byCat.get(p.category) ?? [];
    // Aynı türden yalnızca bir ürün (ör. tek bir USB bellek)
    if (!list.some((x) => kindOf(x) === kindOf(p))) list.push(p);
    byCat.set(p.category, list);
  }
  const queues = [...byCat.values()].map((l) => l.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.dataCompleteness - a.dataCompleteness));
  const out: Product[] = [];
  for (let round = 0; out.length < limit && queues.some((q) => q.length > round); round++) {
    for (const q of queues) if (q[round] && out.length < limit) out.push(q[round]);
  }
  return out.map(toLite);
}
