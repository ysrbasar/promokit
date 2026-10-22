"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CATEGORIES } from "@/lib/config/taxonomy";
import { Button, cn } from "../ui/primitives";

export type AdminRow = {
  code: string;
  name: string;
  slug: string;
  image: string | null;
  category: string;
  isActive: boolean;
  isFeatured: boolean;
  stockLabel: string;
  stockQuantity: number | null;
  price: string;
  /** Alış fiyatı — yalnız yönetim paneli */
  cost: string;
  margin: number | null;
  review: string[];
  /** Tedarikçi verisi: ipromosyon (XML) veya prmstk (site taraması) */
  supplier: "ipromosyon" | "prmstk" | null;
};

const SUPPLIER: Record<string, { label: string; cls: string }> = {
  ipromosyon: { label: "ipromosyon", cls: "bg-sky-100 text-sky-800" },
  prmstk: { label: "prmstk", cls: "bg-amber-100 text-amber-900" },
};

async function patch(body: object) {
  const r = await fetch("/api/admin/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? "İşlem başarısız");
  return d as { count: number };
}

/** Kategori bazlı ürün listesi: tek tıkla veya toplu kaldır / geri al */
export function AdminProductTable({ rows, totalInFilter, allCodesInFilter }: { rows: AdminRow[]; totalInFilter: number; allCodesInFilter: string[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (body: object, done: string) =>
    start(async () => {
      try {
        const r = await patch(body);
        setMsg(`${r.count} ürün ${done}.`);
        setSelected(new Set());
        router.refresh();
      } catch (e) {
        setMsg((e as Error).message);
      }
    });

  const toggle = (code: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(code)) n.delete(code);
      else n.add(code);
      return n;
    });
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.code));
  const sel = [...selected];

  return (
    <div className={cn(pending && "pointer-events-none opacity-60")}>
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-card border border-line bg-paper/95 p-3 backdrop-blur">
        <span className="text-sm text-muted">{sel.length ? `${sel.length} ürün seçili` : "Ürün seçin"}</span>
        <Button size="sm" variant="primary" disabled={!sel.length} onClick={() => run({ productCodes: sel, isActive: false }, "siteden kaldırıldı")}>
          Seçilenleri kaldır
        </Button>
        <Button size="sm" variant="outline" disabled={!sel.length} onClick={() => run({ productCodes: sel, isActive: true }, "geri alındı")}>
          Seçilenleri geri al
        </Button>
        {totalInFilter > rows.length && (
          <button type="button" className="text-xs underline underline-offset-4" onClick={() => setSelected(new Set(allCodesInFilter))}>
            Bu listedeki {totalInFilter} ürünün tümünü seç
          </button>
        )}
        {msg && (
          <span role="status" className="ml-auto text-sm text-ink">
            {msg}
          </span>
        )}
      </div>

      <div className="mt-3 overflow-x-auto rounded-card border border-line bg-paper">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-stone/60 text-left text-xs text-muted">
            <tr>
              <th className="w-10 p-3">
                <input
                  type="checkbox"
                  aria-label="Sayfadakilerin tümünü seç"
                  checked={allOnPage}
                  onChange={() => setSelected((s) => (allOnPage ? new Set([...s].filter((c) => !rows.some((r) => r.code === c))) : new Set([...s, ...rows.map((r) => r.code)])))}
                />
              </th>
              <th className="p-3">Ürün</th>
              <th className="p-3">Kaynak</th>
              <th className="p-3">Stok</th>
              <th className="p-3">Liste / alış</th>
              <th className="p-3">Kategori</th>
              <th className="p-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.code} className={cn("border-t border-line align-middle", !r.isActive && "bg-danger/5 text-muted", selected.has(r.code) && "bg-champagne-light/30")}>
                <td className="p-3">
                  <input type="checkbox" aria-label={`${r.name} seç`} checked={selected.has(r.code)} onChange={() => toggle(r.code)} />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {r.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.image} alt="" loading="lazy" className={cn("size-14 shrink-0 rounded-soft border border-line bg-white object-contain", !r.isActive && "opacity-40 grayscale")} />
                    ) : (
                      <span className="size-14 shrink-0 rounded-soft bg-stone" />
                    )}
                    <div className="min-w-0">
                      <a href={`/urun/${r.slug}`} target="_blank" className="font-medium hover:underline">
                        {r.name}
                      </a>
                      <div className="font-mono text-xs text-subtle">{r.code}</div>
                      {!r.isActive && <div className="text-xs font-semibold text-danger">Sitede gösterilmiyor</div>}
                      {r.review.length > 0 && <div className="text-xs text-warning">{r.review.join(", ")}</div>}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  {r.supplier ? (
                    <span className={cn("inline-block rounded-full px-2.5 py-1 text-xs font-semibold", SUPPLIER[r.supplier].cls)}>{SUPPLIER[r.supplier].label}</span>
                  ) : (
                    <span className="text-xs text-subtle">—</span>
                  )}
                </td>
                <td className="p-3 text-xs">
                  {r.stockLabel}
                  <div className="text-subtle">{r.stockQuantity ?? "—"} adet</div>
                </td>
                <td className="p-3 text-xs">
                  {r.price}
                  <div className="text-subtle">alış {r.cost}</div>
                  {r.margin !== null && <div className={r.margin >= 0 ? "font-semibold text-success" : "font-semibold text-danger"}>kâr %{Math.round(r.margin * 100)}</div>}
                </td>
                <td className="p-3">
                  <select aria-label="Kategori" value={r.category} onChange={(e) => run({ productCode: r.code, category: e.target.value }, "taşındı")} className="h-8 max-w-44 rounded border border-line-strong bg-ivory px-2 text-xs">
                    {CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <label className="mt-1 flex items-center gap-1.5 text-xs">
                    <input type="checkbox" checked={r.isFeatured} onChange={(e) => run({ productCode: r.code, isFeatured: e.target.checked }, "güncellendi")} /> Öne çıkan
                  </label>
                </td>
                <td className="p-3 text-right">
                  {r.isActive ? (
                    <Button size="sm" variant="outline" className="hover:border-danger hover:bg-danger hover:text-ivory" onClick={() => run({ productCode: r.code, isActive: false }, "siteden kaldırıldı")}>
                      Kaldır
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => run({ productCode: r.code, isActive: true }, "geri alındı")}>
                      Geri al
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
