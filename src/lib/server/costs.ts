import "server-only";
import type { CostTable } from "../import/ipromosyon";
import { COSTS_FILE } from "../import/sync";
import { mtime, readJson } from "./jsonStore";

/**
 * Alış fiyatları (data/private/costs.json). YALNIZCA yönetim paneli ve teklif kaydında kullanılır;
 * hiçbir genel API'ye veya istemci bileşenine aktarılmamalıdır.
 */
let cache: { key: number; costs: CostTable } | null = null;

export async function getCosts(): Promise<CostTable> {
  const key = await mtime(COSTS_FILE);
  if (cache?.key === key) return cache.costs;
  cache = { key, costs: (await readJson<{ products: CostTable }>(COSTS_FILE))?.products ?? {} };
  return cache.costs;
}

export function unitCost(costs: CostTable, productCode: string, variantCode?: string | null): number | null {
  const c = costs[productCode];
  if (!c) return null;
  return (variantCode ? c.variants[variantCode] : null) ?? c.cost;
}
