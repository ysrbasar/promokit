/**
 * ipromosyon XML'lerinden kataloğu günceller.  Kullanım: npm run catalog:update [-- --seed]
 * Gerekli: .env içinde IPRO_XML_KEY=<anahtar>
 * --seed: depodaki başlangıç verisini (data/catalog.json, data/kits.json) de yeniler.
 */
import { runSync } from "../../src/lib/import/sync";

runSync({ seed: process.argv.includes("--seed") }).then((s) => {
  if (!s.ok) {
    console.error("Güncelleme başarısız:", s.error);
    process.exit(1);
  }
  console.log(`Tamam (${s.durationMs} ms). Tedarikçi XML tarihleri — ürün: ${s.feeds?.all.generatedAt}, stok: ${s.feeds?.stock.generatedAt}`);
  console.log(s.stats);
});
