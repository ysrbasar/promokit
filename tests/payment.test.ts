import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { priceCart } from "@/lib/payment/orderPricing";
import { isFreshTimestamp, verifyOdemeixSignature } from "@/lib/payment/signature";
import { product, variant } from "./helpers";

describe("Ödemeix webhook imzası", () => {
  const secret = "whsec_test123";
  const body = '{"id":9137,"event":"payment.succeeded","timestamp":1790854331,"data":{"customer_reference":"PK20261020-ABC123"}}';
  const sig = createHmac("sha256", secret).update(body).digest("hex");

  it("ham gövdenin HMAC-SHA256 imzası kabul edilir", () => {
    expect(verifyOdemeixSignature(body, sig, secret)).toBe(true);
    expect(verifyOdemeixSignature(body, sig.toUpperCase(), secret)).toBe(true);
  });
  it("değiştirilmiş gövde, yanlış anahtar veya eksik imza reddedilir", () => {
    expect(verifyOdemeixSignature(body.replace("9137", "9138"), sig, secret)).toBe(false);
    expect(verifyOdemeixSignature(body, sig, "whsec_baska")).toBe(false);
    expect(verifyOdemeixSignature(body, null, secret)).toBe(false);
    expect(verifyOdemeixSignature(body, sig, "")).toBe(false);
  });
  it("5 dakikadan eski bildirim reddedilir", () => {
    expect(isFreshTimestamp(1000, 1000 + 299)).toBe(true);
    expect(isFreshTimestamp(1000, 1000 + 301)).toBe(false);
    expect(isFreshTimestamp("abc", 1000)).toBe(false);
  });
});

describe("sepet tutarı (sunucuda)", () => {
  const priced = (code: string, price: number, over = {}) => product(code, { price, priceType: "source", priceCurrency: "TRY", vatRate: 20, ...over });

  it("katalog fiyatıyla, varyant fiyatı öncelikli, KDV dahil hesaplanır", () => {
    const a = priced("A", 100, { variants: [{ ...variant("A-1", 500), price: 110 }] });
    const b = priced("B", 7.2, { vatRate: 10 });
    const r = priceCart([{ productCode: "A", variantCode: "A-1", qty: 2 }, { productCode: "B", variantCode: null, qty: 10 }], [a, b]);
    expect(r.problems).toEqual([]);
    expect(r.net).toBe(292);
    expect(r.gross).toBe(343.2); // 220×1,2 + 72×1,1
    expect(r.vat).toBe(51.2);
  });
  it("fiyatı olmayan, pasif, stok veya minimum adedi karşılamayan ürünle ödeme açılmaz", () => {
    const noPrice = product("N", { price: null, priceType: null });
    const moq = priced("M", 10, { minOrderQty: 100 });
    const low = priced("L", 10, { variants: [variant("L-1", 5)] });
    const r = priceCart(
      [
        { productCode: "N", variantCode: null, qty: 1 },
        { productCode: "M", variantCode: null, qty: 10 },
        { productCode: "L", variantCode: "L-1", qty: 20 },
        { productCode: "YOK", variantCode: null, qty: 1 },
      ],
      [noPrice, moq, low],
    );
    expect(r.problems.join(" ")).toMatch(/online fiyat yok/);
    expect(r.problems.join(" ")).toMatch(/en az 100 adet/);
    expect(r.problems.join(" ")).toMatch(/stokta 5 adet/);
    expect(r.problems.join(" ")).toMatch(/satışta değil/);
  });
});

describe("sipariş durum geçişleri", async () => {
  const { applyPaymentStatus } = await import("@/lib/payment/orderState");
  const mk = (status: "awaiting_payment" | "paid") =>
    ({ status, paidTotal: null, sessionToken: "ps_a", history: [] }) as unknown as import("@/lib/payment/orderState").Order;

  it("başarılı ödeme siparişi ödendi yapar, karttan çekilen tutar kaydedilir", () => {
    const o = mk("awaiting_payment");
    expect(applyPaymentStatus(o, "succeeded", "webhook", { paidTotal: 1337.43 })).toBe(true);
    expect(o.status).toBe("paid");
    expect(o.paidTotal).toBe(1337.43);
  });
  it("ödenmiş sipariş gecikmeli 'başarısız' veya 'süresi doldu' bildirimiyle geri alınmaz; iade uygulanır", () => {
    const o = mk("paid");
    expect(applyPaymentStatus(o, "failed", "webhook")).toBe(false);
    expect(applyPaymentStatus(o, "expired", "webhook")).toBe(false);
    expect(o.status).toBe("paid");
    expect(applyPaymentStatus(o, "refunded", "webhook")).toBe(true);
    expect(o.status).toBe("refunded");
  });
});
