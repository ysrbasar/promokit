/** Marka: "Nadide Kit" (nadide: nadir ve değerli). Marka adı değişirse yalnızca bu bileşen değişir. */
export const BRAND = { name: "Nadide Kit", tagline: "Premium promosyon kitleri" };

export function Logo({ className }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <rect x="1" y="1" width="30" height="30" rx="8" fill="none" stroke="currentColor" strokeOpacity=".35" />
        <path d="M10 23V9l12 14V9" fill="none" stroke="#c4a46a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-display text-[1.45rem] font-bold leading-none tracking-tight">
        Nadide<span className="italic text-champagne"> Kit</span>
      </span>
    </span>
  );
}
