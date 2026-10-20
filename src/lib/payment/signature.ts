import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Ödemeix webhook imzası: X-Odemeix-Signature = HMAC-SHA256(ham gövde, whsec_…) hex.
 * Zaman kontrolü imzalı gövdedeki `timestamp` ile yapılır (başlık imzanın dışındadır).
 */
export function verifyOdemeixSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature.trim().toLowerCase(), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isFreshTimestamp(timestamp: unknown, nowSec = Math.floor(Date.now() / 1000), toleranceSec = 300): boolean {
  const t = Number(timestamp);
  return Number.isFinite(t) && Math.abs(nowSec - t) <= toleranceSec;
}
