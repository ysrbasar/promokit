"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { LiteProduct } from "@/lib/catalog/lite";
import { formatMoney, priceKit } from "@/lib/catalog/pricing";
import { PERSONALIZATION, categoryLabel } from "@/lib/config/taxonomy";
import { MAX_QTY_PER_KIT, totalPieces } from "@/lib/kit/kitState";
import { useKit, useHydrated } from "@/lib/kit/store";
import { ProductImage } from "../product/ProductImage";
import { useCatalogInfo, useProducts } from "../providers/CatalogContext";
import { AnimatedNumber } from "../ui/motion";
import { Badge, Button, ButtonLink, Icon, Skeleton, cn } from "../ui/primitives";
import { AlternativesDrawer } from "./AlternativesDrawer";

/**
 * Kit özeti / çalışma alanı. `compact` modunda sihirbazın yan panelinde, normal modda
 * "Kitim" sayfasında kullanılır. Tüm değişiklikler global mağazaya yazılır.
 */
export function KitWorkspace({ compact = false, showActions = true }: { compact?: boolean; showActions?: boolean }) {
  const hydrated = useHydrated();
  const { minStock } = useCatalogInfo();
  const draft = useKit((s) => s.draft);
  const { setQty, remove, setVariant, setKitQuantity, rename, saveCurrent, setPersonalization } = useKit();
  const codes = draft.lines.map((l) => l.productCode);
  const { get } = useProducts(codes);
  const [swapFor, setSwapFor] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const priceMap = new Map<string, LiteProduct>();
  for (const c of codes) {
    const p = get(c);
    if (p) priceMap.set(c, p);
  }
  const pricing = priceKit(draft.lines.map((l) => ({ productCode: l.productCode, qtyPerKit: l.qty })), priceMap, draft.kitQuantity);

  if (!hydrated) return <Skeleton className="h-80 w-full" />;

  const empty = draft.lines.length === 0;

  return (
    <div className={cn("flex flex-col", compact ? "gap-4" : "gap-8")}>
      <div className={cn("flex flex-col gap-4", !compact && "sm:flex-row sm:items-end sm:justify-between")}>
        <div className="min-w-0">
          <p className="eyebrow mb-2">Kit özeti</p>
          <input
            aria-label="Kit adı"
            value={draft.name}
            onChange={(e) => rename(e.target.value)}
            className={cn("w-full bg-transparent font-display outline-none placeholder:text-subtle", compact ? "text-2xl" : "text-4xl")}
          />
        </div>
        <label className="flex items-center gap-3 text-sm">
          <span className="text-muted">Kit adedi</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={100000}
            value={draft.kitQuantity}
            onChange={(e) => setKitQuantity(Number(e.target.value))}
            className="h-10 w-24 rounded-full border border-line-strong bg-paper px-4 text-right font-semibold"
          />
        </label>
      </div>

      {empty ? (
        <div className="rounded-card border border-dashed border-line-strong p-8 text-center">
          <Icon name="box" className="mx-auto size-8 text-champagne" />
          <p className="mt-3 font-display text-2xl">Kitiniz henüz boş</p>
          <p className="mt-2 text-sm text-muted">Sorularla öneri alın ya da katalogdan ürün ekleyin.</p>
          {!compact && (
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/kit-olustur">Sorularla oluştur</ButtonLink>
              <ButtonLink href="/katalog" variant="outline">
                Katalogdan seç
              </ButtonLink>
            </div>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-3" aria-label="Kitteki ürünler">
          <AnimatePresence initial={false}>
            {draft.lines.map((line) => {
              const p = get(line.productCode);
              const v = p?.variants.find((x) => x.code === line.variantCode) ?? null;
              const need = draft.kitQuantity * line.qty;
              const short = v && v.stockQuantity !== null && v.stockQuantity < need;
              return (
                <motion.li
                  key={line.productCode}
                  layout
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -30, transition: { duration: 0.3 } }}
                  className="group rounded-card border border-line bg-paper p-3 shadow-card"
                >
                  <div className="flex gap-3">
                    {p ? (
                      <Link href={`/urun/${p.slug}`} className="shrink-0">
                        <ProductImage src={p.image} alt={p.name} category={p.category} className="size-20 rounded-soft" sizes="80px" />
                      </Link>
                    ) : (
                      <Skeleton className="size-20 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[0.68rem] uppercase tracking-[0.16em] text-subtle">
                            {p ? categoryLabel(p.category) : "…"} · <span className="font-mono normal-case tracking-normal">{line.productCode}</span>
                          </p>
                          <p className="mt-0.5 line-clamp-2 font-display text-lg leading-tight">{p?.name ?? "Yükleniyor…"}</p>
                        </div>
                        <button type="button" onClick={() => remove(line.productCode)} className="grid size-8 shrink-0 place-items-center rounded-full text-subtle hover:bg-danger/10 hover:text-danger" aria-label={`${p?.name ?? line.productCode} ürününü kitten çıkar`}>
                          <Icon name="close" className="size-4" />
                        </button>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {p && p.variants.length > 0 && (
                          <select
                            aria-label="Renk / varyant"
                            value={line.variantCode ?? ""}
                            onChange={(e) => setVariant(line.productCode, e.target.value || null)}
                            className="h-8 max-w-[11rem] rounded-full border border-line-strong bg-ivory px-3 text-xs"
                          >
                            {!line.variantCode && <option value="">Renk seçin</option>}
                            {p.variants.map((x) => {
                              const ok = x.stockQuantity !== null && x.stockQuantity >= minStock;
                              return (
                                <option key={x.code} value={x.code} disabled={!ok}>
                                  {x.color ?? x.code}
                                  {!ok ? (x.stockQuantity === null ? " — doğrulanacak" : " — stok yetersiz") : ""}
                                </option>
                              );
                            })}
                          </select>
                        )}
                        <div className="flex h-8 items-center rounded-full border border-line-strong" role="group" aria-label="Kit başına adet">
                          <button type="button" className="grid size-8 place-items-center" onClick={() => setQty(line.productCode, line.qty - 1)} aria-label="Azalt">
                            <Icon name="minus" className="size-3.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-semibold" aria-live="polite">
                            {line.qty}
                          </span>
                          <button type="button" className="grid size-8 place-items-center disabled:opacity-30" disabled={line.qty >= MAX_QTY_PER_KIT} onClick={() => setQty(line.productCode, line.qty + 1)} aria-label="Artır">
                            <Icon name="plus" className="size-3.5" />
                          </button>
                        </div>
                        <button type="button" onClick={() => setSwapFor(line.productCode)} className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-gold-deep hover:bg-champagne-light/50">
                          <Icon name="swap" className="size-3.5" /> Değiştir
                        </button>
                      </div>
                      {short && (
                        <p className="mt-2 text-xs text-warning">
                          Bu renkte {need.toLocaleString("tr-TR")} adet için stok yetersiz görünüyor; başka renk seçin veya teklif aşamasında doğrulayalım.
                        </p>
                      )}
                      {!compact && (
                        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Kişiselleştirme">
                          {PERSONALIZATION.filter((o) => o.key !== "later").map((o) => {
                            const on = line.personalization.includes(o.key);
                            return (
                              <button
                                key={o.key}
                                type="button"
                                aria-pressed={on}
                                onClick={() => setPersonalization(line.productCode, on ? line.personalization.filter((x) => x !== o.key) : [...line.personalization, o.key])}
                                className={cn("rounded-full border px-2.5 py-1 text-[0.68rem] transition-colors", on ? "border-champagne bg-champagne-light/60 text-ink" : "border-line text-muted hover:border-line-strong")}
                              >
                                {o.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      {!empty && (
        <div className={cn("rounded-card bg-ink p-5 text-ivory", !compact && "p-7")}>
          <div className="flex items-baseline justify-between text-sm text-ivory/60">
            <span>
              {draft.lines.length} ürün · {totalPieces(draft)} parça / kit
            </span>
            <span>{draft.kitQuantity.toLocaleString("tr-TR")} kit</span>
          </div>
          <div className="mt-4 flex items-end justify-between gap-4">
            {pricing.status === "complete" ? (
              <>
                <div>
                  <p className="text-xs text-ivory/50">Kişi başı tahmini</p>
                  <p className="font-display text-3xl text-champagne">
                    <AnimatedNumber value={pricing.perKit} format={(n) => formatMoney(n, pricing.currency)} />
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ivory/50">Toplam tahmini</p>
                  <p className="font-display text-2xl">
                    <AnimatedNumber value={pricing.total} format={(n) => formatMoney(n, pricing.currency)} />
                  </p>
                </div>
              </>
            ) : (
              <div>
                <p className="font-display text-2xl text-champagne">Fiyat teklifle belirlenir</p>
                <p className="mt-1 text-xs text-ivory/50">
                  {pricing.missing.length} ürünün fiyatı kaynakta doğrulanmadığı için toplam hesaplanmadı.
                </p>
              </div>
            )}
          </div>
          {pricing.status === "complete" && (
            <p className="mt-3 text-[0.7rem] leading-relaxed text-ivory/40">
              {pricing.priceType === "demo" ? "Örnek fiyatlarla hesaplanmıştır." : "Baskı ve ambalaj hariç, kaynaktaki ürün birim fiyatlarından hesaplanmıştır."} Kesin tutar teklifte bildirilir.
            </p>
          )}
          {showActions && (
            <div className={cn("mt-5 flex gap-2", compact ? "flex-col" : "flex-col sm:flex-row")}>
              <ButtonLink href="/teklif" variant="gold" className="flex-1">
                Teklif iste <Icon name="arrow" className="size-4" />
              </ButtonLink>
              <Button
                variant="light"
                className="flex-1"
                onClick={() => {
                  saveCurrent();
                  setSaved(true);
                  setTimeout(() => setSaved(false), 2000);
                }}
              >
                <Icon name={saved ? "check" : "save"} className="size-4" /> {saved ? "Kaydedildi" : "Kiti kaydet"}
              </Button>
            </div>
          )}
          <p className="mt-3 text-[0.68rem] text-ivory/35">Kitler yalnızca bu tarayıcıda saklanır.</p>
        </div>
      )}

      {draft.answers && !compact && <Badge tone="gold">Sihirbaz önerisinden oluşturuldu</Badge>}

      <AlternativesDrawer
        productCode={swapFor}
        onClose={() => setSwapFor(null)}
        exclude={codes}
        kitQuantity={draft.kitQuantity}
      />
    </div>
  );
}
