export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startCatalogSync } = await import("./instrumentation-node");
    await startCatalogSync();
  }
}
