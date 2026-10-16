import { describe, expect, it } from "vitest";
import { isProductEligible, pickVariant, productStatus } from "@/lib/catalog/stock";
import { filterProducts, searchProducts } from "@/lib/catalog/search";
import { priceKit } from "@/lib/catalog/pricing";
import { EMPTY_ANSWERS, buildKit, findAlternatives } from "@/lib/kit/recommendation";
import {
  addLine,
  emptyDraft,
  parseSavedKits,
  removeLine,
  replaceLine,
  setLineQty,
  totalPieces,
} from "@/lib/kit/kitState";
import { QuoteRequestSchema } from "@/lib/quote/schema";
import { mergeCatalog } from "@/lib/import/merge";
import type { RawRecord } from "@/lib/import/prmstkParser";
import { product, settings, variant } from "./helpers";

const answers = { ...EMPTY_ANSWERS, quantity: 0, purpose: "welcome", categories: ["termos-matara", "kalem"] };

describe("stok politikası", () => {
  it("1. stok 0 olan ürün kit önerisine girmiyor", () => {
    const zero = product("Z1", { variants: [variant("Z1-01", 0)], stockQuantity: 0 });
    const ok = product("OK1", { category: "kalem" });
    const kit = buildKit([zero, ok], answers, settings);
    expect(kit.items.map((i) => i.productCode)).not.toContain("Z1");
    expect(kit.items.map((i) => i.productCode)).toContain("OK1");
  });

  it("2. eşik altındaki ürün varsayılan filtrede görünmüyor; bilinmeyen stok da garanti edilmiyor", () => {
    const low = product("L1", { variants: [variant("L1-01", 49)] });
    const unknown = product("U1", { variants: [variant("U1-01", null)], stockQuantity: null });
    const ok = product("A1", { variants: [variant("A1-01", 50)] });
    const visible = filterProducts([low, unknown, ok], {}, 50).map((p) => p.productCode);
    expect(visible).toEqual(["A1"]);
    expect(productStatus(low, 50)).toBe("low");
    expect(productStatus(unknown, 50)).toBe("unknown");
    expect(isProductEligible(unknown, 50)).toBe(false);
  });

  it("3. uygun stoklu varyant doğru seçiliyor", () => {
    const p = product("V1", {
      variants: [variant("V1-S", 0, "Siyah"), variant("V1-B", 30, "Beyaz"), variant("V1-L", 400, "Lacivert"), variant("V1-G", 120, "Gri")],
    });
    expect(pickVariant(p, 50)?.code).toBe("V1-L");
    // Kit adedi 200 → yalnız 400 stoklu varyant karşılar
    expect(pickVariant(p, 50, 200)?.code).toBe("V1-L");
    // Tercih edilen varyant uygunsa korunur, uygun değilse en iyi varyanta düşülür
    expect(pickVariant(p, 50, 0, "V1-G")?.code).toBe("V1-G");
    expect(pickVariant(p, 50, 0, "V1-B")?.code).toBe("V1-L");
    expect(pickVariant(p, 50, 1000)).toBeNull();
  });
});

