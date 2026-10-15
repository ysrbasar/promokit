import type { Product, StockStatus, Variant } from "./schema";

/**
 * StockEligibilityService: stok politikasının tek kaynağı.
 *  - stok 0            → "out": gösterilmez, önerilmez
 *  - 0 < stok < eşik   → "low": varsayılan olarak gizlenir
 *  - stok ≥ eşik       → "available"
 *  - stok bilinmiyor   → "unknown": garanti verilmez, otomatik önerilerde kullanılmaz
 * Varyant stokları ayrı değerlendirilir; ürün durumu en iyi varyantın durumudur.
 */

export function variantStatus(v: Pick<Variant, "stockQuantity">, minStock: number): StockStatus {
  if (v.stockQuantity === null) return "unknown";
  if (v.stockQuantity === 0) return "out";
  if (v.stockQuantity < minStock) return "low";
  return "available";
}

export function isVariantEligible(v: Variant, minStock: number, requiredQty = 0): boolean {
  if (variantStatus(v, minStock) !== "available") return false;
  return (v.stockQuantity ?? 0) >= requiredQty;
}

export function eligibleVariants(p: Product, minStock: number, requiredQty = 0): Variant[] {
  return p.variants.filter((v) => isVariantEligible(v, minStock, requiredQty));
}

const RANK: Record<StockStatus, number> = { available: 3, low: 2, unknown: 1, out: 0 };

export function productStatus(p: Product, minStock: number): StockStatus {
  if (p.variants.length === 0) {
    return variantStatus({ stockQuantity: p.stockQuantity }, minStock);
  }
  let best: StockStatus = "out";
  let sawUnknown = false;
  for (const v of p.variants) {
    const s = variantStatus(v, minStock);
    if (s === "unknown") sawUnknown = true;
    if (RANK[s] > RANK[best]) best = s;
  }
  // "low" bir varyant varken bilinmeyen başka varyant varsa ürünü bilinmeyen say:
  // düşük stok kesin olarak bilindiğinden yanlış güvence vermez, ama doğrulama gerekir.
  if (best === "low" && sawUnknown) return "unknown";
  return best;
}

/** Varsayılan katalog ve kit önerileri için uygunluk */
export function isProductEligible(p: Product, minStock: number, requiredQty = 0): boolean {
  if (!p.isActive) return false;
  if (p.variants.length === 0) {
    const q = p.stockQuantity;
    return q !== null && q >= minStock && q >= requiredQty;
  }
  return eligibleVariants(p, minStock, requiredQty).length > 0;
}

/** Kit adedini karşılayan en yüksek stoklu varyantı seçer; tercih edilen varyant uygunsa onu korur */
export function pickVariant(
  p: Product,
  minStock: number,
  requiredQty = 0,
  preferredCode?: string | null,
): Variant | null {
  const ok = eligibleVariants(p, minStock, requiredQty);
  if (ok.length === 0) return null;
  if (preferredCode) {
    const pref = ok.find((v) => v.code === preferredCode);
    if (pref) return pref;
  }
  return [...ok].sort((a, b) => (b.stockQuantity ?? 0) - (a.stockQuantity ?? 0))[0];
}

export const STOCK_LABEL: Record<StockStatus, string> = {
  available: "Stokta",
  low: "Sınırlı stok",
  out: "Stokta yok",
  unknown: "Stok doğrulanacak",
};

/** Kesin stok rakamı yerine kullanıcıya gösterilecek aralık ifadesi */
export function stockPhrase(qty: number | null, minStock: number): string {
  if (qty === null) return "Stok doğrulanacak";
  if (qty === 0) return "Stokta yok";
  if (qty < minStock) return "Sınırlı stok";
  if (qty >= 1000) return "1.000+ adet stokta";
  if (qty >= 500) return "500+ adet stokta";
  if (qty >= 250) return "250+ adet stokta";
  if (qty >= 100) return "100+ adet stokta";
  return `${minStock}+ adet stokta`;
}
