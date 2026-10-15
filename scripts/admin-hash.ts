/** Kullanım: npm run admin:hash -- "güçlü-parola"  → .env içine ADMIN_PASSWORD_HASH olarak yazın */
import { randomBytes, scryptSync } from "node:crypto";

const pw = process.argv[2];
if (!pw || pw.length < 10) {
  console.error("En az 10 karakterlik bir parola verin: npm run admin:hash -- \"parola\"");
  process.exit(1);
}
const salt = randomBytes(16);
const hash = scryptSync(pw, salt, 64);
console.log(`ADMIN_PASSWORD_HASH=scrypt.${salt.toString("hex")}.${hash.toString("hex")}`);
console.log(`ADMIN_SESSION_SECRET=${randomBytes(32).toString("hex")}`);
