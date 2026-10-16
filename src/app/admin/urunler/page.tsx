import Link from "next/link";
import { AdminProductTable, type AdminRow } from "@/components/admin/AdminProductTable";
import { productImage } from "@/lib/catalog/lite";
import { formatMoney } from "@/lib/catalog/pricing";
import { STOCK_LABEL } from "@/lib/catalog/stock";
import { normalize, normalizeCode } from "@/lib/catalog/search";
import { CATEGORIES } from "@/lib/config/taxonomy";
import { getCatalog } from "@/lib/server/repositories";
import { cn } from "@/components/ui/primitives";

const PAGE = 100;
type SP = { q?: string; durum?: string; kategori?: string; sayfa?: string };

export default async function AdminProducts({ searchParams }: { searchParams: Promise<SP> }) {
  const { q = "", durum = "", kategori = "", sayfa = "1" } = await searchParams;
  const { products } = await getCatalog();

  const counts = new Map<string, number>();
  for (const p of products) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);

  const nq = normalize(q);
  let list = products.filter((p) => !q || normalize(p.name).includes(nq) || normalizeCode(p.productCode).includes(normalizeCode(q)));
  if (kategori) list = list.filter((p) => p.category === kategori);
  if (durum === "aktif") list = list.filter((p) => p.isActive);
  if (durum === "pasif") list = list.filter((p) => !p.isActive);
  if (durum === "fiyatsiz") list = list.filter((p) => p.price === null);
  if (durum === "inceleme") list = list.filter((p) => p.needsReview.length > 0);

  const page = Math.max(1, Number(sayfa) || 1);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const href = (patch: Partial<SP>) => `/admin/urunler?${new URLSearchParams({ q, durum, kategori, sayfa: "1", ...patch })}`;
  const rows: AdminRow[] = list.slice((page - 1) * PAGE, page * PAGE).map((p) => ({
    code: p.productCode,
    name: p.name,
    slug: p.slug,
    image: productImage(p),
    category: p.category,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    stockLabel: STOCK_LABEL[p.stockStatus],
    stockQuantity: p.stockQuantity,
    price: p.price !== null ? formatMoney(p.price, p.priceCurrency ?? "TRY") : "—",
    review: p.needsReview,
  }));

  return (
    <div>
      <h1 className="text-4xl">Ürünler</h1>
      <p className="mt-2 text-sm text-muted">
        &quot;Kaldır&quot; ürünü sitede, katalogda ve kit önerilerinde gizler; &quot;Geri al&quot; ile geri gelir. Kaldırılan ürünler katalog yeniden tarandığında da gizli kalır.
      </p>

      {/* Kategori sekmeleri */}
      <nav aria-label="Kategoriler" className="mt-6 flex flex-wrap gap-2">
        <Link href={href({ kategori: "" })} className={cn("rounded-full border px-3 py-1.5 text-xs", !kategori ? "border-ink bg-ink text-ivory" : "border-line-strong hover:border-ink")}>
          Tümü <span className="opacity-60">{products.length}</span>
        </Link>
        {CATEGORIES.filter((c) => counts.get(c.key)).map((c) => (
          <Link key={c.key} href={href({ kategori: c.key })} className={cn("rounded-full border px-3 py-1.5 text-xs", kategori === c.key ? "border-ink bg-ink text-ivory" : "border-line-strong hover:border-ink")}>
            {c.label} <span className="opacity-60">{counts.get(c.key)}</span>
          </Link>
        ))}
      </nav>

      <form className="mt-4 flex flex-wrap gap-2" action="/admin/urunler">
        <input type="hidden" name="kategori" value={kategori} />
        <input name="q" defaultValue={q} placeholder="Ad veya ürün kodu" className="h-11 min-w-64 flex-1 rounded-full border border-line-strong bg-paper px-5 text-sm" />
        <select name="durum" defaultValue={durum} className="h-11 rounded-full border border-line-strong bg-paper px-4 text-sm" aria-label="Durum filtresi">
          <option value="">Tüm durumlar</option>
          <option value="aktif">Sitede görünenler</option>
          <option value="pasif">Kaldırılanlar</option>
          <option value="fiyatsiz">Fiyatı olmayanlar</option>
          <option value="inceleme">İnceleme gerektirenler</option>
        </select>
        <button className="h-11 rounded-full bg-ink px-6 text-sm font-semibold text-ivory">Filtrele</button>
      </form>

      <p className="mb-3 mt-4 text-sm text-muted">
        {list.length} ürün · sayfa {page}/{pages}
      </p>
      <AdminProductTable rows={rows} totalInFilter={list.length} allCodesInFilter={list.map((p) => p.productCode)} />

      {pages > 1 && (
        <nav className="mt-6 flex items-center gap-4 text-sm" aria-label="Sayfalama">
          {page > 1 && (
            <Link href={href({ sayfa: String(page - 1) })} className="underline">
              ← Önceki
            </Link>
          )}
          <span className="text-muted">
            {page} / {pages}
          </span>
          {page < pages && (
            <Link href={href({ sayfa: String(page + 1) })} className="underline">
              Sonraki →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
