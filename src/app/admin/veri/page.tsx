import path from "node:path";
import { getCatalog, getImportReport } from "@/lib/server/repositories";
import { DATA_DIR, readJson } from "@/lib/server/jsonStore";

type Review = { productCode: string; reason: string; detail?: string }[];

export default async function AdminData() {
  const [{ products, info }, report, review] = await Promise.all([
    getCatalog(),
    getImportReport(),
    readJson<Review>(path.join(DATA_DIR, "import", "review-queue.json")),
  ]);
  const noImage = products.filter((p) => !p.imageOriginalUrl && !p.localImagePath);
  return (
    <div>
      <h1 className="text-4xl">Veri kalitesi</h1>
      {info.kind === "demo" && (
        <p className="mt-4 rounded-card bg-warning/10 p-4 text-sm text-warning">
          Uygulama örnek katalogla çalışıyor. Gerçek veri için sunucuda: <code>npm run scrape:inspect</code> → <code>npm run scrape</code> → <code>npm run site:crawl</code> → <code>npm run pdf:index</code> → <code>npm run catalog:build</code>
        </p>
      )}
      <section className="mt-8">
        <h2 className="text-2xl">Son içe aktarma raporu</h2>
        {report ? (
          <pre className="mt-4 max-h-[480px] overflow-auto rounded-card border border-line bg-paper p-5 text-xs">{JSON.stringify(report, null, 2)}</pre>
        ) : (
          <p className="mt-2 text-sm text-muted">Henüz rapor yok (data/import/report.json).</p>
        )}
      </section>
      <section className="mt-10">
        <h2 className="text-2xl">İnceleme kuyruğu ({review?.length ?? 0})</h2>
        {review?.length ? (
          <ul className="mt-4 max-h-80 overflow-auto rounded-card border border-line bg-paper p-4 text-xs">
            {review.slice(0, 500).map((r, i) => <li key={i} className="border-b border-line py-1.5"><span className="font-mono">{r.productCode}</span> — {r.reason}{r.detail && ` (${r.detail})`}</li>)}
          </ul>
        ) : <p className="mt-2 text-sm text-muted">Kayıt yok.</p>}
      </section>
      <section className="mt-10">
        <h2 className="text-2xl">Görseli eksik ürünler ({noImage.length})</h2>
        <ul className="mt-4 max-h-80 overflow-auto rounded-card border border-line bg-paper p-4 text-xs">
          {noImage.slice(0, 500).map((p) => <li key={p.productCode} className="border-b border-line py-1.5"><span className="font-mono">{p.productCode}</span> — {p.name}</li>)}
        </ul>
      </section>
    </div>
  );
}
