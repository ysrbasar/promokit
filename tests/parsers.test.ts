import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { baseCodeOf, parsePrmstkPage } from "@/lib/import/prmstkParser";
import { parseNumber, parseStock } from "@/lib/import/parseValues";
import { parseSitePage } from "@/lib/import/siteParser";

/**
 * NOT: Bu fixture'lar olası sayfa yapılarını temsil eder; gerçek prmstk.com yapısı
 * bu geliştirme ortamından doğrulanamadı. Gerçek sayfa `npm run scrape:inspect` ile
 * incelenip gerekirse fixture eklenmelidir.
 */
const fx = (n: string) => readFileSync(path.join(import.meta.dirname, "fixtures", n), "utf8");

describe("değer ayrıştırma", () => {
  it("stok: bilinmeyen ile sıfır ayrı tutulur", () => {
    expect(parseStock("1.250")).toBe(1250);
    expect(parseStock("1,250 adet")).toBe(1250);
    expect(parseStock(">500")).toBe(500);
    expect(parseStock("500+")).toBe(500);
    expect(parseStock("Stokta yok")).toBe(0);
    expect(parseStock("Tükendi")).toBe(0);
    expect(parseStock("0")).toBe(0);
    expect(parseStock("-")).toBeNull();
    expect(parseStock("")).toBeNull();
    expect(parseStock(null)).toBeNull();
  });

  it("sayı: Türkçe ondalık ve binlik ayırıcılar", () => {
    expect(parseNumber("1.250,50 TL")).toBe(1250.5);
    expect(parseNumber("289,90")).toBe(289.9);
    expect(parseNumber("289.90")).toBe(289.9);
    expect(parseNumber("12.400")).toBe(12400);
  });

  it("varyant kodundan ana kod", () => {
    expect(baseCodeOf("3935-S")).toBe("3935");
    expect(baseCodeOf("3935-01")).toBe("3935");
    expect(baseCodeOf("1201")).toBe("1201");
    expect(baseCodeOf("AB-1234")).toBe("AB-1234");
  });
});

describe("prmstk ayrıştırıcı", () => {
  it("tablo yapısı: varyantlar, stok, görsel", () => {
    const url = "https://www.prmstk.com/2027/5.html";
    const { records } = parsePrmstkPage(fx("prmstk-table.html"), url, 5);
    expect(records.map((r) => r.code)).toEqual(["3935-S", "3935-B", "3935-L", "3935-K", "1201"]);
    expect(records.map((r) => r.stock)).toEqual([1250, 0, 40, null, 12400]);
    expect(records[1].name).toBe("Çelik Termos 500 ml");
    expect(records[0].imageUrl).toBe("https://www.prmstk.com/2027/img/3935.jpg");
    expect(records[4].imageUrl).toBe("https://www.prmstk.com/2027/img/1201.png");
    expect(new Set(records.slice(0, 4).map((r) => r.baseCode))).toEqual(new Set(["3935"]));
  });

  it("blok yapısı: etiketli alanlar ve lazy-load görsel", () => {
    const { records } = parsePrmstkPage(fx("prmstk-block.html"), "https://www.prmstk.com/2027/9.html", 9);
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({ code: "8800-01", baseCode: "8800", color: "Gri", stock: 640, name: "Kablosuz Powerbank", imageUrl: "https://cdn.example.com/p/8800.jpg" });
    expect(records[0].specs.Malzeme).toBe("Alüminyum");
    expect(records[1]).toMatchObject({ code: "8801", stock: 0, imageUrl: "https://www.prmstk.com/img/8801.jpg" });
  });

  it("tanınmayan yapıda veri uydurmaz", () => {
    const r = parsePrmstkPage("<html><body><p>Merhaba</p></body></html>", "https://x/1.html", 1);
    expect(r.records).toEqual([]);
    expect(r.warnings[0]).toMatch(/parse-empty/);
  });
});

describe("site ayrıştırıcı", () => {
  it("JSON-LD ürün, breadcrumb, fiyat ve teknik özellik", () => {
    const r = parseSitePage(fx("site-product.html"), "https://www.promosyonfirma.com/urun/celik-termos")!;
    expect(r.code).toBe("3935");
    expect(r.price).toBe(289.9);
    expect(r.priceCurrency).toBe("TRY");
    expect(r.breadcrumbs).toEqual(["Anasayfa", "Termos ve Mataralar", "Termoslar"]);
    expect(r.images[0]).toBe("https://www.promosyonfirma.com/u/3935-1.jpg");
    expect(r.specs.Kapasite).toBe("500 ml");
  });
});
