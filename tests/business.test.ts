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
import { parseIpromosyon } from "@/lib/import/ipromosyon";
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

describe("içe aktarma (ipromosyon XML)", () => {
  const ALL = `<?xml version="1.0"?><urunler><olusturma_tarihi>19-10-2026 12:41:01</olusturma_tarihi>
    <urun><urun_id>10</urun_id><urun_kodu>İTR1001</urun_kodu><urun_adi>ÇELİK TERMOS 500 ML</urun_adi>
      <urun_kategori>Termoslar</urun_kategori><urun_aciklama>&lt;p&gt;Paslanmaz &amp;ccedil;elik&lt;/p&gt;</urun_aciklama>
      <urun_fiyat>80</urun_fiyat><iskontosuz_fiyat>100</iskontosuz_fiyat><para_birimi>TL</para_birimi><kdv_orani>20</kdv_orani>
      <minimum_siparis_adeti>50</minimum_siparis_adeti><stoklu_urun>true</stoklu_urun>
      <resimler><resim>https://www.ipromosyon.com/a.jpg</resim></resimler></urun>
    <urun><urun_id>11</urun_id><urun_kodu>İKL2002</urun_kodu><urun_adi>LED KALEM</urun_adi>
      <urun_kategori>Kalemler</urun_kategori><urun_fiyat>5</urun_fiyat><iskontosuz_fiyat>8</iskontosuz_fiyat><para_birimi>TL</para_birimi>
      <stoklu_urun>false</stoklu_urun></urun>
    <urun><urun_id>12</urun_id><urun_kodu>İST3003</urun_kodu><urun_adi>KUTULU ÖZEL SET</urun_adi>
      <urun_kategori>Kutulu &amp;Ouml;zel Setler</urun_kategori>
      <urun_aciklama>SET İÇERİĞİ * İTR1001 - ÇELİK TERMOS * İKL2002 - LED KALEM KUTU EBAT 20x20</urun_aciklama>
      <iskontosuz_fiyat>300</iskontosuz_fiyat><urun_fiyat>240</urun_fiyat><para_birimi>TL</para_birimi>
      <stoklu_urun>true</stoklu_urun></urun>
  </urunler>`;
  const STOCK = `<?xml version="1.0"?><urunler><olusturma_tarihi>19-10-2026 12:40:36</olusturma_tarihi>
    <urun><urun_id>10</urun_id><kod>itr1001-s</kod><toplam_stok>1200</toplam_stok>
      <stoklu_urun_fiyat>78</stoklu_urun_fiyat><iskontosuz_stoklu_urun_fiyat>98</iskontosuz_stoklu_urun_fiyat>
      <urun_secenekleri><secenek adi="RENK">SİYAH</secenek></urun_secenekleri>
      <gelecek_stoklar><gelecek_stok><stok>500</stok><tarih>01-11-2026</tarih></gelecek_stok></gelecek_stoklar></urun>
    <urun><urun_id>10</urun_id><kod>itr1001-b</kod><toplam_stok>0</toplam_stok>
      <urun_secenekleri><secenek adi="RENK">BEYAZ</secenek></urun_secenekleri></urun>
  </urunler>`;
  const run = () => parseIpromosyon(ALL, STOCK, "2026-10-19T10:00:00Z");

  it("14. ürünleri ve varyantları mükerrersiz, tekrarlanabilir şekilde üretir", () => {
    const a = run();
    expect(a.catalog.products.map((p) => p.productCode)).toEqual(["İTR1001", "İKL2002", "İST3003"]);
    expect(run().catalog).toEqual(a.catalog);
    const termos = a.catalog.products[0];
    expect(termos.name).toBe("Çelik Termos 500 ML");
    expect(termos.variants.map((v) => [v.code, v.color, v.stockQuantity])).toEqual([["İTR1001-S", "Siyah", 1200], ["İTR1001-B", "Beyaz", 0]]);
    expect(termos.variants[0].incoming).toEqual([{ qty: 500, date: "01-11-2026" }]);
    expect(termos.price).toBe(100);
    expect(termos.minOrderQty).toBe(50);
    expect(termos.vatRate).toBe(20);
    expect(a.feeds.stock.generatedAt).toBe("2026-10-19T12:40:36+03:00");
  });

  it("stoklu beslemede olmayan ürün 'stokta yok' sayılır", () => {
    const kalem = run().catalog.products[1];
    expect(kalem.stockQuantity).toBe(0);
    expect(productStatus(kalem, 50)).toBe("out");
    expect(kalem.stockKept).toBe(false);
  });

  it("alış fiyatı katalogda değil yalnız maliyet tablosunda bulunur", () => {
    const r = run();
    expect(JSON.stringify(r.catalog)).not.toContain("78");
    expect(r.costs["İTR1001"].cost).toBe(80);
    expect(r.costs["İTR1001"].variants["İTR1001-S"]).toBe(78);
  });

  it("set içeriği açıklamadan çözülür", () => {
    const set = run().catalog.products[2];
    expect(set.category).toBe("hediye-set");
    expect(set.setContents.map((c) => c.code)).toEqual(["İTR1001", "İKL2002"]);
    expect(set.setContents[0].name).toBe("Çelik Termos 500 ML");
  });

  it("15. görseli olmayan ürün işlenebiliyor ve aramada sorun çıkarmıyor", () => {
    const { products } = run().catalog;
    expect(products[1].imageOriginalUrl).toBeNull();
    expect(products[1].needsReview).toContain("missing-image");
    expect(() => searchProducts(products, { q: "kalem", stockOnly: false }, 50)).not.toThrow();
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

describe("kâr hesabı", () => {
  it("liste × adet × kit adedi; alışı bilinmeyen satır kâra katılmaz", async () => {
    const { computeProfit } = await import("@/lib/quote/profit");
    const [p] = computeProfit(
      [
        { qty: 1, listPrice: 100, cost: 80, currency: "TRY" },
        { qty: 2, listPrice: 10, cost: 5, currency: "TRY" },
        { qty: 1, listPrice: 50, cost: null, currency: "TRY" },
      ],
      10,
    );
    expect(p.revenue).toBe(1200);
    expect(p.cost).toBe(900);
    expect(p.profit).toBe(300);
    expect(p.margin).toBeCloseTo(0.25);
    expect(p.complete).toBe(false);
  });
});
