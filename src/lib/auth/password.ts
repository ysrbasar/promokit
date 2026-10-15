import "server-only";
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

/**
 * Biçim: scrypt.<salt-hex>.<hash-hex>
 * ("$" kullanılmaz: .env yükleyicisi ve kabuk "$..." ifadelerini değişken olarak genişletir)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt.${salt.toString("hex")}.${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string | undefined): Promise<boolean> {
  if (!stored) return false;
  const [algo, saltHex, hashHex] = stored.trim().split(".");
  if (algo !== "scrypt" || !/^[0-9a-f]{32}$/.test(saltHex ?? "") || !/^[0-9a-f]{128}$/.test(hashHex ?? "")) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
