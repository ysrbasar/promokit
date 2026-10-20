import { NextResponse } from "next/server";
import { odemeixConfig, type OdemeixStatus } from "@/lib/payment/odemeix";
import { isFreshTimestamp, verifyOdemeixSignature } from "@/lib/payment/signature";
import { applyPaymentStatus, getOrder, saveOrder } from "@/lib/server/orders";

export const dynamic = "force-dynamic";

type WebhookEvent = {
  id: number;
  event: string;
  timestamp: number;
  data: { session_token?: string; customer_reference?: string; status?: OdemeixStatus; amount?: number; paid_total?: number | null; fail_reason_label?: string };
};

/**
 * POST /api/odemeix/webhook — Ödemeix durum bildirimi.
 * 1) Ham gövdenin HMAC-SHA256 imzası doğrulanır, 2) 5 dk'dan eski bildirim reddedilir,
 * 3) aynı bildirim (id) ikinci kez işlenmez, 4) sipariş customer_reference ile bulunur, tutar karşılaştırılır.
 * Panel → Ayarlar → Webhook adresi: https://<alan-adınız>/api/odemeix/webhook
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const { webhookSecret } = odemeixConfig();
  if (!verifyOdemeixSignature(raw, req.headers.get("x-odemeix-signature"), webhookSecret)) {
    return new NextResponse("invalid signature", { status: 401 });
  }
  let ev: WebhookEvent;
  try {
    ev = JSON.parse(raw) as WebhookEvent;
  } catch {
    return new NextResponse("bad json", { status: 400 });
  }
  if (!isFreshTimestamp(ev.timestamp)) return new NextResponse("stale", { status: 401 });
  if (ev.event === "webhook.test") return new NextResponse("OK", { status: 200 });

  const ref = ev.data?.customer_reference ?? "";
  const order = await getOrder(ref);
  // Bu siteye ait olmayan (ör. panelden açılmış) ödemeler: tekrar denenmesin diye 200
  if (!order) return new NextResponse("OK (unknown order)", { status: 200 });
  if (order.processedEvents.includes(ev.id)) return new NextResponse("OK (duplicate)", { status: 200 });

  const status = ev.data.status;
  if (status && typeof ev.data.amount === "number" && Math.abs(ev.data.amount - order.amount) >= 0.01) {
    order.history.push({ at: new Date().toISOString(), status: order.status, source: "webhook", note: `Tutar uyuşmuyor: bildirim ${ev.data.amount}, sipariş ${order.amount} — elle kontrol edin` });
  } else if (status) {
    applyPaymentStatus(order, status, "webhook", {
      paidTotal: ev.data.paid_total ?? null,
      token: ev.data.session_token,
      note: ev.event === "payment.failed" ? ev.data.fail_reason_label : undefined,
    });
  }
  order.processedEvents.push(ev.id);
  await saveOrder(order);
  return new NextResponse("OK", { status: 200 });
}
