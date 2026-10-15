"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { bestLiteVariant, type LiteProduct } from "@/lib/catalog/lite";
import { useKit } from "@/lib/kit/store";
import { ProductImage } from "../product/ProductImage";
import { PriceTag, StockBadge } from "../product/StockAndPrice";
import { primeProducts, useCatalogInfo } from "../providers/CatalogContext";
import { Icon, Skeleton } from "../ui/primitives";

/** Kitteki bir ürün için aynı kategoride, stoklu benzer ürünleri gösteren yan panel */
export function AlternativesDrawer({
  productCode,
  onClose,
  exclude,
  kitQuantity,
}: {
  productCode: string | null;
  onClose: () => void;
  exclude: string[];
  kitQuantity: number;
}) {
  const { minStock } = useCatalogInfo();
  const replace = useKit((s) => s.replace);
  const [items, setItems] = useState<LiteProduct[] | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!productCode) return;
    setItems(null);
    const ctrl = new AbortController();
    fetch(`/api/alternatives?code=${encodeURIComponent(productCode)}&quantity=${kitQuantity}&exclude=${encodeURIComponent(exclude.join(","))}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d: { products: LiteProduct[] }) => {
        primeProducts(d.products);
        setItems(d.products);
      })
      .catch(() => setItems([]));
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      ctrl.abort();
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productCode]);

  return (
    <AnimatePresence>
      {productCode && (
        <>
          <motion.div className="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Alternatif ürünler"
            className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-md flex-col bg-ivory shadow-lift"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
          >
            <div className="flex items-center justify-between border-b border-line p-5">
              <div>
                <p className="eyebrow">Alternatifler</p>
                <p className="mt-1 font-display text-2xl">Benzer stoklu ürünler</p>
              </div>
              <button ref={closeRef} type="button" onClick={onClose} className="grid size-10 place-items-center rounded-full hover:bg-stone" aria-label="Kapat">
                <Icon name="close" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {items === null ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <p className="rounded-card border border-dashed border-line-strong p-6 text-center text-sm text-muted">
                  Bu kategoride {kitQuantity.toLocaleString("tr-TR")} kit için yeterli stoğu olan başka ürün bulunamadı. Kit adedini düşürmeyi veya katalogdan farklı bir ürün seçmeyi deneyin.
                </p>
              ) : (
                <ul className="space-y-3">
                  {items.map((p, i) => (
                    <motion.li key={p.productCode} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                      <button
                        type="button"
                        onClick={() => {
                          replace(productCode, { productCode: p.productCode, variantCode: bestLiteVariant(p, minStock, kitQuantity)?.code ?? bestLiteVariant(p, minStock)?.code ?? null });
                          onClose();
                        }}
                        className="group flex w-full gap-4 rounded-card border border-line bg-paper p-3 text-left transition-all hover:border-champagne hover:shadow-gold"
                      >
                        <ProductImage src={p.image} alt={p.name} category={p.category} className="size-20 shrink-0 rounded-soft" sizes="80px" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-mono text-[0.68rem] text-subtle">{p.productCode}</span>
                          <span className="mt-0.5 block font-display text-lg leading-tight">{p.name}</span>
                          <span className="mt-2 flex items-center justify-between gap-2">
                            <StockBadge status={p.stockStatus} />
                            <PriceTag price={p.price} currency={p.priceCurrency} type={p.priceType} className="text-xs" />
                          </span>
                        </span>
                      </button>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
