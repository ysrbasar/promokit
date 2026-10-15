import Link from "next/link";
import { ProductControls } from "@/components/admin/AdminWidgets";
import { STOCK_LABEL } from "@/lib/catalog/stock";
import { normalize, normalizeCode } from "@/lib/catalog/search";
import { getCatalog } from "@/lib/server/repositories";

const PAGE = 50;

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ q?: string; durum?: string; sayfa?: string }> }) {
  const { q = "", durum = "", sayfa = "1" } = await searchParams;
  const { products } = await getCatalog();
  const nq = normalize(q);
  let list = products.filter((p) => !q || normalize(p.name).includes(nq) || normalizeCode(p.productCode).includes(normalizeCode(q)));
  if (durum === "pasif") list = list.filter((p) => !p.isActive);
  if (durum === "gorselsiz") list = list.filter((p) => !p.imageOriginalUrl && !p.localImagePath);
  if (durum === "inceleme") list = list.filter((p) => p.needsReview.length > 0);
  const page = Math.max(1, Number(sayfa) || 1);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const rows = list.slice((page - 1) * PAGE, page * PAGE);
  const href = (n: number) => `/admin/urunler?${new URLSearchParams({ q, durum, sayfa: String(n) })}`;

  return (
    <div>
      <h1 className="text-4xl">Ürünler</h1>
      <form className="mt-6 flex flex-wrap gap-2" action="/admin/urunler">
        <input name="q" defaultValue={q} placeholder="Ad veya ürün kodu" className="h-11 min-w-64 flex-1 rounded-full border border-line-strong bg-paper px-5 text-sm" />
        <select name="durum" defaultValue={durum} className="h-11 rounded-full border border-line-strong bg-paper px-4 text-sm" aria-label="Durum filtresi">
          <option value="">Tümü</option>
          <option value="pasif">Pasif</option>
          <option value="gorselsiz">Görseli eksik</option>
          <option value="inceleme">İnceleme gerektiren</option>
        </select>
        <button className="h-11 rounded-full bg-ink px-6 text-sm font-semibold text-ivory">Ara</button>
      </form>
      <p className="mt-4 text-sm text-muted">{list.length} ürün</p>
      <div className="mt-4 overflow-x-auto rounded-card border border-line bg-paper">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-stone/60 text-left text-xs text-muted">
            <tr>
              <th className="p-3">Kod</th>
              <th className="p-3">Ad</th>
              <th className="p-3">Stok</th>
              <th className="p-3">Fiyat</th>
              <th className="p-3">Veri</th>
              <th className="p-3">Yönetim</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.productCode} className="border-t border-line align-top">
                <td className="p-3 font-mono text-xs">{p.productCode}</td>
                <td className="p-3">
                  <Link href={`/urun/${p.slug}`} className="hover:underline" target="_blank">{p.name}</Link>
                  <div className="mt-1 text-xs text-subtle">{p.variants.length} varyant</div>
                </td>
                <td className="p-3 text-xs">
                  {STOCK_LABEL[p.stockStatus]}
                  <div className="text-subtle">{p.stockQuantity ?? "—"} adet</div>
                </td>
                <td className="p-3 text-xs">{p.price !== null ? `${p.price} ${p.priceCurrency ?? ""} (${p.priceType})` : "—"}</td>
                <td className="p-3 text-xs">
                  %{Math.round(p.dataCompleteness * 100)}
                  {!p.imageOriginalUrl && !p.localImagePath && <div className="text-warning">görsel yok</div>}
                  {p.needsReview.map((r) => <div key={r} className="text-warning">{r}</div>)}
                </td>
                <td className="p-3">
                  <ProductControls code={p.productCode} isActive={p.isActive} isFeatured={p.isFeatured} category={p.category} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <nav className="mt-6 flex gap-2 text-sm" aria-label="Sayfalama">
          {page > 1 && <Link href={href(page - 1)} className="underline">← Önceki</Link>}
          <span className="text-muted">{page} / {pages}</span>
          {page < pages && <Link href={href(page + 1)} className="underline">Sonraki →</Link>}
        </nav>
      )}
    </div>
  );
}
