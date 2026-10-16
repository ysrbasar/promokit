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
import type { RawRecord } from "../../src/lib/import/prmstkParser";
import { slugify } from "../../src/lib/catalog/enrich";
import { IMPORT_DIR, arg, decodeHtml, fetchWithRetry, readJsonFile, robotsAllows, sleep, writeJsonFile } from "./lib/http";

const ORIGIN = arg("origin") ?? "https://www.promosyonfirma.com";
const PATTERN = arg("pattern") ? new RegExp(arg("pattern") as string) : null;
const MAX = Number(arg("max") ?? 5000);
const DELAY = Number(arg("delay") ?? 900);
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
  // Sitemap eski biçimde (/urunNNN/slug.html); gerçek adres /promosyon-slug-NNN-urunu.html
  const fixed = [...urls].map((u) => u.replace(/\/urun(\d+)\/([^/]+)\.html$/, "/promosyon-$2-$1-urunu.html"));
  const filtered = fixed.filter((u) => (PATTERN ? PATTERN.test(u) : /-urunu\.html$/.test(u)));
  return onePerProduct(filtered);
}

/** prmstk kayıtlarındaki her ana ürün için tek bir renk sayfası seçer (diğer renkler sayfadaki tabloda) */
function onePerProduct(urls: string[]): string[] {
  const records = readJsonFile<Record<string, RawRecord[]>>(path.join(IMPORT_DIR, "prmstk-records.json"), {});
  const slugOf = (u: string) => u.match(/\/promosyon-(.+)-\d+-urunu\.html$/)?.[1] ?? "";
  const bySlug = urls.map((u) => ({ u, s: slugOf(u) }));
  const picked = new Set<string>();
  const bases = new Map<string, string[]>();
  for (const r of Object.values(records).flat()) bases.set(r.baseCode, [...(bases.get(r.baseCode) ?? []), r.code]);
  if (!bases.size) return urls;
  for (const codes of bases.values()) {
    for (const code of codes) {
      const prefix = slugify(code) + "-";
      const hit = bySlug.find((x) => x.s.startsWith(prefix));
      if (hit) {
        picked.add(hit.u);
        break;
      }
    }
  }
  console.log(`Ürün sayfası: ${urls.length} → ana ürün başına bir sayfa: ${picked.size} (${bases.size} ana ürün)`);
  return [...picked];
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
  const robots = await robotsAllows(ORIGIN, "/");
  let processed = 0;
  for (const url of state.urls) {
    if (processed >= MAX) break;
    if (state.done[url] === "ok" || state.done[url] === "no-product") continue;
    if (!robots.allowed) {
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
