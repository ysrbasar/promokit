import type { Product } from "../catalog/schema";

/**
 * Sepet tutarı SUNUCUDA, katalogdaki güncel fiyattan hesaplanır (istemcinin gönderdiği fiyata güvenilmez).
 * Liste fiyatları KDV hariçtir; kartla ödenen tutar KDV dahildir.
 */
export type CartInput = { productCode: string; variantCode: string | null; qty: number };
export type PricedLine = {
  productCode: string;
  name: string;
  variantCode: string | null;
  variantLabel: string | null;
  qty: number;
  unitPrice: number;
  vatRate: number;
  net: number;
  gross: number;
};
export type PricedCart = { lines: PricedLine[]; net: number; vat: number; gross: number; problems: string[] };

const r2 = (n: number) => Math.round(n * 100) / 100;

export function priceCart(items: CartInput[], products: Product[]): PricedCart {
  const byCode = new Map(products.map((p) => [p.productCode, p]));
  const problems: string[] = [];
  const lines: PricedLine[] = [];
  if (items.length === 0) problems.push("Sepet boş.");
  for (const it of items) {
    const p = byCode.get(it.productCode);
    if (!p || !p.isActive) {
      problems.push(`${it.productCode} kodlu ürün artık satışta değil.`);
      continue;
    }
    const v = it.variantCode ? p.variants.find((x) => x.code === it.variantCode) : null;
    if (it.variantCode && !v) problems.push(`${p.name} için seçilen seçenek bulunamadı.`);
    const unit = v?.price ?? p.price;
    if (unit === null || p.priceType !== "source" || (p.priceCurrency ?? "TRY") !== "TRY") {
      problems.push(`${p.name} için online fiyat yok; bu ürün için sipariş talebi gönderin.`);
      continue;
    }
    const qty = Math.floor(it.qty);
    if (!(qty >= 1 && qty <= 100000)) {
      problems.push(`${p.name} için adet geçersiz.`);
      continue;
    }
    if (p.minOrderQty && qty < p.minOrderQty) problems.push(`${p.name} en az ${p.minOrderQty} adet sipariş edilebilir.`);
    const stock = v ? v.stockQuantity : p.stockQuantity;
    if (stock !== null && stock < qty) problems.push(`${p.name}${v?.label ? ` (${v.label})` : ""} için stokta ${stock} adet var.`);
    const vatRate = p.vatRate ?? 20;
    const net = r2(unit * qty);
    lines.push({ productCode: p.productCode, name: p.name, variantCode: v?.code ?? null, variantLabel: v?.label ?? v?.color ?? null, qty, unitPrice: unit, vatRate, net, gross: r2(net * (1 + vatRate / 100)) });
  }
  const net = r2(lines.reduce((s, l) => s + l.net, 0));
  const gross = r2(lines.reduce((s, l) => s + l.gross, 0));
  return { lines, net, vat: r2(gross - net), gross, problems };
}
