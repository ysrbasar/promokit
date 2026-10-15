/**
 * Ham kaynak verilerini birleştirip data/catalog.json üretir ve doğrulama raporu yazar.
 *
 *   npm run catalog:build
 *   npm run catalog:build -- --download-images   # görselleri public/products/<kod>/ altına indir
 *
 * --download-images yalnızca kaynak sitenin görsellerin yeniden barındırılmasına İZİN
 * verdiği doğrulandıktan sonra kullanılmalıdır. Varsayılan: kaynak URL'si kullanılır.
 */
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { mergeCatalog, type PdfIndex, type ReviewItem } from "../../src/lib/import/merge";
import type { RawRecord } from "../../src/lib/import/prmstkParser";
import type { SiteRecord } from "../../src/lib/import/siteParser";
import { CatalogFile, type Product } from "../../src/lib/catalog/schema";
import { slugify } from "../../src/lib/catalog/enrich";
import { IMPORT_DIR, ROOT, ensureDir, fetchWithRetry, flag, readJsonFile, sleep, writeJsonFile } from "./lib/http";
import { buildReport } from "./report";

const DOWNLOAD = flag("download-images");

type PrmState = { pages: Record<string, { status: string; fetchedAt: string | null }> };

async function downloadImages(products: Product[], review: ReviewItem[]) {
  for (const p of products) {
    if (!p.imageOriginalUrl) continue;
    const dir = path.join(ROOT, "public/products", slugify(p.productCode));
    const ext = (p.imageOriginalUrl.match(/\.(jpe?g|png|webp|gif|avif)(?:\?|$)/i)?.[1] ?? "jpg").toLowerCase().replace("jpeg", "jpg");
    const file = path.join(dir, `main.${ext}`);
    const publicPath = `/products/${slugify(p.productCode)}/main.${ext}`;
    if (existsSync(file)) {
      p.localImagePath = publicPath; // aynı dosya yeniden indirilmez
      continue;
    }
    try {
      const { body, contentType } = await fetchWithRetry(p.imageOriginalUrl, { retries: 3, timeoutMs: 20000 });
      if (!contentType?.startsWith("image/") || body.length < 1500) {
        review.push({ productCode: p.productCode, reason: "image-broken", detail: `${contentType} ${body.length}B` });
        continue;
      }
      ensureDir(dir);
      await writeFile(file, body);
      p.localImagePath = publicPath;
    } catch (e) {
      review.push({ productCode: p.productCode, reason: "image-download-failed", detail: (e as Error).message });
    }
    await sleep(300);
  }
}

async function main() {
  const records = readJsonFile<Record<string, RawRecord[]>>(path.join(IMPORT_DIR, "prmstk-records.json"), {});
  const prmState = readJsonFile<PrmState>(path.join(IMPORT_DIR, "prmstk-state.json"), { pages: {} });
  const site = Object.values(readJsonFile<Record<string, SiteRecord>>(path.join(IMPORT_DIR, "site-records.json"), {}));
  const pdf = readJsonFile<PdfIndex | null>(path.join(IMPORT_DIR, "pdf-index.json"), null);

  const flat = Object.values(records).flat();
  if (!flat.length) {
    console.error("prmstk kaydı yok. Önce `npm run scrape` çalıştırın. Katalog OLUŞTURULMADI.");
    process.exit(2);
  }
  const fetchedAt: Record<number, string> = {};
  for (const [k, s] of Object.entries(prmState.pages)) if (s.fetchedAt) fetchedAt[Number(k)] = s.fetchedAt;

  const now = new Date().toISOString();
  const { products, review } = mergeCatalog({ prmstk: flat, site, pdf, fetchedAt, now });
  if (DOWNLOAD) await downloadImages(products, review);

  const file = CatalogFile.parse({ meta: { kind: "import", generatedAt: now }, products });
  writeJsonFile(path.join(ROOT, "data/catalog.json"), file);
  writeJsonFile(path.join(IMPORT_DIR, "review-queue.json"), review);
  const report = buildReport();
  console.log(`Katalog yazıldı: data/catalog.json (${products.length} ürün)`);
  console.log(report.text);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
