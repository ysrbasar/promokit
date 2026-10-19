import { readSyncStatus, runSync, syncConfigured, syncIntervalMinutes } from "./lib/import/sync";

/**
 * Sunucu açılınca ipromosyon XML senkronizasyonunu başlatır ve IPRO_SYNC_MINUTES
 * (varsayılan 30 dk) aralıklarla tekrarlar. Anahtar tanımlı değilse hiçbir şey yapmaz.
 */
export async function startCatalogSync() {
  if (!syncConfigured()) {
    console.log("[katalog] IPRO_XML_KEY yok; otomatik güncelleme kapalı.");
    return;
  }
  const every = syncIntervalMinutes() * 60_000;
  const tick = () =>
    runSync().then((s) => console.log(`[katalog] güncelleme ${s.ok ? "tamam" : "HATA: " + s.error} (${s.durationMs} ms)`));
  const last = (await readSyncStatus()).lastSuccessAt;
  const age = last ? Date.now() - Date.parse(last) : Infinity;
  setTimeout(tick, age > every ? 3_000 : every - age);
  setInterval(tick, every).unref?.();
}
