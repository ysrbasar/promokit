"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { slugify } from "@/lib/catalog/enrich";
import { PURPOSES, STYLES, WIZARD_CATEGORIES } from "@/lib/config/taxonomy";
import type { ReadyKit } from "@/lib/kit/readyKits";
import { Button, Icon } from "../ui/primitives";

const input = "h-9 w-full rounded border border-line-strong bg-ivory px-2 text-sm";

export function KitsEditor({ initial, products, budgetKeys }: { initial: ReadyKit[]; products: { code: string; name: string }[]; budgetKeys: { key: string; label: string }[] }) {
  const router = useRouter();
  const [kits, setKits] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const names = new Map(products.map((p) => [p.code, p.name]));
  const upd = (i: number, patch: Partial<ReadyKit>) => setKits((ks) => ks.map((k, j) => (j === i ? { ...k, ...patch } : k)));

  const save = () =>
    start(async () => {
      setMsg(null);
      const r = await fetch("/api/admin/kits", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kits }) });
      const d = await r.json().catch(() => ({}));
      setMsg(r.ok ? ["Kaydedildi.", ...(d.warnings ?? [])].join(" ") : d.error ?? "Kaydedilemedi");
      if (r.ok) router.refresh();
    });

  return (
    <div className="space-y-6">
      <datalist id="product-codes">
        {products.map((p) => (
          <option key={p.code} value={p.code}>
            {p.name}
          </option>
        ))}
      </datalist>
      {kits.map((k, i) => (
        <details key={i} className="rounded-card border border-line bg-paper p-5" open={i === kits.length - 1 && !k.name}>
          <summary className="flex cursor-pointer list-none items-center gap-4">
            <span className="font-display text-2xl">{k.name || "Yeni kit"}</span>
            <span className="text-xs text-muted">/{k.slug} · {k.items.length} ürün</span>
            {k.isFeatured && <span className="text-xs text-gold-deep">öne çıkan</span>}
          </summary>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {(
              [
                ["name", "Ad"],
                ["tagline", "Kısa slogan"],
                ["audience", "Hedef kitle"],
                ["purpose", "Kullanım amacı"],
                ["recommendedQuantity", "Önerilen kişi sayısı"],
              ] as const
            ).map(([f, l]) => (
              <label key={f} className="text-xs text-muted">
                {l}
                <input className={input} value={k[f]} onChange={(e) => upd(i, f === "name" && !initial.some((x) => x.slug === k.slug) ? { name: e.target.value, slug: slugify(e.target.value) || k.slug } : { [f]: e.target.value })} />
              </label>
            ))}
            <label className="text-xs text-muted">
              Adres (slug)
              <input className={input} value={k.slug} onChange={(e) => upd(i, { slug: slugify(e.target.value) })} />
            </label>
            <label className="text-xs text-muted md:col-span-2">
              Açıklama
              <textarea className={`${input} h-20 py-1`} value={k.description} onChange={(e) => upd(i, { description: e.target.value })} />
            </label>
            <label className="text-xs text-muted md:col-span-2">
              Hikâye
              <textarea className={`${input} h-20 py-1`} value={k.story} onChange={(e) => upd(i, { story: e.target.value })} />
            </label>
            <label className="text-xs text-muted md:col-span-2">
              Kişiselleştirme seçenekleri (virgülle)
              <input className={input} value={k.personalization.join(", ")} onChange={(e) => upd(i, { personalization: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
            </label>
            <div className="flex items-center gap-6 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={k.isFeatured} onChange={(e) => upd(i, { isFeatured: e.target.checked })} /> Öne çıkan
              </label>
              <label className="flex items-center gap-2">
                Ton
                <select className="h-9 rounded border border-line-strong bg-ivory px-2" value={k.tone} onChange={(e) => upd(i, { tone: e.target.value as "light" | "dark" })}>
                  <option value="light">Açık</option>
                  <option value="dark">Koyu</option>
                </select>
              </label>
            </div>
          </div>

          <fieldset className="mt-6 rounded border border-line p-4">
            <legend className="px-2 text-xs font-semibold">Öneri kuralı (katalogda olmayan ürünlerin yerine kullanılır)</legend>
            <div className="grid gap-3 md:grid-cols-3">
              <select aria-label="Amaç" className={input} value={k.rule.purpose ?? ""} onChange={(e) => upd(i, { rule: { ...k.rule, purpose: e.target.value || null } })}>
                <option value="">Amaç —</option>
                {PURPOSES.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
              <select aria-label="Stil" className={input} value={k.rule.style ?? ""} onChange={(e) => upd(i, { rule: { ...k.rule, style: e.target.value || null } })}>
                <option value="">Stil —</option>
                {STYLES.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
              <select aria-label="Bütçe" className={input} value={k.rule.budgetKey ?? ""} onChange={(e) => upd(i, { rule: { ...k.rule, budgetKey: e.target.value || null } })}>
                <option value="">Bütçe —</option>
                {budgetKeys.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {WIZARD_CATEGORIES.map((c) => {
                const on = k.rule.categories?.includes(c.key);
                return (
                  <button key={c.key} type="button" aria-pressed={on} onClick={() => upd(i, { rule: { ...k.rule, categories: on ? k.rule.categories?.filter((x) => x !== c.key) : [...(k.rule.categories ?? []), c.key] } })} className={`rounded-full border px-3 py-1 text-xs ${on ? "border-ink bg-ink text-ivory" : "border-line-strong"}`}>
                    {c.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold">Ürünler</p>
            <div className="space-y-2">
              {k.items.map((it, j) => (
                <div key={j} className="grid grid-cols-[140px_1fr_70px_1fr_36px] items-center gap-2">
                  <input list="product-codes" aria-label="Ürün kodu" className={`${input} font-mono`} value={it.productCode} onChange={(e) => upd(i, { items: k.items.map((x, m) => (m === j ? { ...x, productCode: e.target.value.trim() } : x)) })} />
                  <span className={`truncate text-xs ${names.has(it.productCode) ? "text-muted" : "text-danger"}`}>{names.get(it.productCode) ?? "katalogda yok"}</span>
                  <input type="number" min={1} max={20} aria-label="Adet" className={input} value={it.qty} onChange={(e) => upd(i, { items: k.items.map((x, m) => (m === j ? { ...x, qty: Math.max(1, Math.min(20, Number(e.target.value) || 1)) } : x)) })} />
                  <input aria-label="Rol" placeholder="Kit içindeki rolü" className={input} value={it.role} onChange={(e) => upd(i, { items: k.items.map((x, m) => (m === j ? { ...x, role: e.target.value } : x)) })} />
                  <button type="button" aria-label="Ürünü çıkar" onClick={() => upd(i, { items: k.items.filter((_, m) => m !== j) })} className="grid size-9 place-items-center rounded-full hover:bg-danger/10 hover:text-danger">
                    <Icon name="close" className="size-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => upd(i, { items: [...k.items, { productCode: "", qty: 1, role: "" }] })}>
                <Icon name="plus" className="size-4" /> Ürün ekle
              </Button>
              <Button type="button" size="sm" variant="ghost" className="text-danger" onClick={() => confirm(`"${k.name}" kitini silmek istiyor musunuz?`) && setKits((ks) => ks.filter((_, j) => j !== i))}>
                Kiti sil
              </Button>
            </div>
          </div>
        </details>
      ))}
      <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-card border border-line bg-paper/95 p-4 shadow-lift backdrop-blur">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setKits((ks) => [
              ...ks,
              { slug: `yeni-kit-${ks.length + 1}`, name: "", tagline: "", description: "", story: "", audience: "", purpose: "", recommendedQuantity: "", personalization: [], tone: "light", rule: {}, items: [], isFeatured: false },
            ])
          }
        >
          <Icon name="plus" className="size-4" /> Yeni kit
        </Button>
        <Button type="button" onClick={save} disabled={pending}>
          {pending ? "Kaydediliyor…" : "Tüm kitleri kaydet"}
        </Button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>
    </div>
  );
}
