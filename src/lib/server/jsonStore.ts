import "server-only";
import { readText, stamp, writeData } from "./storage";

/**
 * JSON kayıtları. Asıl okuma/yazma storage.ts'te: yerelde dosya sistemi, Netlify'da Netlify Blobs.
 * Repository arayüzleri sayesinde ileride veritabanına geçiş yalnızca bu katmanı değiştirir.
 */

export { DATA_DIR, RUNTIME_DIR } from "./storage";

export async function readJson<T>(file: string): Promise<T | null> {
  const text = await readText(file);
  return text === null ? null : (JSON.parse(text) as T);
}

export async function writeJson(file: string, data: unknown): Promise<void> {
  await writeData(file, JSON.stringify(data, null, 2) + "\n");
}

export const mtime = stamp;
