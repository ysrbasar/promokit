import { QuoteStatusSelect } from "@/components/admin/AdminWidgets";
import { ProfitSummary } from "@/components/admin/ProfitSummary";
import { formatMoney } from "@/lib/catalog/pricing";
import type { StockStatus } from "@/lib/catalog/schema";
import { STOCK_LABEL } from "@/lib/catalog/stock";
import { sumProfits } from "@/lib/quote/profit";
import { listQuotesWithProfit } from "@/lib/server/quotes";

export default async function AdminQuotes() {
  const rows = await listQuotesWithProfit();
  const quotes = rows.map((r) => r.quote);
  const won = sumProfits(rows.filter((r) => r.quote.status === "won").map((r) => r.profit));
  const open = sumProfits(rows.filter((r) => r.quote.status !== "won" && r.quote.status !== "lost").map((r) => r.profit));
  return (
    <div>
      <h1 className="text-4xl">Teklif talepleri</h1>
      <p className="mt-2 text-sm text-muted">E-posta/CRM bildirimi yapılandırılmadı; yeni talepleri buradan takip edin. Kâr hesabı liste fiyatı (KDV hariç) ile alış fiyatı arasındaki farktır; baskı ve ambalaj dahil değildir.</p>
      {quotes.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <ProfitSummary title="Kazanılan teklifler" profits={won} />
          <ProfitSummary title="Açık teklifler (potansiyel)" profits={open} />
        </div>
      )}
      {quotes.length === 0 ? (
        <p className="mt-10 rounded-card border border-dashed border-line-strong p-10 text-center text-muted">Henüz teklif talebi yok.</p>
      ) : (
        <div className="mt-8 space-y-4">
          {rows.map(({ quote: q, lines, profit, estimated }) => (
            <details key={q.id} className="group rounded-card border border-line bg-paper p-5 open:shadow-card">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-6 gap-y-2">
                <span className="font-mono text-xs">{q.id}</span>
                <span className="font-semibold">{q.contact.company}</span>
                <span className="text-sm text-muted">{q.kit.name} · {q.kit.lines.length} ürün · {q.kit.kitQuantity} kit</span>
                <span className="text-xs text-subtle">{new Date(q.createdAt).toLocaleString("tr-TR")}</span>
                {q.catalogKind === "demo" && <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs text-warning">örnek katalogla</span>}
                {profit.map((p) => (
                  <span key={p.currency} className="text-sm">
                    <span className="text-muted">Ciro</span> {formatMoney(p.revenue, p.currency)} · <span className="text-muted">Kâr</span>{" "}
                    <span className={p.profit >= 0 ? "font-semibold text-success" : "font-semibold text-danger"}>{formatMoney(p.profit, p.currency)}</span>
                    {p.margin !== null && <span className="text-xs text-muted"> (%{Math.round(p.margin * 100)})</span>}
                    {(!p.complete || estimated) && <span className="ml-1 text-xs text-warning" title={estimated ? "Eski kayıt: güncel fiyatlarla tahmin" : "Bazı satırlarda fiyat/alış bilinmiyor"}>*</span>}
                  </span>
                ))}
                <span className="ml-auto"><QuoteStatusSelect id={q.id} status={q.status} /></span>
              </summary>
              <div className="mt-6 grid gap-6 text-sm lg:grid-cols-2">
                <dl className="space-y-1">
                  <div><dt className="inline text-muted">Ad soyad: </dt><dd className="inline">{q.contact.fullName}</dd></div>
                  <div><dt className="inline text-muted">E-posta: </dt><dd className="inline"><a href={`mailto:${q.contact.email}`} className="underline">{q.contact.email}</a></dd></div>
                  <div><dt className="inline text-muted">Telefon: </dt><dd className="inline">{q.contact.phone}</dd></div>
                  <div><dt className="inline text-muted">Şehir: </dt><dd className="inline">{q.contact.city}</dd></div>
                  <div><dt className="inline text-muted">Teslim tarihi: </dt><dd className="inline">{q.contact.deliveryDate ?? "—"}</dd></div>
                  <div><dt className="inline text-muted">Pazarlama izni: </dt><dd className="inline">{q.contact.marketingConsent ? "Evet" : "Hayır"}</dd></div>
                  {q.contact.notes && <div className="pt-2"><dt className="text-muted">Not</dt><dd className="whitespace-pre-wrap">{q.contact.notes}</dd></div>}
                  {q.attachment && (
                    <div className="pt-2"><dt className="inline text-muted">Dosya: </dt><dd className="inline"><a className="underline" href={`/api/admin/uploads/${q.attachment.storedAs}`}>{q.attachment.fileName}</a> ({Math.round(q.attachment.size / 1024)} KB)</dd></div>
                  )}
                </dl>
                <table className="w-full text-xs [&_td]:px-1.5 [&_th]:px-1.5">
                  <thead className="text-left text-muted"><tr><th className="py-1">Kod</th><th>Ürün</th><th>Renk</th><th>Adet/kit</th><th>Stok</th><th className="text-right">Liste</th><th className="text-right">Alış</th><th className="text-right">Kâr/kit</th></tr></thead>
                  <tbody>
                    {q.snapshot.map((s, i) => {
                      const l = lines[i];
                      const cur = l.currency ?? "TRY";
                      return (
                        <tr key={s.productCode} className="border-t border-line">
                          <td className="py-1 font-mono">{s.variantCode ?? s.productCode}</td><td>{s.name}</td><td>{s.color ?? "—"}</td><td>{s.qty}</td><td>{STOCK_LABEL[s.stockStatus as StockStatus] ?? s.stockStatus}</td>
                          <td className="text-right">{l.listPrice !== null ? formatMoney(l.listPrice, cur) : "—"}</td>
                          <td className="text-right">{l.cost !== null ? formatMoney(l.cost, cur) : "—"}</td>
                          <td className="text-right">{l.listPrice !== null && l.cost !== null ? formatMoney((l.listPrice - l.cost) * l.qty, cur) : "—"}</td>
                        </tr>
                      );
                    })}
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