describe("kit durumu", () => {
  it("4. aynı ürün kodu iki kez eklenmiyor", () => {
    let d = emptyDraft();
    d = addLine(d, { productCode: "P1", variantCode: null });
    d = addLine(d, { productCode: "P1", variantCode: "P1-02" });
    expect(d.lines).toHaveLength(1);
    expect(d.lines[0].variantCode).toBeNull();
  });

  it("5. kullanıcı ürünü kitten çıkarabiliyor", () => {
    let d = addLine(addLine(emptyDraft(), { productCode: "P1", variantCode: null }), { productCode: "P2", variantCode: null });
    d = removeLine(d, "P1");
    expect(d.lines.map((l) => l.productCode)).toEqual(["P2"]);
  });

  it("6. adet değişimi kit özetine yansıyor", () => {
    let d = addLine(addLine(emptyDraft(), { productCode: "P1", variantCode: null }), { productCode: "P2", variantCode: null });
    d = setLineQty(d, "P1", 3);
    expect(totalPieces(d)).toBe(4);
    d = setLineQty(d, "P1", 0);
    expect(d.lines.map((l) => l.productCode)).toEqual(["P2"]);
  });

  it("ürün değiştirme sırayı korur ve mükerrer üretmez", () => {
    let d = addLine(addLine(emptyDraft(), { productCode: "P1", variantCode: null }), { productCode: "P2", variantCode: null });
    d = replaceLine(d, "P1", { productCode: "P3", variantCode: "P3-01" });
    expect(d.lines.map((l) => l.productCode)).toEqual(["P3", "P2"]);
    d = replaceLine(d, "P3", { productCode: "P2", variantCode: null });
    expect(d.lines.map((l) => l.productCode)).toEqual(["P2"]);
  });

  it("13. kaydedilmiş kit yeniden yüklenebiliyor; bozuk kayıt yok sayılıyor", () => {
    const d = setLineQty(addLine(emptyDraft(), { productCode: "P1", variantCode: "P1-01" }), "P1", 2);
    const roundTrip = parseSavedKits(JSON.parse(JSON.stringify([d])));
    expect(roundTrip).toHaveLength(1);
    expect(roundTrip[0].lines[0]).toMatchObject({ productCode: "P1", variantCode: "P1-01", qty: 2 });
    expect(parseSavedKits([{ foo: 1 }])).toEqual([]);
    expect(parseSavedKits("çöp")).toEqual([]);
  });
});

describe("arama ve filtre", () => {
  const list = [
    product("3935", { name: "Çelik Termos 500 ml", category: "termos-matara", variants: [variant("3935-S", 900)] }),
    product("1201", { name: "Bambu Kalem", category: "kalem", variants: [variant("1201-01", 900)] }),
    product("7700", { name: "Deri Ajanda", category: "defter-ajanda", variants: [variant("7700-01", 900, "Taba")] }),
  ];

  it("7. kategori filtreleri çalışıyor", () => {
    expect(searchProducts(list, { category: "kalem" }, 50).items.map((p) => p.productCode)).toEqual(["1201"]);
    expect(searchProducts(list, { color: "taba" }, 50).items.map((p) => p.productCode)).toEqual(["7700"]);
  });

  it("8. ürün koduyla arama çalışıyor (ana ve varyant kodu)", () => {
    expect(searchProducts(list, { q: "3935" }, 50).items[0].productCode).toBe("3935");
    expect(searchProducts(list, { q: "3935-s" }, 50).items[0].productCode).toBe("3935");
    expect(searchProducts(list, { q: "celik termos" }, 50).items[0].productCode).toBe("3935");
  });
});

describe("öneri motoru", () => {
  it("9. uygun alternatif bulunabiliyor (aynı kategori, stoklu)", () => {
    const target = product("T1", { category: "kalem" });
    const altOk = product("T2", { category: "kalem" });
    const altNoStock = product("T3", { category: "kalem", variants: [variant("T3-01", 0)] });
    const otherCat = product("T4", { category: "canta" });
    const alts = findAlternatives(target, [target, altOk, altNoStock, otherCat], answers, settings);
    expect(alts.map((p) => p.productCode)).toEqual(["T2"]);
  });

  it("uygun ürün yoksa açıklama döner", () => {
    const kit = buildKit([product("Z", { variants: [variant("Z-1", 0)] })], answers, settings);
    expect(kit.items).toHaveLength(0);
    expect(kit.emptyReason).toBeTruthy();
  });

  it("kit adedi varyant stoğunu aşarsa ürün önerilmez", () => {
    const p = product("Q1", { variants: [variant("Q1-01", 100)] });
    expect(buildKit([p], { ...answers, quantity: 250 }, settings).items).toHaveLength(0);
    expect(buildKit([p], { ...answers, quantity: 80 }, settings).items).toHaveLength(1);
  });

  it("bütçe aşılınca daha uygun alternatif seçilir", () => {
    const pricey = product("E1", { price: 900, priceType: "source", priceCurrency: "TRY", isFeatured: true });
    const cheap = product("E2", { price: 150, priceType: "source", priceCurrency: "TRY" });
    const pen = product("K1", { category: "kalem", price: 50, priceType: "source", priceCurrency: "TRY" });
    const kit = buildKit([pricey, cheap, pen], { ...answers, budgetKey: "lt500" }, settings);
    const codes = kit.items.map((i) => i.productCode);
    expect(codes).toContain("E2");
    expect(codes).not.toContain("E1");
  });
});

