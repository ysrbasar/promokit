import { OrderActions } from "@/components/admin/OrderActions";
import { formatMoney } from "@/lib/catalog/pricing";
import { isTestMode, paymentsEnabled } from "@/lib/payment/odemeix";
import { ORDER_STATUS_LABEL, listOrders } from "@/lib/server/orders";

const TONE: Record<string, string> = {
  paid: "bg-success/10 text-success",
  refunded: "bg-stone text-muted",
  failed: "bg-danger/10 text-danger",
  expired: "bg-stone text-muted",
  canceled: "bg-stone text-muted",
  processing: "bg-warning/10 text-warning",
  awaiting_payment: "bg-warning/10 text-warning",
};

export default async function AdminOrders() {
  const orders = await listOrders();
  const paid = orders.filter((o) => o.status === "paid");
  return (
    <div>
      <h1 className="text-4xl">Siparişler (kartla ödeme)</h1>
      <p className="mt-2 text-sm text-muted">
        Ödemeix ile sepetten alınan siparişler. Durum, imzalı webhook ve durum sorgusuyla güncellenir. {paymentsEnabled() ? (isTestMode() ? "Şu an TEST anahtarı kullanılıyor." : "CANLI anahtar kullanılıyor.") : "Online ödeme kapalı (.env'de ODEMEIX_SECRET_KEY yok)."}
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Ödenen sipariş", String(paid.length)],
          ["Tahsilat (KDV dahil)", formatMoney(paid.reduce((s, o) => s + (o.paidTotal ?? o.amount), 0))],
          ["Bekleyen", String(orders.filter((o) => o.status === "awaiting_payment" || o.status === "processing").length)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-card border border-line bg-paper p-5">
            <p className="text-xs text-muted">{k}</p>
            <p className="mt-1 font-display text-3xl">{v}</p>
          </div>
        ))}
      </div>
      {orders.length === 0 ? (
        <p className="mt-10 rounded-card border border-dashed border-line-strong p-10 text-center text-muted">Henüz sipariş yok.</p>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((o) => (
            <details key={o.id} className="rounded-card border border-line bg-paper p-5 open:shadow-card">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-6 gap-y-2">
                <span className="font-mono text-xs">{o.id}</span>
                <span className="font-semibold">{o.contact.company}</span>
                <span className="text-sm text-muted">{o.lines.length} ürün</span>
                <span className="font-semibold">{formatMoney(o.paidTotal ?? o.amount)}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[o.status]}`}>{ORDER_STATUS_LABEL[o.status]}</span>
                {o.testMode && <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs text-warning">test</span>}
                <span className="text-xs text-subtle">{new Date(o.createdAt).toLocaleString("tr-TR")}</span>
              </summary>
              <div className="mt-5 grid gap-6 text-sm lg:grid-cols-2">
                <div className="space-y-1">
                  <p>{o.contact.fullName} · <a className="underline" href={`mailto:${o.contact.email}`}>{o.contact.email}</a> · {o.contact.phone}</p>
                  <p className="text-muted">{o.contact.city}{o.contact.notes ? ` · Not: ${o.contact.notes}` : ""}</p>
                  <p className="text-xs text-subtle">Ödeme oturumu: <span className="font-mono">{o.sessionToken ?? "—"}</span></p>
                  <ul className="mt-3 space-y-1 text-xs text-muted">
                    {o.history.map((h, i) => (
                      <li key={i}>
                        {new Date(h.at).toLocaleString("tr-TR")} · {ORDER_STATUS_LABEL[h.status]} · {h.source}
                        {h.note ? ` · ${h.note}` : ""}
                      </li>
                    ))}
                  </ul>
                  <div className="pt-3">
                    <OrderActions id={o.id} canRefund={o.status === "paid"} />
                  </div>
                </div>
                <table className="w-full text-xs [&_td]:px-1.5 [&_th]:px-1.5">
                  <thead className="text-left text-muted">
                    <tr><th className="py-1">Ürün</th><th>Adet</th><th className="text-right">Birim</th><th className="text-right">KDV</th><th className="text-right">Tutar</th></tr>
                  </thead>
                  <tbody>
                    {o.lines.map((l) => (
                      <tr key={l.productCode + (l.variantCode ?? "")} className="border-t border-line">
                        <td className="py-1">{l.name}{l.variantLabel && <span className="block text-subtle">{l.variantLabel}</span>}</td>
                        <td>{l.qty}</td>
                        <td className="text-right">{formatMoney(l.unitPrice)}</td>
                        <td className="text-right">%{l.vatRate}</td>
                        <td className="text-right">{formatMoney(l.gross)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-line font-semibold"><td className="py-1" colSpan={4}>Toplam (KDV dahil)</td><td className="text-right">{formatMoney(o.amount)}</td></tr>
                  </tbody>
                </table>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
