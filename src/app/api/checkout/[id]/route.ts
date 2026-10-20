import { NextResponse } from "next/server";
import { getByReference, getPaymentStatus, paymentsEnabled } from "@/lib/payment/odemeix";
import { ORDER_STATUS_LABEL, applyPaymentStatus, getOrder, saveOrder } from "@/lib/server/orders";

export const dynamic = "force-dynamic";

/**
 * GET /api/checkout/{siparişNo} — dönüş sayfası için durum. Ödeme henüz kesinleşmediyse Ödemeix'e sorulur
 * (webhook gelmese de, ör. yerel kurulumda, sipariş doğru güncellenir). Kişisel veri dönmez.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });

  if (paymentsEnabled() && order.sessionToken && ["awaiting_payment", "processing", "failed", "expired"].includes(order.status)) {
    try {
      const s = await getPaymentStatus(order.sessionToken);
      let changed = applyPaymentStatus(order, s.status, "status", { paidTotal: s.paid_total });
      // Müşteri ödeme sayfasında "Tekrar dene" dediyse yeni oturum açılmıştır: sipariş no ile en son oturuma bak
      if (s.status === "failed" || s.status === "expired") {
        const r = await getByReference(order.id).catch(() => null);
        const latest = r?.latest;
        if (latest && latest.token !== order.sessionToken && Math.abs(latest.amount - order.amount) < 0.01) {
          changed = applyPaymentStatus(order, latest.status, "status", { token: latest.token, paidTotal: latest.paid_total ?? null }) || changed;
        }
      }
      if (changed) await saveOrder(order);
    } catch (e) {
      console.error("[odemeix] durum sorgusu", order.id, e);
    }
  }
  return NextResponse.json({
    id: order.id,
    status: order.status,
    label: ORDER_STATUS_LABEL[order.status],
    amount: order.amount,
    paidTotal: order.paidTotal,
    lines: order.lines.map((l) => ({ name: l.name, variant: l.variantLabel, qty: l.qty })),
    paymentUrl: order.status === "awaiting_payment" ? order.paymentUrl : null,
  });
}
