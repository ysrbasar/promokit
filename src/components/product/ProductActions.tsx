"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { bestLiteVariant, type LiteProduct } from "@/lib/catalog/lite";
import { stockPhrase } from "@/lib/catalog/stock";
import { useKit, useHydrated } from "@/lib/kit/store";
import { useCatalogInfo } from "../providers/CatalogContext";
import { Button, ButtonLink, Icon, cn } from "../ui/primitives";

export function ProductActions({ product: p }: { product: LiteProduct }) {
  const { minStock } = useCatalogInfo();
  const hydrated = useHydrated();
  const { add, toggleFavorite, setVariant } = useKit();
  const line = useKit((s) => s.draft.lines.find((l) => l.productCode === p.productCode));
  const fav = useKit((s) => s.favorites.includes(p.productCode));
  const [variant, setV] = useState<string | null>(() => bestLiteVariant(p, minStock)?.code ?? null);
  const [toast, setToast] = useState(false);
  const selected = p.variants.find((v) => v.code === variant) ?? null;
  const inKit = hydrated && !!line;

  return (
    <div className="space-y-8">
      {p.variants.length > 0 && (
        <fieldset>
          <legend className="eyebrow mb-4">Renk / varyant</legend>
          <div className="flex flex-wrap gap-2">
            {p.variants.map((v) => {
              const ok = v.stockQuantity !== null && v.stockQuantity >= minStock;
              const on = variant === v.code;
              return (
                <button
                  key={v.code}
                  type="button"
                  disabled={!ok}
                  aria-pressed={on}
                  onClick={() => {
                    setV(v.code);
                    if (inKit) setVariant(p.productCode, v.code);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-4 text-sm transition-all",
                    on ? "border-ink bg-ink text-ivory" : "border-line-strong hover:border-ink",
                    !ok && "cursor-not-allowed opacity-40 line-through",
                  )}
                  title={ok ? stockPhrase(v.stockQuantity, minStock) : v.stockQuantity === null ? "Stok doğrulanacak" : "Stok yetersiz"}
                >
                  <span className="size-6 rounded-full border border-line-strong" style={{ background: v.colorHex ?? "#d9d0c1" }} />
                  {v.color ?? v.code}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-sm text-muted">
            {selected ? (
              <>
                <span className="font-mono text-xs">{selected.code}</span> · {stockPhrase(selected.stockQuantity, minStock)}
              </>
            ) : (
              "Bu ürünün şu an stok eşiğini karşılayan rengi yok; teklif aşamasında doğrulanabilir."
            )}
          </p>
        </fieldset>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          className="flex-1"
          disabled={inKit}
          onClick={() => {
            if (add({ productCode: p.productCode, variantCode: variant })) {
              setToast(true);
              setTimeout(() => setToast(false), 2200);
            }
          }}
        >
          <Icon name={inKit ? "check" : "plus"} className="size-4" /> {inKit ? "Kitinizde" : "Kitime ekle"}
        </Button>
        <Button size="lg" variant="outline" onClick={() => toggleFavorite(p.productCode)} aria-pressed={hydrated && fav}>
          <Icon name="heart" className={cn("size-4", hydrated && fav && "fill-current text-danger")} /> {hydrated && fav ? "Favorilerde" : "Favorile"}
        </Button>
      </div>
      <ButtonLink href={inKit ? "/teklif" : "/kitim"} variant="ghost" className="-ml-4">
        {inKit ? "Kitimle teklif iste" : "Kitimi görüntüle"} <Icon name="arrow" className="size-4" />
      </ButtonLink>

      <AnimatePresence>
        {toast && (
          <motion.div role="status" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-14 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-ink px-6 py-3 text-sm text-ivory shadow-lift">
            <Icon name="check" className="size-4 text-champagne" /> {p.name} kitinize eklendi
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
