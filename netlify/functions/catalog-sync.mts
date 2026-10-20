/**
 * KATALOG GÜNCELLEME (Netlify zamanlanmış fonksiyonu)
 * Sunucusuz ortamda kalıcı süreç olmadığından yerel kurulumdaki instrumentation zamanlayıcısının yerini alır:
 * ipromosyon XML'lerini her 30 dakikada bir çekip kataloğu Netlify Blobs'a yazar.
 * IPRO_XML_KEY Netlify ortam değişkenlerinden okunur; tanımlı değilse hiçbir şey yapmaz.
 */
import { runSync, syncConfigured } from "../../src/lib/import/sync";

export default async () => {
  process.env.STORAGE_DRIVER = "blobs";
  if (!syncConfigured()) {
    console.log("[katalog] IPRO_XML_KEY yok; güncelleme atlandı.");
    return;
  }
  const s = await runSync();
  console.log(`[katalog] güncelleme ${s.ok ? "tamam" : "HATA: " + s.error} (${s.durationMs} ms)`);
};

export const config = { schedule: "*/30 * * * *" };
