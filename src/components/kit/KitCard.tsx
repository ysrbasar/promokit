import Link from "next/link";
import { formatMoney } from "@/lib/catalog/pricing";
import type { KitView } from "@/lib/server/views";
import { ProductImage } from "../product/ProductImage";
import { Badge, Icon, cn } from "../ui/primitives";

export function KitPriceLine({ pricing, className }: { pricing: KitView["pricing"]; className?: string }) {
  if (pricing.status === "complete") {
    return (
      <span className={className}>
        Kişi başı ~{formatMoney(pricing.perKit, pricing.currency)}
        {pricing.priceType === "demo" && <span className="ml-1 text-[0.7em] opacity-70">(örnek fiyat)</span>}
      </span>
    );
  }
  return <span className={className}>Fiyat teklifle belirlenir</span>;
}

export function KitCard({ view, size = "md" }: { view: KitView; size?: "md" | "lg" }) {
  const dark = view.kit.tone === "dark";
  const imgs = view.lines.slice(0, 4);
  return (
    <Link
      href={`/hazir-kitler/${view.kit.slug}`}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-card border transition-[transform,box-shadow] duration-700 ease-[var(--ease-lux)] hover:-translate-y-1.5 hover:shadow-lift",
        dark ? "dark-surface border-ivory/10 bg-ink text-ivory" : "border-line bg-paper text-ink shadow-card",
      )}
    >
      <div className={cn("relative grid grid-cols-2 gap-px", dark ? "bg-ivory/10" : "bg-line", size === "lg" ? "aspect-[5/4]" : "aspect-[4/3]")}>
        {imgs.map((l) => (
          <ProductImage key={l.productCode} src={l.product.image} alt={l.product.name} category={l.product.category} tone={dark ? "dark" : "light"} className="h-full" sizes="(min-width: 1024px) 15vw, 45vw" />
        ))}
        {Array.from({ length: Math.max(0, 4 - imgs.length) }).map((_, i) => (
          <div key={i} className={dark ? "bg-ink-2" : "bg-stone"} />
        ))}
        <span className={cn("absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 rotate-45 place-items-center border", dark ? "border-champagne/60 bg-ink" : "border-champagne bg-paper")}>
          <span className="-rotate-45 font-display text-lg text-champagne">{view.pieces}</span>
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-2">
          <p className="eyebrow">{view.kit.audience}</p>
          {view.availability === "partial" && <Badge tone="warning">Stok doğrulanacak</Badge>}
        </div>
        <h3 className="mt-3 text-[1.9rem] leading-tight">{view.kit.name}</h3>
        <p className={cn("mt-2 text-sm leading-relaxed", dark ? "text-ivory/60" : "text-muted")}>{view.kit.tagline}</p>
        <div className={cn("mt-auto flex items-center justify-between pt-6 text-xs", dark ? "text-ivory/70" : "text-muted")}>
          <span>
            {view.pieces} parça · <KitPriceLine pricing={view.pricing} />
          </span>
          <Icon name="arrow" className="size-4 text-champagne transition-transform duration-500 group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
