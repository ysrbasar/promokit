"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { bestLiteVariant, type LiteProduct } from "@/lib/catalog/lite";
import { formatMoney } from "@/lib/catalog/pricing";
import { stockPhrase } from "@/lib/catalog/stock";
import { useKit, useHydrated } from "@/lib/kit/store";
import { useCatalogInfo } from "../providers/CatalogContext";
import { useProductVariant } from "./ProductVariantContext";
import { Button, ButtonLink, Icon, cn } from "../ui/primitives";

type LiteVariant = LiteProduct["variants"][number];

export function ProductActions({ product: p }: { product: LiteProduct }) {
  const { minStock } = useCatalogInfo();
  const hydrated = useHydrated();
  const { add, toggleFavorite, setVariant } = useKit();
  const line = useKit((s) => s.draft.lines.find((l) => l.productCode === p.productCode));
  const fav = useKit((s) => s.favorites.includes(p.productCode));
  const ctx = useProductVariant();
  const [localVariant, setLocal] = useState<string | null>(() => bestLiteVariant(p, minStock)?.code ?? p.variants[0]?.code ?? null);
  const variant = ctx ? ctx.variant : localVariant;
  const setV = ctx ? ctx.setVariant : setLocal;
  const [toast, setToast] = useState(false);
  const selected = p.variants.find((v) => v.code === variant) ?? null;
  const inKit = hydrated && !!line;

  // Seçenek boyutları (Renk, Kapasite, Hız…): her biri ayrı açılır menü
  const dims = useMemo(() => {
    const names: string[] = [];
    for (const v of p.variants) for (const o of v.options) if (!names.includes(o.name)) names.push(o.name);
    return names;
  }, [p.variants]);
  const valueOf = (v: LiteVariant, name: string) => v.options.find((o) => o.name === name)?.value ?? null;
  const valuesOf = (name: string) => [...new Set(p.variants.map((v) => valueOf(v, name)).filter((x): x is string => !!x))];
  /** Diğer seçimler korunarak bu değere sahip varyant (yoksa null) */
  const matchFor = (name: string, value: string) =>
    p.variants.find((v) => valueOf(v, name) === value && dims.every((d) => d === name || !selected || valueOf(v, d) === valueOf(selected, d))) ?? null;
  const pick = (code: string) => {
    setV(code);
    if (inKit) setVariant(p.productCode, code);
  };
  const choose = (name: string, value: string) => {
    const exact = matchFor(name, value);
    if (exact) return pick(exact.code);
    // Kombinasyon yoksa: bu değere sahip, diğer seçimlere en çok benzeyen (tercihen stoklu) varyant
    const best = p.variants
      .filter((v) => valueOf(v, name) === value)
      .map((v) => ({ v, s: dims.filter((d) => selected && valueOf(v, d) === valueOf(selected, d)).length + ((v.stockQuantity ?? 0) > 0 ? 0.5 : 0) }))
      .sort((a, b) => b.s - a.s)[0];
    if (best) pick(best.v.code);
  };

  return (
    <div className="space-y-8">
      {p.variants.length > 0 && (
        <fieldset>
          <legend className="eyebrow mb-4">Seçenekler</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {dims.length > 0 ? (
              dims.map((d) => {
                const cur = selected ? valueOf(selected, d) : null;
                return (
                  <label key={d} className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-muted">{d}</span>
                    <select value={cur ?? ""} onChange={(e) => choose(d, e.target.value)} className="h-12 w-full rounded-full border border-line-strong bg-paper px-5 text-sm font-semibold transition-colors hover:border-ink focus:border-ink">
                      {valuesOf(d).map((val) => {
                        const v = matchFor(d, val);
                        const tag = !v ? " · farklı kombinasyon" : (v.stockQuantity ?? 0) === 0 ? " · stokta yok" : "";
                        return (
                          <option key={val} value={val}>
                            {val}
                            {tag}
                          </option>
                        );
                      })}
                    </select>
                  </label>
                );
              })
            ) : (
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold text-muted">Varyant</span>
                <select value={variant ?? ""} onChange={(e) => pick(e.target.value)} className="h-12 w-full rounded-full border border-line-strong bg-paper px-5 text-sm font-semibold">
                  {p.variants.map((v) => (
                    <option key={v.code} value={v.code}>
                      {v.label ?? v.color ?? v.code}
                      {(v.stockQuantity ?? 0) === 0 ? " · stokta yok" : ""}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <p className="mt-3 text-sm text-muted">
            {selected ? (
              <>
                <span className="font-mono text-xs">{selected.code}</span> · {stockPhrase(selected.stockQuantity, minStock)}
                {selected.price !== null && p.priceCurrency && <> · {formatMoney(selected.price, p.priceCurrency)} / adet (KDV hariç)</>}
                {selected.incoming.map((g) => (
                  <span key={g.date} className="mt-1 block text-xs text-gold-deep">
                    {g.date.replace(/-/g, ".")} tarihinde {g.qty.toLocaleString("tr-TR")} adet gelecek
                  </span>
                ))}
              </>
            ) : (
              "Bir seçenek belirleyin. Stokta olmayan seçenekler için tedarik süresi teklifte bildirilir."
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
