/**
 * promosyonfirma.com ürün detaylarını sitemap üzerinden toplar (JSON-LD öncelikli).
 *
 *   npm run site:crawl                              # sitemap → ürün sayfaları; kaldığı yerden devam
 *   npm run site:crawl -- --pattern "/urun/"         # ürün URL'lerini süzen düzenli ifade
 *   npm run site:crawl -- --max 200 --delay 1500
 *
 * Çıktı: data/import/site-records.json, data/import/site-state.json
 */
import path from "node:path";
import { parseSitemap, parseSitePage, type SiteRecord } from "../../src/lib/import/siteParser";
import { IMPORT_DIR, arg, decodeHtml, fetchWithRetry, readJsonFile, robotsAllows, sleep, writeJsonFile } from "./lib/http";

const ORIGIN = arg("origin") ?? "https://www.promosyonfirma.com";
const PATTERN = arg("pattern") ? new RegExp(arg("pattern") as string) : null;
const MAX = Number(arg("max") ?? 5000);
const DELAY = Number(arg("delay") ?? 1500);
const STATE_FILE = path.join(IMPORT_DIR, "site-state.json");
const OUT = path.join(IMPORT_DIR, "site-records.json");

type State = { urls: string[]; done: Record<string, "ok" | "no-product" | "failed" | "disallowed">; errors: Record<string, string> };

async function collectUrls(): Promise<string[]> {
  const robots = await robotsAllows(ORIGIN, "/");
  const queue = robots.sitemaps.length ? [...robots.sitemaps] : [`${ORIGIN}/sitemap.xml`];
  const urls = new Set<string>();
  const seen = new Set<string>();
  while (queue.length) {
    const sm = queue.shift() as string;
    if (seen.has(sm)) continue;
    seen.add(sm);
    try {
      const { body, contentType } = await fetchWithRetry(sm);
      const parsed = parseSitemap(decodeHtml(body, contentType));
      queue.push(...parsed.sitemaps);
      parsed.urls.forEach((u) => urls.add(u));
      console.log(`sitemap: ${sm} → ${parsed.urls.length} URL, ${parsed.sitemaps.length} alt sitemap`);
    } catch (e) {
      console.warn(`sitemap okunamadı: ${sm} (${(e as Error).message})`);
    }
    await sleep(500);
  }
  return [...urls].filter((u) => (PATTERN ? PATTERN.test(u) : true));
}

async function main() {
  const state = readJsonFile<State>(STATE_FILE, { urls: [], done: {}, errors: {} });
  const records = readJsonFile<Record<string, SiteRecord>>(OUT, {});
  if (!state.urls.length) {
    state.urls = await collectUrls();
    writeJsonFile(STATE_FILE, state);
    if (!state.urls.length) {
      console.error("Sitemap'ten URL alınamadı. --pattern veya elle URL listesi gerekebilir.");
      process.exit(2);
    }
  }
  let processed = 0;
  for (const url of state.urls) {
    if (processed >= MAX) break;
    if (state.done[url] === "ok" || state.done[url] === "no-product") continue;
    const u = new URL(url);
    if (!(await robotsAllows(u.origin, u.pathname)).allowed) {
      state.done[url] = "disallowed";
      continue;
    }
    try {
      const { body, contentType } = await fetchWithRetry(url);
      const rec = parseSitePage(decodeHtml(body, contentType), url);
      if (rec) records[url] = rec;
      state.done[url] = rec ? "ok" : "no-product";
    } catch (e) {
      state.done[url] = "failed";
      state.errors[url] = (e as Error).message;
    }
    processed++;
    if (processed % 10 === 0) {
      writeJsonFile(STATE_FILE, state);
      writeJsonFile(OUT, records);
      console.log(`${processed} sayfa işlendi, ${Object.keys(records).length} ürün`);
    }
    await sleep(DELAY);
  }
  writeJsonFile(STATE_FILE, state);
  writeJsonFile(OUT, records);
  const failed = Object.values(state.done).filter((s) => s === "failed").length;
  console.log(`Bitti. Ürün kaydı: ${Object.keys(records).length}, başarısız: ${failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
