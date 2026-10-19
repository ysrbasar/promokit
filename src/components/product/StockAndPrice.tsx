import type { StockStatus } from "@/lib/catalog/schema";
import { STOCK_LABEL } from "@/lib/catalog/stock";
import { formatMoney } from "@/lib/catalog/pricing";
import { cn } from "../ui/primitives";

/** Rozet: zemin rengi durumu, yanıp sönen lamba dikkat çeker ("Stokta": yeşil zemin, kırmızı ışık) */
const PILL: Record<StockStatus, { box: string; lamp: string }> = {
  available: { box: "bg-[#16a34a] text-white shadow-[0_6px_16px_-6px_rgb(22_163_74/0.7)]", lamp: "text-[#ff3b30]" },
  low: { box: "bg-[#f59e0b] text-white", lamp: "text-white" },
  out: { box: "bg-danger/10 text-danger ring-1 ring-danger/30", lamp: "text-danger" },
  unknown: { box: "bg-stone text-muted", lamp: "text-subtle" },
};

export function StockBadge({ status, className }: { status: StockStatus; className?: string }) {
  const s = PILL[status];
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold", s.box, className)}>
      <span className={cn("stock-lamp", s.lamp, status === "available" && "ring-2 ring-white/70")} aria-hidden />
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
