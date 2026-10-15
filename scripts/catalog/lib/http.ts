import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(import.meta.dirname, "../../..");
export const IMPORT_DIR = path.join(ROOT, "data/import");

export const USER_AGENT = "PromoKitCatalogBot/1.0 (+katalog eşleştirme; düşük hızda tarama)";

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function sha1(s: string | Buffer) {
  return createHash("sha1").update(s).digest("hex");
}

export function readJsonFile<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function writeJsonFile(file: string, data: unknown) {
  mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n");
  renameSync(tmp, file);
}

export class HttpError extends Error {
  constructor(
    message: string,
    public status: number | null,
  ) {
    super(message);
  }
}

/** Zaman aşımı + üstel geri çekilmeli yeniden deneme. 4xx (429 hariç) yeniden denenmez. */
export async function fetchWithRetry(
  url: string,
  opts: { retries?: number; timeoutMs?: number; binary?: boolean; headers?: Record<string, string> } = {},
): Promise<{ status: number; body: Buffer; contentType: string | null }> {
  const retries = opts.retries ?? 3;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 30000);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, "Accept-Language": "tr-TR,tr;q=0.9", ...opts.headers },
        signal: ctrl.signal,
        redirect: "follow",
      });
      const body = Buffer.from(await res.arrayBuffer());
      if (res.ok) return { status: res.status, body, contentType: res.headers.get("content-type") };
      if (res.status >= 400 && res.status < 500 && res.status !== 429) throw new HttpError(`HTTP ${res.status}`, res.status);
      lastErr = new HttpError(`HTTP ${res.status}`, res.status);
    } catch (e) {
      if (e instanceof HttpError && e.status && e.status < 500 && e.status !== 429) throw e;
      lastErr = e;
    } finally {
      clearTimeout(t);
    }
    if (attempt < retries) await sleep(1000 * 2 ** attempt);
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/** Türkçe karakter kodlamasını (windows-1254 / iso-8859-9) doğru çözer */
export function decodeHtml(body: Buffer, contentType: string | null): string {
  const headerCharset = contentType?.match(/charset=([^;]+)/i)?.[1]?.trim().toLowerCase();
  const sniff = body.subarray(0, 2048).toString("latin1").match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1]?.toLowerCase();
  const charset = headerCharset || sniff || "utf-8";
  try {
    return new TextDecoder(charset === "iso-8859-9" ? "windows-1254" : charset).decode(body);
  } catch {
    return body.toString("utf8");
  }
}

/** Basit robots.txt denetimi (User-agent: * grubundaki Disallow kuralları) */
export async function robotsAllows(origin: string, pathname: string): Promise<{ allowed: boolean; sitemaps: string[] }> {
  try {
    const { body } = await fetchWithRetry(`${origin}/robots.txt`, { retries: 1, timeoutMs: 10000 });
    const lines = body.toString("utf8").split(/\r?\n/);
    const sitemaps: string[] = [];
    let applies = false;
    const disallow: string[] = [];
    for (const line of lines) {
      const [k, ...rest] = line.split(":");
      const v = rest.join(":").trim();
      const key = k.trim().toLowerCase();
      if (key === "sitemap") sitemaps.push(v);
      if (key === "user-agent") applies = v === "*";
      if (applies && key === "disallow" && v) disallow.push(v);
    }
    return { allowed: !disallow.some((d) => pathname.startsWith(d)), sitemaps };
  } catch {
    // robots.txt yoksa (404) tarama serbest kabul edilir
    return { allowed: true, sitemaps: [] };
  }
}

export function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
export const flag = (name: string) => process.argv.includes(`--${name}`);
