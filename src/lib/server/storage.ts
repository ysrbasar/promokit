import { mkdir, readdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Store } from "@netlify/blobs";

/**
 * Kalıcı kayıt katmanı. Yerelde ve tek sunuculu kurulumda dosya sistemi (data/ klasörü) kullanılır.
 * Netlify gibi sunucusuz ortamlarda dosya sistemi kalıcı olmadığından data/runtime ve data/private
 * altındaki her şey Netlify Blobs'a ("promokit" deposu) yazılır; anahtar, data/'ya göre göreli yoldur.
 * Depodaki başlangıç verisi (data/catalog.json, data/kits.json…) her iki durumda da dosyadan okunur.
 *
 * "server-only" içe aktarılmaz: komut satırı ve Netlify zamanlanmış fonksiyonu da bu modülü kullanır.
 */

export const DATA_DIR = process.env.PROMOKIT_DATA_DIR
  ? path.resolve(process.env.PROMOKIT_DATA_DIR)
  : path.resolve(process.cwd(), "data");

export const RUNTIME_DIR = path.join(DATA_DIR, "runtime");
export const PRIVATE_DIR = path.join(DATA_DIR, "private");

/** STORAGE_DRIVER=blobs|fs ile seçilir; belirtilmezse Netlify ortamı kendiliğinden algılanır */
export const usesBlobs = () => {
  const d = process.env.STORAGE_DRIVER;
  if (d === "blobs" || d === "fs") return d === "blobs";
  return process.env.NETLIFY === "true" || !!process.env.NETLIFY_BLOBS_CONTEXT || "netlifyBlobsContext" in globalThis;
};

// Depo nesnesi her çağrıda yeniden alınır: Netlify erişim anahtarını istek başına verir ve süresi dolar.
// Sıcak kalan bir sunucuda saklanan eski nesne "Token expired" ile tüm sayfaları düşürüyordu.
let mod: Promise<typeof import("@netlify/blobs")> | null = null;
const blobs = async (): Promise<Store> =>
  (await (mod ??= import("@netlify/blobs"))).getStore({ name: "promokit", consistency: "strong" });

/** Blobs'a gidecek dosyanın anahtarı; depodaki başlangıç verisi için null */
function blobKey(file: string): string | null {
  if (!usesBlobs()) return null;
  const rel = path.relative(DATA_DIR, path.resolve(file));
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  const key = rel.split(path.sep).join("/");
  return key.startsWith("runtime/") || key.startsWith("private/") ? key : null;
}

const missing = (e: unknown) => (e as NodeJS.ErrnoException).code === "ENOENT";

export async function readText(file: string): Promise<string | null> {
  const key = blobKey(file);
  if (key) return (await (await blobs()).get(key, { type: "text" })) ?? null;
  try {
    return await readFile(file, "utf8");
  } catch (e) {
    if (missing(e)) return null;
    throw e;
  }
}

export async function readBytes(file: string): Promise<Uint8Array | null> {
  const key = blobKey(file);
  if (key) {
    const buf = await (await blobs()).get(key, { type: "arrayBuffer" });
    return buf ? new Uint8Array(buf) : null;
  }
  try {
    return new Uint8Array(await readFile(file));
  } catch (e) {
    if (missing(e)) return null;
    throw e;
  }
}

/** Yarım yazılmış dosya bırakmamak için geçici dosyaya yazıp yeniden adlandırır (Blobs zaten atomiktir) */
export async function writeData(file: string, data: string | Uint8Array): Promise<void> {
  const key = blobKey(file);
  if (key) {
    const body = typeof data === "string" ? data : new Blob([data as Uint8Array<ArrayBuffer>]);
    await (await blobs()).set(key, body, { metadata: { t: Date.now() } });
    return;
  }
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, data);
  await rename(tmp, file);
}

/** Klasördeki dosya adları (alt klasörler hariç) */
export async function listNames(dir: string): Promise<string[]> {
  const key = blobKey(path.join(dir, "_"));
  if (key) {
    const prefix = key.slice(0, -1);
    const { blobs: items } = await (await blobs()).list({ prefix });
    return items.map((b) => b.key.slice(prefix.length)).filter((n) => !n.includes("/"));
  }
  try {
    return await readdir(dir);
  } catch (e) {
    if (missing(e)) return [];
    throw e;
  }
}

/** Değişiklik damgası (önbellek anahtarı için); yoksa 0 */
export async function stamp(file: string): Promise<number> {
  const key = blobKey(file);
  if (key) {
    const m = await (await blobs()).getMetadata(key);
    return m ? Number(m.metadata.t) || 1 : 0;
  }
  try {
    return (await stat(file)).mtimeMs;
  } catch {
    return 0;
  }
}
