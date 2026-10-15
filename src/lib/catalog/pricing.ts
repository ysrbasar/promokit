import type { PriceType, Product } from "./schema";

/**
 * KitPricingService: toplam yalnızca kitteki HER ürünün fiyatı güvenilir olduğunda hesaplanır.
 * Eksik fiyat varsa sahte bir toplam üretilmez; "teklif gerekli" durumu döner.
 */

export type PricingLine = { productCode: string; qtyPerKit: number };

export type KitPricing =
  | { status: "complete"; perKit: number; total: number; currency: string; priceType: PriceType }
  | { status: "quote-required"; missing: string[]; knownPerKit: number | null };

/**
 * "demo" fiyatlar yalnızca örnek katalogda bulunur ve arayüzde "örnek fiyat" diye etiketlenir;
 * gerçek içe aktarılan katalogda bu tip hiç oluşmaz. "estimated" hiçbir zaman toplama girmez.
 */
export function isVerifiedPrice(p: Pick<Product, "price" | "priceType">, allowDemo = true): boolean {
  if (p.price === null || p.priceType === null) return false;
  if (p.priceType === "source") return true;
  return allowDemo && p.priceType === "demo";
}

export function priceKit(
  lines: PricingLine[],
  products: Map<string, Pick<Product, "price" | "priceType" | "priceCurrency">>,
  kitQuantity: number,
  opts: { allowDemo?: boolean } = {},
): KitPricing {
  const allowDemo = opts.allowDemo ?? true;
  const missing: string[] = [];
  let perKit = 0;
  let currency: string | null = null;
  let demo = false;

  for (const line of lines) {
    const p = products.get(line.productCode);
    if (!p || !isVerifiedPrice(p, allowDemo)) {
      missing.push(line.productCode);
      continue;
    }
    // Farklı para birimleri tek toplamda birleştirilmez
    if (currency && p.priceCurrency !== currency) {
      missing.push(line.productCode);
      continue;
    }
    currency = p.priceCurrency ?? "TRY";
    if (p.priceType === "demo") demo = true;
    perKit += (p.price as number) * line.qtyPerKit;
  }

  if (lines.length === 0) return { status: "quote-required", missing: [], knownPerKit: null };
  if (missing.length > 0) {
    return { status: "quote-required", missing, knownPerKit: missing.length < lines.length ? round(perKit) : null };
  }
  return {
    status: "complete",
    perKit: round(perKit),
    total: round(perKit * Math.max(1, kitQuantity)),
    currency: currency ?? "TRY",
    priceType: demo ? "demo" : "source",
  };
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

export function formatMoney(n: number, currency = "TRY") {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}
