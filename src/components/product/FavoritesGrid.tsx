"use client";

import { useKit, useHydrated } from "@/lib/kit/store";
import { useProducts } from "../providers/CatalogContext";
import { ButtonLink, Skeleton } from "../ui/primitives";
import { ProductCard } from "./ProductCard";

export function FavoritesGrid() {
  const hydrated = useHydrated();
  const favorites = useKit((s) => s.favorites);
  const { get, loading } = useProducts(hydrated ? favorites : []);
  if (!hydrated) return <Skeleton className="h-96" />;
  if (favorites.length === 0)
    return (
      <div className="rounded-card border border-dashed border-line-strong p-12 text-center">
        <p className="font-display text-3xl">Henüz favoriniz yok</p>
        <p className="mt-2 text-sm text-muted">Ürün kartlarındaki kalp simgesiyle favorilerinizi burada toplayın.</p>
        <ButtonLink href="/katalog" className="mt-6">
          Kataloğa git
        </ButtonLink>
      </div>
    );
  const items = favorites.map((c) => get(c)).filter((p) => !!p);
  const missing = favorites.filter((c) => get(c) === null);
  return (
    <>
      <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.productCode} product={p} />
        ))}
        {loading && [0, 1].map((i) => <Skeleton key={i} className="aspect-[4/6]" />)}
      </div>
      {missing.length > 0 && <p className="mt-6 text-sm text-muted">{missing.length} favori ürün artık katalogda bulunmuyor.</p>}
    </>
  );
}
