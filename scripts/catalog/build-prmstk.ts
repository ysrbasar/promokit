/**
 * prmstk.com tarama kayıtlarından data/prmstk-catalog.json üretir (ipromosyon kataloğunun yanına eklenen ikinci tedarikçi).
 *
 *   npm run catalog:prmstk                    # stok tara (prmstk.com) + fiyat tara (promosyonfirma.com) + derle
 *   tsx scripts/catalog/build-prmstk.ts       # yalnız derle (data/import/prmstk-records.json'dan)
 *   tsx scripts/catalog/build-prmstk.ts --legacy eski.json   # açıklama/ölçü gibi alanları eski bir dosyadan da taşı
 *
 * Stok ve fiyat her seferinde taramadan gelir. Açıklama, alt kategori, ölçü, malzeme ve galeri gibi
 * taramada olmayan alanlar bir önceki dosyadan (ya da --legacy) ürün koduna göre korunur.
 */
import path from "node:path";
import { CatalogFile, type Product } from "../../src/lib/catalog/schema";
import { mergeCatalog } from "../../src/lib/import/merge";
import type { RawRecord } from "../../src/lib/import/prmstkParser";
import type { SiteRecord } from "../../src/lib/import/siteParser";
import { IMPORT_DIR, ROOT, arg, readJsonFile, writeJsonFile } from "./lib/http";

const OUT = path.join(ROOT, "data/prmstk-catalog.json");

type PrmState = { pages: Record<string, { status: string; fetchedAt: string | null }> };

const CARRY = ["subcategory", "description", "dimensions", "material", "capacity", "sourceProductUrl"] as const;

function carryOver(p: Product, old: Product | undefined): Product {
  if (!old) return p;
  const out: Product = { ...p };
  for (const k of CARRY) if (out[k] == null && old[k] != null) (out as Record<string, unknown>)[k] = old[k];
  if (Object.keys(out.technicalSpecifications).length === 0) out.technicalSpecifications = old.technicalSpecifications;
  if (out.gallery.length < old.gallery.length) out.gallery = old.gallery;
  if (out.tags.length === 0) out.tags = old.tags;
  if (out.printingMethods.length === 0) out.printingMethods = old.printingMethods;
  return out;
}

function main() {
  const records = readJsonFile<Record<string, RawRecord[]>>(path.join(IMPORT_DIR, "prmstk-records.json"), {});
  const state = readJsonFile<PrmState>(path.join(IMPORT_DIR, "prmstk-state.json"), { pages: {} });
  const flat = Object.values(records).flat();
  if (!flat.length) {
    console.error("prmstk kaydı yok. Önce `npm run scrape:prmstk` çalıştırın. Dosya DEĞİŞTİRİLMEDİ.");
    process.exit(2);
  }
  const fetchedAt: Record<number, string> = {};
  for (const [k, s] of Object.entries(state.pages)) if (s.fetchedAt) fetchedAt[Number(k)] = s.fetchedAt;

  const previous = new Map<string, Product>();
  for (const file of [arg("legacy"), OUT].filter((f): f is string => !!f)) {
    const parsed = CatalogFile.safeParse(readJsonFile<unknown>(file, null));
    if (parsed.success) for (const p of parsed.data.products) previous.set(p.productCode, p);
  }

  const now = new Date().toISOString();
  // Fiyat, açıklama ve galeri promosyonfirma.com ürün sayfalarından (npm run site:crawl) gelir
  const site = Object.values(readJsonFile<Record<string, SiteRecord>>(path.join(IMPORT_DIR, "site-records.json"), {}));
  const { products } = mergeCatalog({ prmstk: flat, site, pdf: null, fetchedAt, now });
  const out = products.map((p) => ({ ...carryOver(p, previous.get(p.productCode)), supplier: "prmstk" as const }));
  if (out.length < 300) {
    console.error(`Şüpheli küçük tarama (${out.length} ürün); dosya DEĞİŞTİRİLMEDİ.`);
    process.exit(3);
  }
  writeJsonFile(OUT, CatalogFile.parse({ meta: { kind: "import", generatedAt: now, note: "prmstk.com" }, products: out }));
  const priced = out.filter((p) => p.price !== null).length;
  const inStock = out.filter((p) => (p.stockQuantity ?? 0) > 0).length;
  console.log(`data/prmstk-catalog.json yazıldı: ${out.length} ürün · ${priced} fiyatlı · ${inStock} stokta`);
}

main();
