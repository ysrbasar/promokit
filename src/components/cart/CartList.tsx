"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { formatMoney } from "@/lib/catalog/pricing";
import { useCart } from "@/lib/cart/store";
import { useHydrated } from "@/lib/kit/store";
import { ProductImage } from "../product/ProductImage";
import { useProducts } from "../providers/CatalogContext";
import { ButtonLink, Icon, Skeleton } from "../ui/primitives";

/** Sepetteki tekli ürünler: varyant, adet, liste fiyatı (KDV hariç) ve ara toplam */
export function CartList() {
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const { setQty, setVariant, remove } = useCart();
  const { get } = useProducts(items.map((i) => i.productCode));

  if (!hydrated) return <Skeleton className="h-60" />;
  if (items.length === 0)
    return (
      <div className="rounded-card border border-dashed border-line-strong p-12 text-center">
        <Icon name="box" className="mx-auto size-8 text-champagne" />
        <p className="mt-3 font-display text-3xl">Sepetiniz boş</p>
        <p className="mt-2 text-sm text-muted">Ürün sayfalarındaki &quot;Sepete ekle&quot; düğmesiyle tekli sipariş için ürün ekleyebilirsiniz.</p>
        <ButtonLink href="/katalog" className="mt-6">
          Kataloğa git
        </ButtonLink>
      </div>
    );

  let total = 0;
  let gross = 0;
  let currency: string | null = null;
  let unknown = 0;

  return (
    <div className="space-y-3">
      <ul className="space-y-3" aria-label="Sepetteki ürünler">
        <AnimatePresence initial={false}>
          {items.map((it) => {
            const p = get(it.productCode);
            const v = p?.variants.find((x) => x.code === it.variantCode) ?? null;
            const unit = p && !p.isDemo ? (v?.price ?? p.price) : null;
            if (unit !== null && p?.priceCurrency && (!currency || currency === p.priceCurrency)) {
              currency = p.priceCurrency;
              total += unit * it.qty;
              gross += unit * it.qty * (1 + (p.vatRate ?? 20) / 100);
            } else unknown++;
            const belowMoq = p?.minOrderQty != null && it.qty < p.minOrderQty;
            return (
              <motion.li key={it.productCode} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30 }} className="flex gap-4 rounded-card border border-line bg-paper p-3 shadow-card">
                {p ? (
                  <Link href={`/urun/${p.slug}`} className="shrink-0">
                    <ProductImage src={v?.image ?? p.image} alt={p.name} category={p.category} className="size-24 rounded-soft" sizes="96px" />
                  </Link>
                ) : (
                  <Skeleton className="size-24 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={p ? `/urun/${p.slug}` : "#"} className="line-clamp-2 font-display text-lg leading-tight hover:underline">
                      {p?.name ?? "Yükleniyor…"}
                    </Link>
                    <button type="button" onClick={() => remove(it.productCode)} className="grid size-8 shrink-0 place-items-center rounded-full text-subtle hover:bg-danger/10 hover:text-danger" aria-label="Sepetten çıkar">
                      <Icon name="close" className="size-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {p && p.variants.length > 1 && (
                      <select aria-label="Seçenek" value={it.variantCode ?? ""} onChange={(e) => setVariant(it.productCode, e.target.value || null)} className="h-9 max-w-[14rem] rounded-full border border-line-strong bg-ivory px-3 text-xs font-semibold">
                        {p.variants.map((x) => (
                          <option key={x.code} value={x.code}>
                            {x.label ?? x.color ?? x.code}
                            {(x.stockQuantity ?? 0) === 0 ? " — stokta yok" : ""}
                          </option>
                        ))}
                      </select>
                    )}
                    <label className="flex items-center gap-2 text-xs">
                      <span className="text-muted">Adet</span>
                      <input type="number" min={1} inputMode="numeric" value={it.qty} onChange={(e) => setQty(it.productCode, Number(e.target.value))} className="h-9 w-24 rounded-full border border-line-strong bg-ivory px-3 text-right font-semibold" />
                    </label>
                    <span className="ml-auto text-right text-sm">
                      {unit !== null && p?.priceCurrency ? (
                        <>
                          <b>{formatMoney(unit * it.qty, p.priceCurrency)}</b>
                          <span className="block text-[0.7rem] text-subtle">{formatMoney(unit, p.priceCurrency)} / adet</span>
                        </>
                      ) : (
                        <span className="text-xs text-muted">Fiyat teklifte</span>
                      )}
                    </span>
                  </div>
                  {belowMoq && <p className="mt-2 text-xs text-warning">Bu ürünün minimum sipariş adedi {p?.minOrderQty?.toLocaleString("tr-TR")}.</p>}
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      <div className="flex items-end justify-between rounded-card bg-ink p-5 text-ivory">
        <div className="text-sm text-ivory/60">
          {items.length} ürün
          {unknown > 0 && <span className="block text-xs">{unknown} ürünün fiyatı teklifte bildirilecek</span>}
        </div>
        <div className="text-right">
          <p className="text-xs text-ivory/50">Ara toplam (KDV hariç)</p>
          <p className="font-display text-3xl text-champagne">{formatMoney(total, currency ?? "TRY")}</p>
          {unknown === 0 && <p className="mt-1 text-xs text-ivory/70">KDV dahil ödenecek: <b className="text-ivory">{formatMoney(Math.round(gross * 100) / 100, currency ?? "TRY")}</b></p>}
        </div>
      </div>
    </div>
  );
}
