"use client";

import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/catalog/pricing";
import { useCart } from "@/lib/cart/store";
import { ButtonLink, Icon, Skeleton } from "../ui/primitives";

type Res = { id: string; status: string; label: string; amount: number; paidTotal: number | null; lines: { name: string; variant: string | null; qty: number }[]; paymentUrl: string | null };

/**
 * Ödeme dönüşü. Tarayıcının bu sayfaya dönmesi ödemenin kanıtı DEĞİLDİR: durum sunucudan (Ödemeix'e sorularak)
 * okunur ve kesinleşene kadar 2,5 sn arayla en çok ~1 dakika yoklanır.
 */
export function PaymentResult() {
  const sp = useSearchParams();
  const id = sp.get("siparis") ?? "";
  const clearCart = useCart((s) => s.clear);
  const [res, setRes] = useState<Res | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const r = await fetch(`/api/checkout/${encodeURIComponent(id)}`, { cache: "no-store" });
        if (!r.ok) throw new Error();
        const d = (await r.json()) as Res;
        setRes(d);
        if (d.status === "paid") clearCart();
        if ((d.status === "processing" || d.status === "awaiting_payment") && ++tries < 24) timer = setTimeout(poll, 2500);
      } catch {
        setErr("Sipariş bulunamadı.");
      }
    };
    poll();
    return () => clearTimeout(timer);
  }, [id, clearCart]);

  if (err) return <p className="rounded-card border border-line bg-paper p-8 text-center">{err}</p>;
  if (!res) return <Skeleton className="h-72" />;

  const paid = res.status === "paid";
  const waiting = res.status === "processing" || res.status === "awaiting_payment";
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-card border border-line bg-paper p-8 text-center shadow-card sm:p-12">
      <span className={`mx-auto grid size-16 place-items-center rounded-full ${paid ? "bg-[#16a34a] text-white" : waiting ? "bg-champagne-light text-gold-deep" : "bg-danger/10 text-danger"}`}>
        {waiting ? <span className="size-6 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Icon name={paid ? "check" : "close"} className="size-8" />}
      </span>
      <h1 className="mt-6 text-4xl">{paid ? "Ödemeniz alındı" : waiting ? "Ödeme kontrol ediliyor…" : res.label}</h1>
      <p className="mt-3 text-muted">
        Sipariş no: <b className="font-mono text-ink">{res.id}</b>
      </p>
      {paid && <p className="mt-2 text-sm text-muted">Dekontunuz e-posta adresinize gönderildi. Siparişiniz hazırlanmaya başladığında sizinle iletişime geçeceğiz.</p>}
      {waiting && <p className="mt-2 text-sm text-muted">Bankanızdan sonuç bekleniyor; bu sayfa kendini güncelliyor.</p>}
      {!paid && !waiting && <p className="mt-2 text-sm text-muted">Kartınızdan para çekilmedi. Sepetiniz duruyor; tekrar deneyebilir ya da sipariş talebi gönderebilirsiniz.</p>}
      <ul className="mx-auto mt-6 max-w-md divide-y divide-line rounded-soft border border-line text-left text-sm">
        {res.lines.map((l, i) => (
          <li key={i} className="flex justify-between gap-3 px-4 py-2">
            <span>
              {l.name}
              {l.variant && <span className="block text-xs text-subtle">{l.variant}</span>}
            </span>
            <span className="shrink-0 text-muted">× {l.qty.toLocaleString("tr-TR")}</span>
          </li>
        ))}
        <li className="flex justify-between px-4 py-2 font-semibold">
          <span>{paid ? "Ödenen" : "Tutar"} (KDV dahil)</span>
          <span>{formatMoney(res.paidTotal ?? res.amount)}</span>
        </li>
      </ul>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        {paid ? (
          <ButtonLink href="/katalog">Alışverişe devam et</ButtonLink>
        ) : res.paymentUrl ? (
          <ButtonLink href={res.paymentUrl}>Ödemeye dön</ButtonLink>
        ) : (
          <ButtonLink href="/sepet">Sepete dön</ButtonLink>
        )}
      </div>
    </motion.div>
  );
}
