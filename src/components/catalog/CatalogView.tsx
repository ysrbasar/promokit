import Link from "next/link";
import { Suspense } from "react";
import { toLite } from "@/lib/catalog/lite";
import { facetValues, filterProducts, searchProducts, type SortKey } from "@/lib/catalog/search";
import { getCatalog, getSettings } from "@/lib/server/repositories";
import { getCategoryCounts } from "@/lib/server/views";
import { ProductCard } from "../product/ProductCard";
import { ButtonLink, Skeleton, cn } from "../ui/primitives";
import { CatalogSidebar, CatalogToolbar } from "./CatalogFilters";

export type CatalogSearchParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export async function CatalogView({ searchParams, fixedCategory, basePath }: { searchParams: CatalogSearchParams; fixedCategory?: string; basePath: string }) {
  const [{ products }, settings, countsMap] = await Promise.all([getCatalog(), getSettings(), getCategoryCounts()]);
  const category = fixedCategory ?? one(searchParams.kategori);
  const stockOnly = one(searchParams.stok) !== "tumu";
  const result = searchProducts(
    products,
    {
      q: one(searchParams.q),
      category,
      color: one(searchParams.renk),
      material: one(searchParams.malzeme),
      stockOnly,
      sort: one(searchParams.sirala) as SortKey | undefined,
      page: Number(one(searchParams.sayfa) ?? 1) || 1,
      pageSize: 24,
    },
    settings.minStock,
  );
  const facets = facetValues(filterProducts(products, { category, stockOnly }, settings.minStock));
  const counts = Object.fromEntries(countsMap);
  const props = { facets, fixedCategory, counts };

  const pageHref = (n: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) if (typeof v === "string" && k !== "sayfa") sp.set(k, v);
    if (n > 1) sp.set("sayfa", String(n));
    return `${basePath}${sp.size ? `?${sp}` : ""}`;
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block" aria-label="Filtreler">
        <div className="sticky top-28">
          <Suspense fallback={<Skeleton className="h-96" />}>
            <CatalogSidebar {...props} />
          </Suspense>
        </div>
      </aside>
      <div className="min-w-0">
        <Suspense fallback={<Skeleton className="h-12" />}>
          <CatalogToolbar {...props} />
        </Suspense>
        <p className="mt-6 text-sm text-muted" aria-live="polite">
          {result.total.toLocaleString("tr-TR")} ürün{stockOnly && ` · stok eşiği ${settings.minStock}+ adet`}
        </p>
        {result.items.length === 0 ? (
          <div className="mt-8 rounded-card border border-dashed border-line-strong p-12 text-center">
            <p className="font-display text-3xl">Sonuç bulunamadı</p>
            <p className="mt-3 text-sm text-muted">Arama terimini değiştirin, filtreleri temizleyin veya stok filtresini kapatmayı deneyin.</p>
            <div className="mt-6 flex justify-center gap-3">
              <ButtonLink href={basePath} variant="outline">
                Filtreleri temizle
              </ButtonLink>
              <ButtonLink href="/kit-olustur">Sihirbazla öneri al</ButtonLink>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 xl:grid-cols-3">
            {result.items.map((p, i) => (
              <ProductCard key={p.productCode} product={toLite(p)} priority={i < 3} />
            ))}
          </div>
        )}
        {result.pageCount > 1 && (
          <nav aria-label="Sayfalama" className="mt-12 flex flex-wrap items-center justify-center gap-2">
            {Array.from({ length: result.pageCount }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === result.pageCount || Math.abs(n - result.page) <= 2)
              .map((n, i, arr) => (
                <span key={n} className="flex items-center gap-2">
                  {i > 0 && n - arr[i - 1] > 1 && <span className="text-subtle">…</span>}
                  <Link
                    href={pageHref(n)}
                    aria-current={n === result.page ? "page" : undefined}
                    className={cn("grid size-11 place-items-center rounded-full text-sm transition-colors", n === result.page ? "bg-ink text-ivory" : "border border-line-strong hover:border-ink")}
                  >
                    {n}
                  </Link>
                </span>
              ))}
          </nav>
        )}
      </div>
    </div>
  );
}
