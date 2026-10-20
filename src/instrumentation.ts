export async function register() {
  // Netlify'da zamanlayıcı yerine netlify/functions/catalog-sync.mts çalışır (sunucusuz ortamda süreç kalıcı değildir)
  if (process.env.NEXT_RUNTIME === "nodejs" && !process.env.NETLIFY && process.env.STORAGE_DRIVER !== "blobs") {
    const { startCatalogSync } = await import("./instrumentation-node");
    await startCatalogSync();
  }
}
