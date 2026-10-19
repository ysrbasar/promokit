"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CATEGORIES } from "@/lib/config/taxonomy";
import { QUOTE_STATUSES, QUOTE_STATUS_LABEL, type QuoteStatus } from "@/lib/quote/schema";
import type { Settings } from "@/lib/config/settings";
import { Button, cn } from "../ui/primitives";

async function call(url: string, method: string, body: unknown) {
  const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? "İşlem başarısız");
  return d;
}

export function ProductControls({ code, isActive, isFeatured, category }: { code: string; isActive: boolean; isFeatured: boolean; category: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const patch = (p: object) =>
    start(async () => {
      try {
        setErr(null);
        await call("/api/admin/products", "PATCH", { productCode: code, ...p });
        router.refresh();
      } catch (e) {
        setErr((e as Error).message);
      }
    });
  return (
    <div className={cn("flex flex-wrap items-center gap-2", pending && "opacity-50")}>
      <label className="flex items-center gap-1.5 text-xs">
        <input type="checkbox" checked={isActive} onChange={(e) => patch({ isActive: e.target.checked })} /> Aktif
      </label>
      <label className="flex items-center gap-1.5 text-xs">
        <input type="checkbox" checked={isFeatured} onChange={(e) => patch({ isFeatured: e.target.checked })} /> Öne çıkan
      </label>
      <select aria-label="Kategori" value={category} onChange={(e) => patch({ category: e.target.value })} className="h-8 rounded border border-line-strong bg-paper px-2 text-xs">
        {CATEGORIES.map((c) => (
          <option key={c.key} value={c.key}>
            {c.label}
          </option>
        ))}
      </select>
      {err && <span className="text-xs text-danger">{err}</span>}
    </div>
  );
}

export function QuoteStatusSelect({ id, status }: { id: string; status: QuoteStatus }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <select
      aria-label="Teklif durumu"
      disabled={pending}
      value={status}
      onChange={(e) =>
        start(async () => {
          await call("/api/admin/quotes", "PATCH", { id, status: e.target.value });
          router.refresh();
        })
      }
      className="h-9 rounded-full border border-line-strong bg-paper px-3 text-sm"
    >
      {QUOTE_STATUSES.map((s) => (
        <option key={s} value={s}>
          {QUOTE_STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}

export function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [s, setS] = useState(settings);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          try {
            await call("/api/admin/settings", "PUT", s);
            setMsg("Kaydedildi.");
            router.refresh();
          } catch (er) {
            setMsg((er as Error).message);
          }
        });
      }}
    >
      <div className="rounded-card border border-line bg-paper p-6">
        <label className="block text-sm font-semibold" htmlFor="minStock">
          Minimum stok eşiği
        </label>
        <p className="mt-1 text-xs text-muted">Bu değerin altındaki varyantlar standart katalogda ve kit önerilerinde gizlenir. Stok 0 ve bilinmeyen stok her zaman hariçtir.</p>
        <input id="minStock" type="number" min={1} value={s.minStock} onChange={(e) => setS({ ...s, minStock: Math.max(1, Number(e.target.value) || 1) })} className="mt-3 h-11 w-40 rounded-soft border border-line-strong bg-ivory px-3" />
        <label className="mt-6 flex items-start gap-3 text-sm">
          <input type="checkbox" checked={s.requireStockForKitQuantity} onChange={(e) => setS({ ...s, requireStockForKitQuantity: e.target.checked })} className="mt-1" />
          <span>
            Önerilerde varyant stoğu kit adedini karşılamalı
            <span className="block text-xs text-muted">Kapalıysa yalnızca minimum eşik uygulanır.</span>
          </span>
        </label>
      </div>
      <div className="rounded-card border border-line bg-paper p-6">
        <p className="text-sm font-semibold">Bütçe aralıkları (kişi başı, TL)</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="py-2">Etiket</th>
                <th>Min</th>
                <th>Maks</th>
                <th>Ürün sayısı</th>
              </tr>
            </thead>
            <tbody>
              {s.budgetTiers.map((b, i) => {
                const upd = (patch: Partial<typeof b>) => setS({ ...s, budgetTiers: s.budgetTiers.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
                const num = (v: string) => (v === "" ? null : Math.max(0, Number(v)));
                return (
                  <tr key={b.key} className="border-t border-line">
                    <td className="py-2 pr-2">
                      <input value={b.label} onChange={(e) => upd({ label: e.target.value })} className="h-9 w-full rounded border border-line-strong bg-ivory px-2" />
                    </td>
                    <td className="pr-2">
                      <input type="number" value={b.min ?? ""} onChange={(e) => upd({ min: num(e.target.value) })} className="h-9 w-24 rounded border border-line-strong bg-ivory px-2" />
                    </td>
                    <td className="pr-2">
                      <input type="number" value={b.max ?? ""} onChange={(e) => upd({ max: num(e.target.value) })} className="h-9 w-24 rounded border border-line-strong bg-ivory px-2" />
                    </td>
                    <td>
                      <input type="number" min={1} max={10} value={b.itemCount} onChange={(e) => upd({ itemCount: Math.min(10, Math.max(1, Number(e.target.value) || 1)) })} className="h-9 w-20 rounded border border-line-strong bg-ivory px-2" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="rounded-card border border-line bg-paper p-6">
        <label className="block text-sm font-semibold" htmlFor="printMarkup">
          Logo baskı kâr payı (%)
        </label>
        <p className="mt-1 text-xs text-muted">
          Baskı fiyatları tedarikçinin güncel baskı fiyat listesinden (ürün grubu, baskı yöntemi ve adede göre) otomatik hesaplanır. Müşteri bu fiyata eklediğiniz kâr payıyla görür; ör. %20 → 1.000 TL baskı müşteriye 1.200 TL.
        </p>
        <input id="printMarkup" type="number" min={0} max={500} value={s.printMarkupPct} onChange={(e) => setS({ ...s, printMarkupPct: Math.min(500, Math.max(0, Number(e.target.value) || 0)) })} className="mt-3 h-11 w-32 rounded-soft border border-line-strong bg-ivory px-3" />
      </div>
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          Kaydet
        </Button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>
    </form>
  );
}
