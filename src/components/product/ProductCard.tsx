"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { bestLiteVariant, type LiteProduct } from "@/lib/catalog/lite";
import { categoryLabel } from "@/lib/config/taxonomy";
import { useKit, useHydrated } from "@/lib/kit/store";
import { useCatalogInfo } from "../providers/CatalogContext";
import { Icon, cn } from "../ui/primitives";
import { ProductImage } from "./ProductImage";
import { PriceTag, StockBadge } from "./StockAndPrice";

export function ProductCard({ product: p, priority }: { product: LiteProduct; priority?: boolean }) {
  const { minStock } = useCatalogInfo();
  const hydrated = useHydrated();
  const inKit = useKit((s) => s.draft.lines.some((l) => l.productCode === p.productCode));
  const isFav = useKit((s) => s.favorites.includes(p.productCode));
  const add = useKit((s) => s.add);
  const toggleFav = useKit((s) => s.toggleFavorite);
  const [flash, setFlash] = useState(false);

  const onAdd = () => {
    const v = bestLiteVariant(p, minStock);
    if (add({ productCode: p.productCode, variantCode: v?.code ?? null })) {
      setFlash(true);
      setTimeout(() => setFlash(false), 1600);
    }
  };

  return (
    <motion.article
      layout
      className="group relative flex flex-col overflow-hidden rounded-card border border-line bg-paper shadow-card transition-[box-shadow,transform] duration-500 ease-[var(--ease-lux)] hover:-translate-y-1 hover:shadow-lift"
    >
      <Link href={`/urun/${p.slug}`} className="block" aria-label={`${p.name} ürün detayı`}>
        <ProductImage src={p.image} alt={p.name} category={p.category} priority={priority} className="aspect-square" />
      </Link>

      <button
        type="button"
        onClick={() => toggleFav(p.productCode)}
        aria-pressed={hydrated && isFav}
        aria-label={isFav ? "Favorilerden çıkar" : "Favorilere ekle"}
        className={cn(
          "absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-paper/85 backdrop-blur transition-colors",
          hydrated && isFav ? "text-danger" : "text-ink/60 hover:text-ink",
        )}
      >
        <Icon name="heart" className={cn("size-[18px]", hydrated && isFav && "fill-current")} />
      </button>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-2 text-[0.68rem] uppercase tracking-[0.18em] text-subtle">
          <span className="truncate">{categoryLabel(p.category)}</span>
          <span className="font-mono tracking-normal normal-case">{p.productCode}</span>
        </div>
        <Link href={`/urun/${p.slug}`} className="font-display text-[1.35rem] leading-snug text-ink decoration-champagne underline-offset-4 hover:underline">
          {p.name}
        </Link>
        {p.colors.length > 0 && (
          <div className="flex items-center gap-1.5" aria-label={`Renkler: ${p.colors.join(", ")}`}>
            {p.variants.slice(0, 6).map((v) => (
              <span
                key={v.code}
                title={v.color ?? v.code}
                className={cn("size-3.5 rounded-full border border-line-strong", (v.stockQuantity ?? 0) < minStock && "opacity-30")}
                style={{ background: v.colorHex ?? "#d9d0c1" }}
              />
            ))}
            {p.variants.length > 6 && <span className="text-xs text-subtle">+{p.variants.length - 6}</span>}
          </div>
        )}
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div className="space-y-1.5">
            <StockBadge status={p.stockStatus} />
            <PriceTag price={p.price} currency={p.priceCurrency} type={p.priceType} />
          </div>
          <button
            type="button"
            onClick={onAdd}
            disabled={hydrated && inKit}
            className={cn(
              "relative grid size-11 shrink-0 place-items-center rounded-full transition-all duration-300",
              hydrated && inKit ? "bg-champagne-light text-gold-deep" : "bg-ink text-ivory hover:bg-champagne hover:text-ink",
            )}
            aria-label={hydrated && inKit ? "Kitte" : "Kitime ekle"}
            title={hydrated && inKit ? "Bu ürün kitinizde" : "Kitime ekle"}
          >
            <Icon name={hydrated && inKit ? "check" : "plus"} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            role="status"
            className="pointer-events-none absolute inset-x-4 bottom-4 rounded-full bg-ink px-4 py-2.5 text-center text-xs font-semibold text-ivory shadow-lift"
          >
            Kitinize eklendi
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
