import { formatMoney } from "@/lib/catalog/pricing";
import type { Profit } from "@/lib/quote/profit";

export function ProfitSummary({ title, profits }: { title: string; profits: Profit[] }) {
  return (
    <div className="rounded-card border border-line bg-paper p-5">
      <p className="eyebrow">{title}</p>
      {profits.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Henüz yok.</p>
      ) : (
        profits.map((p) => (
          <dl key={p.currency} className="mt-3 grid grid-cols-3 gap-3 text-sm">
            <div><dt className="text-xs text-muted">Ciro (KDV hariç)</dt><dd className="font-semibold">{formatMoney(p.revenue, p.currency)}</dd></div>
            <div><dt className="text-xs text-muted">Alış</dt><dd>{formatMoney(p.cost, p.currency)}</dd></div>
            <div>
              <dt className="text-xs text-muted">Kâr</dt>
              <dd className={p.profit >= 0 ? "font-semibold text-success" : "font-semibold text-danger"}>
                {formatMoney(p.profit, p.currency)}
                {p.margin !== null && <span className="text-xs font-normal text-muted"> %{Math.round(p.margin * 100)}</span>}
              </dd>
            </div>
          </dl>
        ))
      )}
      {profits.some((p) => !p.complete) && <p className="mt-2 text-xs text-warning">* Bazı satırlarda liste veya alış fiyatı bilinmediği için hesaba katılmadı.</p>}
    </div>
  );
}
