/**
 * 2027 PDF kataloğunu sayfa grupları halinde işler ve ürün kodu → PDF sayfası indeksi çıkarır.
 *
 *   npm run pdf:index                   # indir (yoksa) + işle; kaldığı yerden devam eder
 *   npm run pdf:index -- --group 10     # grup boyutu (varsayılan 20 sayfa)
 *   npm run pdf:index -- --file yol.pdf # elle indirilmiş dosyayı kullan
 *
 * Bilinen kodlar prmstk-records.json'dan alınır; PDF metninde aranır.
 * Metin katmanı olmayan (taranmış görüntü) sayfalar "ocrNeeded" olarak raporlanır.
 * OCR ve PDF'ten görsel kırpma bu sürümde UYGULANMADI.
 */
import { createWriteStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { RawRecord } from "../../src/lib/import/prmstkParser";
import { normalizeCode } from "../../src/lib/catalog/search";
import { IMPORT_DIR, USER_AGENT, arg, ensureDir, readJsonFile, writeJsonFile } from "./lib/http";

const URL_ = arg("url") ?? "https://www.promosyonfirma.com/indir/2027/2027_katalog.pdf";
const FILE = arg("file") ?? path.join(IMPORT_DIR, "2027_katalog.pdf");
const GROUP = Number(arg("group") ?? 20);
const OUT = path.join(IMPORT_DIR, "pdf-index.json");

type PdfState = {
  file: string;
  bytes: number;
  numPages: number;
  processedThrough: number;
  pages: Record<string, { codes: string[]; chars: number }>;
  ocrNeeded: number[];
  codes: Record<string, number[]>;
};

async function download() {
  if (existsSync(FILE)) return;
  ensureDir(path.dirname(FILE));
  const head = await fetch(URL_, { method: "HEAD", headers: { "User-Agent": USER_AGENT } });
  const size = Number(head.headers.get("content-length") ?? 0);
  console.log(`PDF boyutu: ${size ? (size / 1024 / 1024).toFixed(1) + " MB" : "bilinmiyor"} — indiriliyor (akış halinde)…`);
  const res = await fetch(URL_, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok || !res.body) throw new Error(`PDF indirilemedi: HTTP ${res.status}`);
  const tmp = `${FILE}.part`;
  await pipeline(Readable.fromWeb(res.body as import("node:stream/web").ReadableStream), createWriteStream(tmp));
  const { renameSync } = await import("node:fs");
  renameSync(tmp, FILE);
}

async function main() {
  await download();
  const bytes = statSync(FILE).size;
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = pdfjs.getDocument({ url: FILE, disableFontFace: true, useSystemFonts: false });
  const doc = await task.promise;

  const records = readJsonFile<Record<string, RawRecord[]>>(path.join(IMPORT_DIR, "prmstk-records.json"), {});
  const known = new Map<string, string>();
  for (const recs of Object.values(records)) {
    for (const r of recs) {
      known.set(normalizeCode(r.baseCode), normalizeCode(r.baseCode));
      known.set(normalizeCode(r.code), normalizeCode(r.baseCode));
    }
  }
  if (!known.size) console.warn("Uyarı: prmstk kayıtları yok; yalnızca metin istatistiği çıkarılacak. Önce `npm run scrape` çalıştırın.");

  const state = readJsonFile<PdfState>(OUT, { file: FILE, bytes, numPages: doc.numPages, processedThrough: 0, pages: {}, ocrNeeded: [], codes: {} });
  console.log(`Sayfa sayısı: ${doc.numPages}, kaldığı yer: ${state.processedThrough}`);

  for (let start = state.processedThrough + 1; start <= doc.numPages; start += GROUP) {
    const end = Math.min(doc.numPages, start + GROUP - 1);
    for (let n = start; n <= end; n++) {
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      const text = content.items.map((i) => ("str" in i ? i.str : "")).join(" ");
      const tokens = new Set(text.toUpperCase().match(/[A-Z0-9][A-Z0-9.\-/]{2,19}/g) ?? []);
      const codes = new Set<string>();
      for (const t of tokens) {
        const base = known.get(normalizeCode(t));
        if (base) codes.add(base);
      }
      state.pages[n] = { codes: [...codes], chars: text.trim().length };
      if (text.trim().length < 20) state.ocrNeeded.push(n);
      for (const c of codes) (state.codes[c] ??= []).includes(n) || state.codes[c].push(n);
      page.cleanup();
    }
    state.processedThrough = end;
    writeJsonFile(OUT, state);
    console.log(`Sayfa ${start}–${end} işlendi (${Object.keys(state.codes).length} kod eşleşti)`);
  }
  await task.destroy();
  console.log(`Bitti. Metinsiz (OCR gerektiren) sayfa: ${state.ocrNeeded.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