describe("fiyatlama", () => {
  it("10. doğrulanmış fiyatlarla bütçe doğru hesaplanıyor", () => {
    const m = new Map([
      ["A", product("A", { price: 100, priceType: "source", priceCurrency: "TRY" })],
      ["B", product("B", { price: 25.5, priceType: "source", priceCurrency: "TRY" })],
    ]);
    const r = priceKit([{ productCode: "A", qtyPerKit: 1 }, { productCode: "B", qtyPerKit: 2 }], m, 10);
    expect(r).toMatchObject({ status: "complete", perKit: 151, total: 1510, currency: "TRY" });
  });

  it("11. fiyatı olmayan ürün sahte toplam oluşturmuyor", () => {
    const m = new Map([
      ["A", product("A", { price: 100, priceType: "source", priceCurrency: "TRY" })],
      ["B", product("B", { price: null })],
      ["C", product("C", { price: 80, priceType: "estimated", priceCurrency: "TRY" })],
    ]);
    const r = priceKit(
      ["A", "B", "C"].map((productCode) => ({ productCode, qtyPerKit: 1 })),
      m,
      10,
    );
    expect(r.status).toBe("quote-required");
    if (r.status === "quote-required") expect(r.missing).toEqual(["B", "C"]);
    expect("total" in r).toBe(false);
  });
});

describe("teklif formu", () => {
  const valid = {
    contact: {
      company: "Örnek A.Ş.",
      fullName: "Ayşe Yılmaz",
      email: "ayse@ornek.com",
      phone: "0532 123 45 67",
      city: "İstanbul",
      deliveryDate: "",
      notes: "",
      kvkkConsent: true,
    },
    kit: { name: "Kitim", kitQuantity: 50, lines: [{ productCode: "A", variantCode: null, qty: 1, personalization: [] }], source: "free" },
  };

  it("12. eksik veya hatalı veriyi reddediyor", () => {
    expect(QuoteRequestSchema.safeParse(valid).success).toBe(true);
    const bad = (patch: object, kit: object = {}) =>
      QuoteRequestSchema.safeParse({ contact: { ...valid.contact, ...patch }, kit: { ...valid.kit, ...kit } }).success;
    expect(bad({ email: "gecersiz" })).toBe(false);
    expect(bad({ phone: "12" })).toBe(false);
    expect(bad({ company: "" })).toBe(false);
    expect(bad({ kvkkConsent: false })).toBe(false);
    expect(bad({ deliveryDate: "15/10/2026" })).toBe(false);
    expect(bad({}, { lines: [] })).toBe(false);
    expect(bad({}, { kitQuantity: 0 })).toBe(false);
  });
});

