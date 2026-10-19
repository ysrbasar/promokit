/**
 * ÖRNEK katalog üretir: data/demo-catalog.json
 *
 * Bu veriler GERÇEK DEĞİLDİR. Kaynak sitelere erişilemeyen ortamlarda arayüzü ve
 * iş kurallarını (stok filtresi, öneri motoru, fiyatlama) göstermek içindir.
 * Ürün kodları "DEMO-" önekiyle, fiyatlar "demo" tipiyle işaretlenir ve görsel içermez.
 * Gerçek katalog (data/catalog.json) içe aktarıldığında uygulama otomatik olarak ona geçer.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { budgetTierFromPrice, colorHex, completeness, deriveTags, slugify } from "../../src/lib/catalog/enrich";
import type { CatalogFile, Product } from "../../src/lib/catalog/schema";

type Seed = [cat: string, name: string, material: string, size: string | null, colors: string[], price: number, print: string[], sub?: string];

const SEEDS: Seed[] = [
  ["termos-matara", "Vakum Yalıtımlı Çelik Termos 500 ml", "Paslanmaz çelik", "500 ml", ["Siyah", "Beyaz", "Lacivert"], 285, ["Lazer kazıma", "UV baskı"], "Termos"],
  ["termos-matara", "Çift Cidarlı Matara 750 ml", "Paslanmaz çelik", "750 ml", ["Antrasit", "Yeşil", "Beyaz"], 245, ["Lazer kazıma", "Tampon baskı"], "Matara"],
  ["termos-matara", "Bambu Kapaklı Termos 420 ml", "Paslanmaz çelik, bambu", "420 ml", ["Krem", "Siyah"], 310, ["Lazer kazıma"], "Termos"],
  ["termos-matara", "Dijital Isı Göstergeli Termos 500 ml", "Paslanmaz çelik", "500 ml", ["Siyah", "Gümüş"], 395, ["Lazer kazıma"], "Termos"],
  ["termos-matara", "Tritan Spor Matara 600 ml", "Tritan", "600 ml", ["Şeffaf", "Mavi", "Turuncu"], 95, ["Tampon baskı"], "Matara"],
  ["termos-matara", "Seyahat Termos Bardak 380 ml", "Paslanmaz çelik", "380 ml", ["Beyaz", "Bordo", "Lacivert"], 215, ["Lazer kazıma", "UV baskı"], "Termos bardak"],
  ["termos-matara", "Mat Siyah Premium Termos 1 L", "Paslanmaz çelik", "1000 ml", ["Siyah"], 520, ["Lazer kazıma"], "Termos"],
  ["defter-ajanda", "Deri Kapaklı Tarihsiz Ajanda A5", "Suni deri", "A5", ["Lacivert", "Taba", "Siyah"], 265, ["Kabartma", "Serigrafi"], "Ajanda"],
  ["defter-ajanda", "Lastikli Not Defteri A5", "Termo deri", "A5", ["Siyah", "Gri", "Bordo", "Yeşil"], 135, ["Kabartma", "Serigrafi"], "Defter"],
  ["defter-ajanda", "Kraft Kapaklı Defter ve Kalem Seti", "Geri dönüşüm kağıt", "A5", ["Naturel"], 72, ["Serigrafi"], "Defter"],
  ["defter-ajanda", "Keten Kumaş Kaplı Defter B5", "Keten", "B5", ["Bej", "Gri"], 190, ["Nakış", "Kabartma"], "Defter"],
  ["defter-ajanda", "Spiralli Bloknot A6", "Karton", "A6", ["Beyaz", "Siyah"], 38, ["Dijital baskı"], "Bloknot"],
  ["defter-ajanda", "2027 Haftalık Ajanda", "Termo deri", "17x24 cm", ["Lacivert", "Siyah"], 210, ["Kabartma"], "Ajanda"],
  ["kalem", "Metal Roller Kalem", "Alüminyum", null, ["Siyah", "Gümüş", "Lacivert"], 85, ["Lazer kazıma"], "Roller"],
  ["kalem", "Bambu Tükenmez Kalem", "Bambu", null, ["Naturel"], 18, ["Lazer kazıma", "Tampon baskı"], "Tükenmez"],
  ["kalem", "Dokunmatik Uçlu Metal Kalem", "Pirinç", null, ["Siyah", "Gümüş", "Rose gold"], 64, ["Lazer kazıma"], "Tükenmez"],
  ["kalem", "Kutulu Dolma ve Roller Kalem Seti", "Metal", null, ["Siyah"], 420, ["Lazer kazıma"], "Set"],
  ["kalem", "Plastik Promosyon Kalem", "ABS", null, ["Mavi", "Kırmızı", "Beyaz", "Yeşil"], 6, ["Tampon baskı"], "Tükenmez"],
  ["kalem", "Mat Yüzeyli Twist Kalem", "Alüminyum", null, ["Antrasit", "Beyaz"], 42, ["Lazer kazıma", "UV baskı"], "Tükenmez"],
  ["teknoloji", "Kablosuz Şarj Özellikli Powerbank 10.000 mAh", "Alüminyum", "10000 mAh", ["Siyah", "Gri"], 640, ["Lazer kazıma", "UV baskı"], "Powerbank"],
  ["teknoloji", "Işıklı Logolu Powerbank 5.000 mAh", "ABS", "5000 mAh", ["Beyaz", "Siyah"], 380, ["Lazer kazıma"], "Powerbank"],
  ["teknoloji", "Bluetooth Mini Hoparlör", "Kumaş, ABS", null, ["Siyah", "Gri", "Lacivert"], 450, ["Tampon baskı"], "Ses"],
  ["teknoloji", "Kablosuz Kulaklık", "ABS", null, ["Beyaz", "Siyah"], 720, ["Tampon baskı"], "Ses"],
  ["teknoloji", "3'ü 1 Arada Şarj Kablosu", "Örgü kablo", "120 cm", ["Siyah", "Gri"], 95, ["Tampon baskı"], "Kablo"],
  ["teknoloji", "Masaüstü Kablosuz Şarj Standı", "Bambu", null, ["Naturel"], 390, ["Lazer kazıma"], "Şarj"],
  ["teknoloji", "USB Bellek 32 GB Metal", "Metal", "32 GB", ["Gümüş", "Siyah"], 160, ["Lazer kazıma"], "Bellek"],
  ["canta", "Su İtici Laptop Sırt Çantası", "Polyester", "15.6\"", ["Siyah", "Antrasit", "Lacivert"], 690, ["Nakış", "Transfer baskı"], "Sırt çantası"],
  ["canta", "Pamuklu Bez Çanta", "Pamuk", "38x42 cm", ["Naturel", "Siyah", "Lacivert"], 48, ["Serigrafi", "Dijital baskı"], "Bez çanta"],
  ["canta", "Geri Dönüşüm rPET Alışveriş Çantası", "rPET", "40x45 cm", ["Gri", "Yeşil"], 55, ["Serigrafi"], "Bez çanta"],
  ["canta", "Deri Evrak Çantası", "Suni deri", "40x30 cm", ["Siyah", "Taba"], 1450, ["Kabartma"], "Evrak"],
  ["canta", "Konferans Çantası", "Polyester", "38x29 cm", ["Lacivert", "Siyah"], 165, ["Serigrafi"], "Konferans"],
  ["tekstil", "Organik Pamuk Tişört", "Organik pamuk", "S–XXL", ["Beyaz", "Siyah", "Lacivert", "Gri"], 165, ["Serigrafi", "Dijital baskı", "Nakış"], "Tişört"],
  ["tekstil", "Fermuarlı Polar", "Polar", "S–XXL", ["Lacivert", "Siyah", "Gri"], 340, ["Nakış"], "Polar"],
  ["tekstil", "Pamuk Beyzbol Şapka", "Pamuk", "Standart", ["Siyah", "Beyaz", "Lacivert", "Bej"], 78, ["Nakış", "Transfer baskı"], "Şapka"],
  ["tekstil", "Kapüşonlu Sweatshirt", "Pamuk-polyester", "S–XXL", ["Siyah", "Gri", "Bordo"], 420, ["Nakış", "Serigrafi"], "Sweat"],
  ["kupa-bardak", "Mat Seramik Kupa 350 ml", "Seramik", "350 ml", ["Siyah", "Beyaz", "Lacivert", "Yeşil"], 68, ["Lazer kazıma", "Serigrafi"], "Kupa"],
  ["kupa-bardak", "Çift Cidarlı Cam Bardak 250 ml", "Borosilikat cam", "250 ml", ["Şeffaf"], 120, ["Serigrafi"], "Bardak"],
  ["kupa-bardak", "Bambu Kapaklı Cam Bardak", "Cam, bambu", "400 ml", ["Şeffaf"], 88, ["Serigrafi", "Lazer kazıma"], "Bardak"],
  ["kupa-bardak", "Emaye Kamp Kupası", "Emaye çelik", "300 ml", ["Beyaz", "Krem"], 95, ["Serigrafi"], "Kupa"],
  ["masaustu", "Ceviz Kartlık ve Kalemlik Seti", "Ceviz", null, ["Kahverengi"], 360, ["Lazer kazıma"], "Set"],
  ["masaustu", "Deri Mousepad", "Suni deri", "30x25 cm", ["Siyah", "Taba", "Lacivert"], 145, ["Kabartma", "Lazer kazıma"], "Mousepad"],
  ["masaustu", "Ahşap Masa Saati", "Ahşap", null, ["Naturel", "Kahverengi"], 310, ["Lazer kazıma"], "Saat"],
  ["masaustu", "Beton Kalemlik", "Beton", null, ["Gri"], 98, ["Lazer kazıma"], "Kalemlik"],
  ["hediye-set", "Termos, Defter ve Kalem Hediye Seti", "Karma", null, ["Siyah", "Lacivert"], 590, ["Lazer kazıma", "Kabartma"], "Set"],
  ["hediye-set", "Deri Cüzdan ve Kartlık Seti", "Gerçek deri", null, ["Siyah", "Taba"], 980, ["Kabartma"], "Set"],
  ["hediye-set", "Premium Kahve Deneyim Seti", "Karma", null, ["Siyah"], 1150, ["Lazer kazıma"], "Set"],
  ["hediye-set", "Yönetici Masa Seti Dörtlü", "Ceviz, deri", null, ["Kahverengi"], 2400, ["Lazer kazıma"], "Set"],
  ["kutu-ambalaj", "Mıknatıslı Kapaklı Hediye Kutusu", "Sert karton", "30x22x10 cm", ["Siyah", "Lacivert", "Krem"], 95, ["Serigrafi", "Kabartma"], "Kutu"],
  ["kutu-ambalaj", "Kraft Hediye Kutusu", "Kraft karton", "25x20x8 cm", ["Naturel"], 42, ["Serigrafi"], "Kutu"],
  ["kutu-ambalaj", "Kadife Kaplı Premium Kutu", "Kadife, karton", "32x24x11 cm", ["Lacivert", "Bordo"], 175, ["Kabartma"], "Kutu"],
  ["doga-dostu", "Buğday Lifli Yemek Kabı", "Buğday lifi", "750 ml", ["Bej", "Yeşil"], 82, ["Tampon baskı"], "Mutfak"],
  ["doga-dostu", "Mantar Kapaklı Defter", "Mantar", "A5", ["Naturel"], 145, ["Lazer kazıma"], "Defter"],
  ["doga-dostu", "Tohumlu Kağıt Kalem Seti", "Geri dönüşüm kağıt", null, ["Naturel"], 24, ["Tampon baskı"], "Kalem"],
  ["doga-dostu", "Bambu Çatal Kaşık Seti", "Bambu", null, ["Naturel"], 58, ["Lazer kazıma"], "Mutfak"],
];

// Stok politikası senaryolarını gösteren deterministik stok dağılımı:
// çoğunlukla yeterli, bazıları sıfır, bazıları eşik altı, bazıları bilinmiyor.
function stockFor(i: number, j: number): number | null {
  const k = (i * 7 + j * 13) % 23;
  if (k === 0) return 0;
  if (k === 5) return 12;
  if (k === 11) return null;
  if (k === 17) return 35;
  return [80, 140, 260, 420, 650, 1200, 2400, 5200][(i + j * 3) % 8];
}

const now = "2026-10-15T09:00:00.000Z";
const products: Product[] = SEEDS.map(([cat, name, material, size, colors, price, print, sub], i) => {
  const code = `DEMO-${1001 + i}`;
  const variants = colors.map((c, j) => ({
    code: `${code}-${String(j + 1).padStart(2, "0")}`,
    color: c,
    colorHex: colorHex(c),
    stockQuantity: stockFor(i, j),
    stockUpdatedAt: now,
    imageUrl: null,
    label: null,
    price: null,
    incoming: [],
  }));
  const known = variants.map((v) => v.stockQuantity).filter((q): q is number => q !== null);
  const base = {
    id: code,
    productCode: code,
    name,
    slug: `${slugify(name)}-${code.toLowerCase()}`,
    category: cat,
    subcategory: sub ?? null,
    description: `${name}. Örnek katalog kaydıdır; gerçek ürün bilgisi değildir.`,
    technicalSpecifications: { Malzeme: material, ...(size ? { Ölçü: size } : {}) },
    dimensions: size && !/ml|mAh|GB/.test(size) ? size : null,
    material,
    capacity: size && /ml|mAh|GB/.test(size) ? size : null,
    availableColors: colors,
    variants,
    stockQuantity: known.length ? known.reduce((a, b) => a + b, 0) : null,
    stockStatus: "unknown" as const,
    stockUpdatedAt: now,
    price,
    priceCurrency: "TRY",
    priceType: "demo" as const,
    sourcePage: null,
    sourceProductUrl: null,
    sourcePdfPage: null,
    imageOriginalUrl: null,
    localImagePath: null,
    gallery: [],
    printingMethods: print,
    tags: [sub ?? cat].filter(Boolean),
    budgetTier: budgetTierFromPrice(price),
    isActive: true,
    isFeatured: i % 6 === 0,
    lastVerifiedAt: now,
    sources: [{ field: "*", source: "demo" as const, value: "örnek veri" }],
    needsReview: [],
    isDemo: true,
    vatRate: null,
    minOrderQty: null,
    stockKept: true,
    setContents: [],
  };
  const tags = deriveTags({ name, material, category: cat, description: null });
  const p: Product = { ...base, ...tags, dataCompleteness: 0 };
  p.dataCompleteness = completeness(p);
  return p;
});

const file: CatalogFile = {
  meta: {
    kind: "demo",
    generatedAt: now,
    note: "ÖRNEK VERİ — gerçek katalog içe aktarılmadı. npm run scrape && npm run catalog:build ile gerçek veri üretin.",
  },
  products,
};

const out = path.resolve(import.meta.dirname, "../../data/demo-catalog.json");
writeFileSync(out, JSON.stringify(file, null, 2) + "\n");
console.log(`Örnek katalog yazıldı: ${out} (${products.length} ürün)`);
