/**
 * Yönetici oturumu: HMAC-SHA256 ile imzalanmış, süreli, httpOnly çerez.
 * Web Crypto kullanır; hem middleware (edge) hem Node çalışma zamanında çalışır.
 * Gizli anahtar yalnızca sunucu ortam değişkenindedir (ADMIN_SESSION_SECRET).
 */

export const SESSION_COOKIE = "pk_admin";
export const SESSION_TTL_SECONDS = 60 * 60 * 8;

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function sessionSecret(): string | null {
  const s = process.env.ADMIN_SESSION_SECRET;
  return s && s.length >= 32 ? s : null;
}

async function key(secret: string) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function signSession(secret: string, now = Date.now()): Promise<string> {
  const payload = b64url(enc.encode(JSON.stringify({ sub: "admin", exp: Math.floor(now / 1000) + SESSION_TTL_SECONDS })));
  const sig = await crypto.subtle.sign("HMAC", await key(secret), enc.encode(payload));
  return `${payload}.${b64url(sig)}`;
}

export async function verifySession(token: string | undefined, secret: string | null, now = Date.now()): Promise<boolean> {
  if (!token || !secret) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  try {
    const ok = await crypto.subtle.verify("HMAC", await key(secret), fromB64url(sig), enc.encode(payload));
    if (!ok) return false;
    const data = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as { sub?: string; exp?: number };
    return data.sub === "admin" && typeof data.exp === "number" && data.exp * 1000 > now;
  } catch {
    return false;
  }
}
