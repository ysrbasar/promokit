import "server-only";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Basit dosya tabanlı JSON deposu. Demo ve tek sunuculu kurulum içindir;
 * Repository arayüzleri sayesinde ileride veritabanına geçiş yalnızca bu katmanı değiştirir.
 * NOT: Sunucusuz (serverless) dağıtımlarda dosya sistemi kalıcı değildir.
 */

export const DATA_DIR = process.env.PROMOKIT_DATA_DIR
  ? path.resolve(process.env.PROMOKIT_DATA_DIR)
  : path.resolve(process.cwd(), "data");

export const RUNTIME_DIR = path.join(DATA_DIR, "runtime");

export async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}

/** Yarım yazılmış dosya bırakmamak için geçici dosyaya yazıp yeniden adlandırır */
export async function writeJson(file: string, data: unknown): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
  await rename(tmp, file);
}

export async function mtime(file: string): Promise<number> {
  try {
    return (await stat(file)).mtimeMs;
  } catch {
    return 0;
  }
}
