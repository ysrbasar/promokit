/** Teklif kârlılığı: satır başına liste fiyatı × adet × kit adedi; alış fiyatı bilinmeyen satır kâra katılmaz. */

export type ProfitLine = {
  qty: number;
  listPrice: number | null;
  cost: number | null;
  currency: string | null;
  /** Logo baskısı toplamları (kit adedinden bağımsız, satırın tamamı için) */
  printPrice?: number | null;
  printCost?: number | null;
};
export type Profit = { currency: string; revenue: number; cost: number; profit: number; margin: number | null; complete: boolean };

export function computeProfit(lines: ProfitLine[], kitQuantity: number): Profit[] {
  const by = new Map<string, Profit>();
  for (const l of lines) {
    const cur = l.currency ?? "TRY";
    const p = by.get(cur) ?? { currency: cur, revenue: 0, cost: 0, profit: 0, margin: null, complete: true };
    if (l.listPrice === null || l.cost === null) p.complete = false;
    else {
      p.revenue += l.listPrice * l.qty * kitQuantity;
      p.cost += l.cost * l.qty * kitQuantity;
    }
    if (l.printPrice != null && l.printCost != null) {
      p.revenue += l.printPrice;
      p.cost += l.printCost;
    }
    by.set(cur, p);
  }
  return [...by.values()].map((p) => ({ ...p, profit: p.revenue - p.cost, margin: p.revenue > 0 ? (p.revenue - p.cost) / p.revenue : null }));
}

export function sumProfits(list: Profit[][]): Profit[] {
  const by = new Map<string, Profit>();
  for (const p of list.flat()) {
    const t = by.get(p.currency) ?? { currency: p.currency, revenue: 0, cost: 0, profit: 0, margin: null, complete: true };
    t.revenue += p.revenue;
    t.cost += p.cost;
    t.complete &&= p.complete;
    by.set(p.currency, t);
  }
  return [...by.values()].map((p) => ({ ...p, profit: p.revenue - p.cost, margin: p.revenue > 0 ? (p.revenue - p.cost) / p.revenue : null }));
}