describe("içe aktarma", () => {
  const rec = (code: string, page: number, stock: number | null, image: string | null = `https://x/${code}.jpg`): RawRecord => ({
    page,
    sourceUrl: `https://www.prmstk.com/2027/${page}.html`,
    code,
    baseCode: code.split("-")[0],
    name: "Çelik Termos",
    color: "Siyah",
    stock,
    stockRaw: String(stock),
    price: null,
    priceCurrency: null,
    imageUrl: image,
    specs: {},
    strategy: "table",
  });

  it("14. tekrar çalıştırma ve tekrar eden kayıtlar mükerrer ürün üretmiyor", () => {
    const input = [rec("3935-S", 5, 1200), rec("3935-B", 5, 0), rec("3935-S", 6, 1100), rec("1201", 7, 300)];
    const a = mergeCatalog({ prmstk: input, fetchedAt: {}, now: "2026-10-15T00:00:00Z" });
    const b = mergeCatalog({ prmstk: [...input, ...input], fetchedAt: {}, now: "2026-10-15T00:00:00Z" });
    expect(a.products.map((p) => p.productCode)).toEqual(["1201", "3935"]);
    expect(b.products).toEqual(a.products);
    const termos = a.products.find((p) => p.productCode === "3935")!;
    expect(termos.variants.map((v) => v.code)).toEqual(["3935-B", "3935-S"]);
    // Çelişen stokta düşük değer seçilir ve inceleme kuyruğuna alınır
    expect(termos.variants.find((v) => v.code === "3935-S")!.stockQuantity).toBe(1100);
    expect(a.review.some((r) => r.reason === "stock-conflict")).toBe(true);
    // Fiyat kaynakta yoksa uydurulmaz
    expect(termos.price).toBeNull();
    expect(termos.priceType).toBeNull();
  });

  it("aynı görsel birden fazla ürüne atanmışsa kullanılmıyor", () => {
    const { products, review } = mergeCatalog({
      prmstk: [rec("A1", 1, 100, "https://x/ortak.jpg"), rec("B1", 1, 100, "https://x/ortak.jpg")],
      fetchedAt: {},
      now: "2026-10-15T00:00:00Z",
    });
    expect(products.every((p) => p.imageOriginalUrl === null)).toBe(true);
    expect(review.filter((r) => r.reason === "image-shared")).toHaveLength(2);
  });

  it("15. görseli olmayan ürün işlenebiliyor ve aramada sorun çıkarmıyor", () => {
    const { products } = mergeCatalog({ prmstk: [rec("N1", 1, 500, null)], fetchedAt: {}, now: "2026-10-15T00:00:00Z" });
    expect(products[0].imageOriginalUrl).toBeNull();
    expect(products[0].needsReview).toContain("missing-image");
    expect(() => searchProducts(products, { q: "termos" }, 50)).not.toThrow();
    expect(buildKit(products, { ...EMPTY_ANSWERS, quantity: 0 }, settings).items).toHaveLength(1);
  });
});

describe("kit metinleri", () => {
  it("kısaltmaları bozmaz ve cümle büyük harfle başlar", async () => {
    const { kitConcept } = await import("@/lib/kit/recommendation");
    const t = kitConcept({ ...EMPTY_ANSWERS, purpose: "vip", style: "luxury" });
    expect(t).toBe("Yönetici ve VIP hediyesi için premium ve lüks bir çizgide, stokta bulunan ürünlerden oluşturulmuş seçki.");
  });
});

describe("bütçe sonrası tamamlama", () => {
  it("bütçeyi aşan ürün çıkarılınca kalan bütçeye sığan ürünle kit tamamlanır", () => {
    const priced = (code: string, category: string, price: number) => product(code, { category, price, priceType: "source", priceCurrency: "TRY" });
    const kit = buildKit(
      [priced("T1", "termos-matara", 200), priced("C1", "canta", 900), priced("K1", "kalem", 20), priced("K2", "kalem", 30)],
      { ...EMPTY_ANSWERS, quantity: 0, budgetKey: "lt500", categories: ["termos-matara", "canta", "kalem"] },
      settings,
    );
    const codes = kit.items.map((i) => i.productCode);
    expect(codes).not.toContain("C1");
    expect(codes).toHaveLength(3);
  });
});
