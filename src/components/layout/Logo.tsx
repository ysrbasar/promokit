/** Çalışma adı: "Maison Kit". Marka adı netleşince yalnızca bu bileşen değişir. */
export const BRAND = { name: "Maison Kit", tagline: "Kurumsal hediye kitleri" };

export function Logo({ className }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <rect x="1" y="1" width="30" height="30" rx="8" fill="none" stroke="currentColor" strokeOpacity=".35" />
        <path d="M8 22V10l8 7 8-7v12" fill="none" stroke="#c4a46a" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
      <span className="font-display text-[1.45rem] leading-none tracking-tight">
        Maison<span className="italic text-champagne"> Kit</span>
      </span>
    </span>
  );
}
