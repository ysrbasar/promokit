"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, useTransition } from "react";
import { CATEGORIES } from "@/lib/config/taxonomy";
import { Icon, cn } from "../ui/primitives";

export type Facets = { colors: { value: string; count: number }[]; materials: { value: string; count: number }[] };
type Props = { facets: Facets; fixedCategory?: string; counts: Record<string, number> };

const SORTS = [
  { k: "relevance", l: "Önerilen" },
  { k: "name", l: "Ada göre" },
  { k: "stock", l: "Stok miktarı" },
  { k: "price-asc", l: "Fiyat (artan)" },
  { k: "price-desc", l: "Fiyat (azalan)" },
];

/** Filtre durumu URL'de tutulur: paylaşılabilir, geri tuşuyla uyumlu, sunucuda işlenir */
function useCatalogParams() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    next.delete("sayfa");
    start(() => router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
  };
  return { sp, update, pending };
}

function FilterGroups({ facets, fixedCategory, counts }: Props) {
  const { sp, update } = useCatalogParams();
  const active = ["renk", "malzeme", "stok"].some((k) => sp.get(k)) || (!fixedCategory && !!sp.get("kategori"));
  return (
    <div className="space-y-8">
      {!fixedCategory && (
        <fieldset>
          <legend className="eyebrow mb-3">Kategori</legend>
          <div className="flex flex-col gap-1">
            {[{ key: "", label: "Tümü" }, ...CATEGORIES].map((c) => {
              if (c.key && !counts[c.key]) return null;
              const on = (sp.get("kategori") ?? "") === c.key;
              return (
                <button key={c.key || "all"} type="button" onClick={() => update({ kategori: c.key || null })} aria-pressed={on} className={cn("flex items-center justify-between rounded-soft px-3 py-2 text-left text-sm transition-colors", on ? "bg-ink text-ivory" : "hover:bg-stone")}>
                  {c.label}
                  {c.key && <span className="text-xs opacity-60">{counts[c.key]}</span>}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
      {facets.colors.length > 0 && (
        <fieldset>
          <legend className="eyebrow mb-3">Renk</legend>
          <div className="flex flex-wrap gap-2">
            {facets.colors.slice(0, 18).map((c) => {
              const on = sp.get("renk") === c.value;
              return (
                <button key={c.value} type="button" aria-pressed={on} onClick={() => update({ renk: on ? null : c.value })} className={cn("rounded-full border px-3 py-1.5 text-xs transition-colors", on ? "border-ink bg-ink text-ivory" : "border-line-strong hover:border-ink")}>
                  {c.value}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
      {facets.materials.length > 0 && (
        <fieldset>
          <legend className="eyebrow mb-3">Malzeme</legend>
          <select value={sp.get("malzeme") ?? ""} onChange={(e) => update({ malzeme: e.target.value || null })} className="h-10 w-full rounded-full border border-line-strong bg-paper px-4 text-sm" aria-label="Malzeme">
            <option value="">Tümü</option>
            {facets.materials.slice(0, 30).map((m) => (
              <option key={m.value} value={m.value}>
                {m.value}
              </option>
            ))}
          </select>
        </fieldset>
      )}
      <fieldset>
        <legend className="eyebrow mb-3">Stok</legend>
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" className="mt-0.5 size-4 accent-[var(--color-ink)]" checked={sp.get("stok") === "var"} onChange={(e) => update({ stok: e.target.checked ? "var" : null })} />
          <span>
            Yalnızca stokta olanlar
            <span className="block text-xs text-muted">Kapalıyken stokta olmayan ürünler de &quot;Stokta yok&quot; etiketiyle listelenir.</span>
          </span>
        </label>
      </fieldset>
      {active && (
        <button type="button" onClick={() => update({ kategori: null, renk: null, malzeme: null, stok: null })} className="text-sm font-semibold underline decoration-champagne underline-offset-4">
          Filtreleri temizle
        </button>
      )}
    </div>
  );
}

/** Masaüstü sol kolon */
export function CatalogSidebar(props: Props) {
  return <FilterGroups {...props} />;
}

/** Arama, sıralama ve mobil filtre paneli */
export function CatalogToolbar(props: Props) {
  const { sp, update, pending } = useCatalogParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if ((sp.get("q") ?? "") === q) return;
    const t = setTimeout(() => update({ q: q.trim() || null }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Ürün adı veya koduyla ara</span>
          <Icon name="search" className="pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ürün adı veya kodu ile arayın…"
            className="h-12 w-full rounded-full border border-line-strong bg-paper pl-12 pr-12 text-sm shadow-card outline-none transition-shadow focus:shadow-gold"
          />
          {pending && <span className="absolute right-5 top-1/2 size-4 -translate-y-1/2 animate-spin rounded-full border-2 border-champagne border-t-transparent" aria-label="Yükleniyor" />}
        </label>
        <div className="flex gap-2">
          <select aria-label="Sıralama" value={sp.get("sirala") ?? "relevance"} onChange={(e) => update({ sirala: e.target.value === "relevance" ? null : e.target.value })} className="h-12 flex-1 rounded-full border border-line-strong bg-paper px-5 text-sm sm:flex-none">
            {SORTS.map((s) => (
              <option key={s.k} value={s.k}>
                {s.l}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => setOpen(true)} className="inline-flex h-12 items-center gap-2 rounded-full border border-line-strong px-5 text-sm font-semibold lg:hidden" aria-expanded={open}>
            <Icon name="filter" className="size-4" /> Filtre
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-[60] bg-ink/40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.div role="dialog" aria-modal="true" aria-label="Filtreler" className="fixed inset-x-0 bottom-0 z-[61] max-h-[85vh] overflow-y-auto rounded-t-[1.5rem] bg-ivory p-6 lg:hidden" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 280, damping: 32 }}>
              <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-line-strong" />
              <FilterGroups {...props} />
              <button type="button" onClick={() => setOpen(false)} className="mt-8 h-12 w-full rounded-full bg-ink text-sm font-semibold text-ivory">
                Sonuçları göster
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
