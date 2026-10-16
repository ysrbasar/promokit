/**
 * prmstk.com stok kataloğu tarayıcısı (2.html … 264.html)
 *
 *   npm run scrape:inspect                 # ilk birkaç sayfanın yapısını incele (önce bunu çalıştırın)
 *   npm run scrape                         # tüm aralığı işle; kaldığı yerden devam eder
 *   npm run scrape -- --from 10 --to 20    # aralık
 *   npm run scrape -- --force              # başarılı sayfaları da yeniden işle
 *   npm run scrape -- --offline            # ağ yok: yalnızca ham HTML önbelleğini yeniden ayrıştır
 *
 * Çıktılar (data/import/):
 *   prmstk-state.json    sayfa bazında durum (ok / failed / empty), deneme sayısı, hata, hash
 *   prmstk-records.json  sayfa → ham varyant kayıtları (sayfa yeniden işlenince yerine yazılır; mükerrer olmaz)
 *   raw/prmstk/N.html    ham HTML önbelleği
 *   prmstk.config.json   (isteğe bağlı) elle ayarlanmış seçiciler — bkz. ParserConfig
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { inspectPage, parsePrmstkPage, type ParserConfig, type RawRecord } from "../../src/lib/import/prmstkParser";
import { HttpError, IMPORT_DIR, arg, decodeHtml, ensureDir, fetchWithRetry, flag, readJsonFile, robotsAllows, sha1, sleep, writeJsonFile } from "./lib/http";

const BASE = arg("base") ?? "https://www.prmstk.com/2027/";
const FROM = Number(arg("from") ?? 2);
const TO = Number(arg("to") ?? 264);
const DELAY = Number(arg("delay") ?? 1200);
const FORCE = flag("force");
const OFFLINE = flag("offline");
const INSPECT = flag("inspect");

const STATE_FILE = path.join(IMPORT_DIR, "prmstk-state.json");
const RECORDS_FILE = path.join(IMPORT_DIR, "prmstk-records.json");
const RAW_DIR = path.join(IMPORT_DIR, "raw/prmstk");
const CONFIG_FILE = path.join(IMPORT_DIR, "prmstk.config.json");

type PageState = {
  status: "ok" | "empty" | "failed";
  attempts: number;
  error: string | null;
  hash: string | null;
  fetchedAt: string | null;
  recordCount: number;
  warnings: string[];
};
type State = { base: string; updatedAt: string; pages: Record<string, PageState> };

async function main() {
  ensureDir(RAW_DIR);
  const config = readJsonFile<ParserConfig>(CONFIG_FILE, {});
  const state = readJsonFile<State>(STATE_FILE, { base: BASE, updatedAt: "", pages: {} });
  const records = readJsonFile<Record<string, RawRecord[]>>(RECORDS_FILE, {});

  if (!OFFLINE) {
    const u = new URL(BASE);
    const robots = await robotsAllows(u.origin, u.pathname);
    if (!robots.allowed) {
      console.error(`robots.txt ${u.pathname} yolunu taramaya kapatmış. İzin almadan devam edilmiyor.`);
      process.exit(2);
    }
  }

  if (INSPECT) {
    const pages = (arg("pages") ?? `${FROM},${FROM + 1},${Math.round((FROM + TO) / 2)}`).split(",").map(Number);
    const out: Record<string, unknown> = {};
    for (const n of pages) {
      const url = `${BASE}${n}.html`;
      const html = await getHtml(n, url);
      out[n] = { url, structure: inspectPage(html, url), parsed: parsePrmstkPage(html, url, n, config) };
      console.log(`\n── Sayfa ${n} ──`);
      console.dir(out[n], { depth: 5, maxArrayLength: 8 });
      await sleep(DELAY);
    }
    writeJsonFile(path.join(IMPORT_DIR, "prmstk-inspect.json"), out);
    console.log(`\nİnceleme kaydedildi: data/import/prmstk-inspect.json`);
    console.log("Ayrıştırma boş veya hatalıysa data/import/prmstk.config.json içinde 'selectors' tanımlayın.");
    return;
  }

  let ok = 0, failed = 0, empty = 0, skipped = 0;
  for (let n = FROM; n <= TO; n++) {
    const key = String(n);
    const prev = state.pages[key];
    if (!FORCE && prev?.status === "ok") {
      skipped++;
      continue;
    }
    const url = `${BASE}${n}.html`;
    const attempts = (prev?.attempts ?? 0) + 1;
    try {
      const html = await getHtml(n, url);
      const { records: recs, warnings } = parsePrmstkPage(html, url, n, config);
      records[key] = recs;
      state.pages[key] = {
        status: recs.length ? "ok" : "empty",
        attempts,
        error: null,
        hash: sha1(html),
        fetchedAt: new Date().toISOString(),
        recordCount: recs.length,
        warnings,
      };
      if (recs.length) ok++;
      else empty++;
      process.stdout.write(`\r${n}/${TO}  ok:${ok} boş:${empty} hata:${failed} atlanan:${skipped}   `);
    } catch (e) {
      // Aralığın sonu: ilk 404'te dur (sayfa sayısı yıldan yıla değişebilir)
      if (e instanceof HttpError && e.status === 404) {
        console.log(`\nSayfa ${n} yok (404) — katalog sonu.`);
        break;
      }
      failed++;
      state.pages[key] = {
        status: "failed",
        attempts,
        error: e instanceof Error ? e.message : String(e),
        hash: prev?.hash ?? null,
        fetchedAt: prev?.fetchedAt ?? null,
        recordCount: 0,
        warnings: [],
      };
      console.error(`\nSayfa ${n} başarısız: ${state.pages[key].error}`);
    }
    // Her sayfadan sonra kaydet: süreç yarıda kalırsa kaldığı yerden devam eder
    state.updatedAt = new Date().toISOString();
    writeJsonFile(STATE_FILE, state);
    writeJsonFile(RECORDS_FILE, records);
    if (!OFFLINE) await sleep(DELAY);
  }

  const failedPages = Object.entries(state.pages).filter(([, s]) => s.status === "failed").map(([k]) => k);
  const emptyPages = Object.entries(state.pages).filter(([, s]) => s.status === "empty").map(([k]) => k);
  const total = Object.values(records).reduce((s, r) => s + r.length, 0);
  console.log(`\n\nTamamlandı. Bu çalıştırma → ok:${ok} boş:${empty} hata:${failed} atlanan:${skipped}`);
  console.log(`Toplam ham varyant kaydı: ${total}`);
  if (failedPages.length) console.log(`Başarısız sayfalar (tekrar çalıştırın): ${failedPages.join(", ")}`);
  if (emptyPages.length) console.log(`Ürün bulunamayan sayfalar (scrape:inspect ile kontrol edin): ${emptyPages.join(", ")}`);
}

async function getHtml(n: number, url: string): Promise<string> {
  const cache = path.join(RAW_DIR, `${n}.html`);
  if (OFFLINE) {
    if (!existsSync(cache)) throw new Error("önbellekte yok (--offline)");
    return readFileSync(cache, "utf8");
  }
  const { body, contentType } = await fetchWithRetry(url);
  const html = decodeHtml(body, contentType);
  writeFileSync(cache, html);
  return html;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
