import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { OdemeixError, getPaymentStatus, refundPayment } from "@/lib/payment/odemeix";
import { applyPaymentStatus, getOrder, saveOrder } from "@/lib/server/orders";

/** POST /api/admin/orders/{id}  { action: "refresh" | "refund", amount?: number } */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
  if (!order.sessionToken) return NextResponse.json({ error: "Bu siparişte ödeme oturumu yok" }, { status: 422 });
  const body = (await req.json().catch(() => ({}))) as { action?: string; amount?: number };
  try {
    if (body.action === "refund") {
      if (order.status !== "paid") return NextResponse.json({ error: "Yalnız ödenmiş siparişler iade edilebilir" }, { status: 422 });
      const amount = typeof body.amount === "number" && body.amount > 0 ? Math.round(body.amount * 100) / 100 : undefined;
      const r = await refundPayment(order.sessionToken, `${order.id}-iade-${order.history.length}`, amount);
      order.history.push({ at: new Date().toISOString(), status: order.status, source: "admin", note: r.message ?? "İade istendi" });
    }
    const s = await getPaymentStatus(order.sessionToken);
    applyPaymentStatus(order, s.status, "admin", { paidTotal: s.paid_total });
    await saveOrder(order);
    return NextResponse.json({ ok: true, status: order.status });
  } catch (e) {
    const msg = e instanceof OdemeixError ? e.message : "Ödeme sistemine ulaşılamadı";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
