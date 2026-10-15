/**
 * Veri kalitesi / doğrulama raporu: data/import/report.json (+ konsol özeti)
 *   npm run catalog:report
 * Rakamlar yalnızca gerçek çalışma çıktılarından hesaplanır.
 */
import path from "node:path";
import { pathToFileURL } from "node:url";
import { CatalogFile } from "../../src/lib/catalog/schema";
import { isProductEligible } from "../../src/lib/catalog/stock";
import { normalizeCode } from "../../src/lib/catalog/search";
import { DEFAULT_SETTINGS } from "../../src/lib/config/settings";
import type { ReviewItem } from "../../src/lib/import/merge";
import type { RawRecord } from "../../src/lib/import/prmstkParser";
import { IMPORT_DIR, ROOT, readJsonFile, writeJsonFile } from "./lib/http";

export function buildReport() {
  const state = readJsonFile<{ pages: Record<string, { status: string; error: string | null; fetchedAt: string | null }> }>(
    path.join(IMPORT_DIR, "prmstk-state.json"),
    { pages: {} },
  );
  const records = readJsonFile<Record<string, RawRecord[]>>(path.join(IMPORT_DIR, "prmstk-records.json"), {});
  const review = readJsonFile<ReviewItem[]>(path.join(IMPORT_DIR, "review-queue.json"), []);
  const settings = { ...DEFAULT_SETTINGS, ...readJsonFile<object>(path.join(ROOT, "data/runtime/settings.json"), {}) };
  const rawCatalog = readJsonFile<unknown>(path.join(ROOT, "data/catalog.json"), null);
  const catalog = rawCatalog ? CatalogFile.safeParse(rawCatalog) : null;
  const products = catalog?.success ? catalog.data.products : [];

  const pages = Object.entries(state.pages);
  const flat = Object.values(records).flat();
  const codeCounts = new Map<string, number>();
  for (const r of flat) codeCounts.set(normalizeCode(r.code), (codeCounts.get(normalizeCode(r.code)) ?? 0) + 1);
  const lastOk = pages.map(([, s]) => s.fetchedAt).filter(Boolean).sort().at(-1) ?? null;

  const report = {
    generatedAt: new Date().toISOString(),
    minStock: settings.minStock,
    pages: {
      expected: 263,
      attempted: pages.length,
      ok: pages.filter(([, s]) => s.status === "ok").length,
      empty: pages.filter(([, s]) => s.status === "empty").map(([k]) => Number(k)),
      failed: pages.filter(([, s]) => s.status === "failed").map(([k, s]) => ({ page: Number(k), error: s.error })),
    },
    rawVariantRecords: flat.length,
    duplicateVariantCodes: [...codeCounts.entries()].filter(([, n]) => n > 1).map(([c]) => c),
    recordsWithoutCode: flat.filter((r) => !r.code).length,
    products: {
      total: products.length,
      passingStockFilter: products.filter((p) => isProductEligible(p, settings.minStock)).length,
      withImage: products.filter((p) => p.imageOriginalUrl || p.localImagePath).length,
      withoutImage: products.filter((p) => !p.imageOriginalUrl && !p.localImagePath).length,
      stockUnknown: products.filter((p) => p.stockQuantity === null).length,
      withVerifiedPrice: products.filter((p) => p.priceType === "source").length,
      unmatchedToSite: products.filter((p) => !p.sourceProductUrl).length,
      unmatchedToPdf: products.filter((p) => p.sourcePdfPage === null).length,
      categoryUnknown: products.filter((p) => p.category === "diger").length,
    },
    reviewQueue: review.length,
    reviewByReason: review.reduce<Record<string, number>>((m, r) => ((m[r.reason] = (m[r.reason] ?? 0) + 1), m), {}),
    lastSuccessfulFetch: lastOk,
  };
  writeJsonFile(path.join(IMPORT_DIR, "report.json"), report);

  const text = [
    "── Doğrulama raporu ──",
    `Hedef sayfa: ${report.pages.expected}  |  denenen: ${report.pages.attempted}  |  başarılı: ${report.pages.ok}`,
    `Boş sayfa: ${report.pages.empty.length}  |  işlenemeyen: ${report.pages.failed.length}`,
    `Ham varyant kaydı: ${report.rawVariantRecords}  |  tekrar eden varyant kodu: ${report.duplicateVariantCodes.length}`,
    `Ürün: ${report.products.total}  |  stok filtresinden geçen (≥${report.minStock}): ${report.products.passingStockFilter}`,
    `Görselli: ${report.products.withImage}  |  görselsiz: ${report.products.withoutImage}  |  stok bilinmiyor: ${report.products.stockUnknown}`,
    `Doğrulanmış fiyatlı: ${report.products.withVerifiedPrice}  |  siteyle eşleşmeyen: ${report.products.unmatchedToSite}  |  PDF ile eşleşmeyen: ${report.products.unmatchedToPdf}`,
    `İnceleme kuyruğu: ${report.reviewQueue}  ${JSON.stringify(report.reviewByReason)}`,
    `Son başarılı veri toplama: ${report.lastSuccessfulFetch ?? "—"}`,
  ].join("\n");
  return { report, text };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  console.log(buildReport().text);
}
