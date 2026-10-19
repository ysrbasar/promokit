/** Marka: "PromoKit". Marka adı değişirse yalnızca bu bileşen değişir. */
export const BRAND = { name: "PromoKit", tagline: "Premium promosyon kitleri" };

/** Kurdeleli hediye paketi simgesi + yazı */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={`group/logo flex items-center gap-2.5 ${className ?? ""}`}>
      <svg viewBox="0 0 32 32" className="size-9 transition-transform duration-500 group-hover/logo:-rotate-6 group-hover/logo:scale-110" aria-hidden>
        <rect x="5" y="13" width="22" height="15" rx="2" fill="none" stroke="currentColor" strokeOpacity=".55" strokeWidth="1.6" />
        <rect x="3.5" y="9" width="25" height="5" rx="1.5" fill="none" stroke="currentColor" strokeOpacity=".55" strokeWidth="1.6" />
        <path d="M16 9v19" stroke="#c4a46a" strokeWidth="2.4" />
        <path d="M16 9c-2-4.5-7.5-5-7-1.5.3 2 4.5 1.5 7 1.5zM16 9c2-4.5 7.5-5 7-1.5-.3 2-4.5 1.5-7 1.5z" fill="none" stroke="#c4a46a" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
      <span className="font-display text-[1.5rem] font-bold leading-none tracking-tight">
        Promo<span className="italic text-champagne">Kit</span>
      </span>
    </span>
  );
}
