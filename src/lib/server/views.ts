import "server-only";
import { toLite, type LiteProduct } from "../catalog/lite";
import { priceKit, type KitPricing } from "../catalog/pricing";
import { isProductEligible } from "../catalog/stock";
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
  const [{ products }, settings] = await Promise.all([getCatalog(), getSettings()]);
  const counts = new Map<string, number>();
  for (const p of products) if (isProductEligible(p, settings.minStock)) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  return counts;
}
