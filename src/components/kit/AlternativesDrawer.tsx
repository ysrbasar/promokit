"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { bestLiteVariant, type LiteProduct } from "@/lib/catalog/lite";
import { useKit } from "@/lib/kit/store";
import { ProductImage } from "../product/ProductImage";
import { PriceTag, StockBadge } from "../product/StockAndPrice";
import { stockPhrase } from "@/lib/catalog/stock";
import { primeProducts, useCatalogInfo, useProducts } from "../providers/CatalogContext";
import { Icon, Skeleton, cn } from "../ui/primitives";

/** "Değiştir" paneli: önce ürünün kendi seçenekleri (renk, kapasite…), sonra aynı gruptaki benzer ürünler */
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
  const setVariant = useKit((s) => s.setVariant);
  const line = useKit((s) => s.draft.lines.find((l) => l.productCode === productCode));
  const { get } = useProducts(productCode ? [productCode] : []);
  const current = productCode ? get(productCode) : null;
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
                <p className="eyebrow">Değiştir</p>
                <p className="mt-1 font-display text-2xl">{current?.name ?? "Seçenekler ve benzerleri"}</p>
              </div>
              <button ref={closeRef} type="button" onClick={onClose} className="grid size-10 place-items-center rounded-full hover:bg-stone" aria-label="Kapat">
                <Icon name="close" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {current && current.variants.length > 1 && (
                <section className="mb-8">
                  <p className="eyebrow mb-3">Bu ürünün seçenekleri</p>
                  <ul className="grid gap-2">
                    {current.variants.map((v) => {
                      const on = line?.variantCode === v.code;
                      return (
                        <li key={v.code}>
                          <button
                            type="button"
                            onClick={() => productCode && setVariant(productCode, v.code)}
                            aria-pressed={on}
                            className={cn("flex w-full items-center justify-between gap-3 rounded-soft border px-4 py-2.5 text-left text-sm transition-all", on ? "border-ink bg-ink text-ivory" : "border-line bg-paper hover:border-champagne")}
                          >
                            <span className="flex items-center gap-2.5 font-semibold">
                              <span className="size-4 shrink-0 rounded-full border border-line-strong" style={{ background: v.colorHex ?? "#d9d0c1" }} />
                              {v.label ?? v.color ?? v.code}
                            </span>
                            <span className={cn("text-xs", on ? "text-ivory/70" : "text-muted")}>{on ? "Seçili" : stockPhrase(v.stockQuantity, minStock)}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
              <p className="eyebrow mb-3">Benzer ürünler</p>
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
