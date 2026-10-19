import type { StockStatus } from "@/lib/catalog/schema";
import { STOCK_LABEL } from "@/lib/catalog/stock";
import { formatMoney } from "@/lib/catalog/pricing";
import { cn } from "../ui/primitives";

const DOT: Record<StockStatus, string> = {
  available: "bg-success",
  low: "bg-warning",
  out: "bg-danger",
  unknown: "bg-subtle",
};

export function StockBadge({ status, className }: { status: StockStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-xs text-muted", className)}>
      <span className={cn("size-1.5 rounded-full", DOT[status])} aria-hidden />
      {STOCK_LABEL[status]}
    </span>
  );
}

/** Kaynakta doğrulanmamış fiyat kesin fiyat gibi gösterilmez */
export function PriceTag({
  price,
  currency,
  type,
  className,
}: {
  price: number | null;
  currency: string | null;
  type: "source" | "estimated" | "demo" | null;
  className?: string;
}) {
  if (price === null || type === null || type === "estimated") {
    return <span className={cn("block text-sm text-subtle", className)}>Fiyat teklifle</span>;
  }
  return (
    <span className={cn("block text-sm font-semibold text-ink", className)}>
      {formatMoney(price, currency ?? "TRY")}
      <span className="ml-1 text-[0.68rem] font-normal text-subtle">{type === "demo" ? "örnek fiyat" : "/ adet · KDV hariç"}</span>
    </span>
  );
}
