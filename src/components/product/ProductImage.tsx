import Image from "next/image";
import { cn } from "../ui/primitives";

/**
 * Ürün görseli. Görsel yoksa ALAKASIZ bir ürün fotoğrafı yerine kategoriye özgü
 * zarif bir çizim (placeholder) gösterilir.
 */
export function ProductImage({
  src,
  alt,
  category,
  className,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 40vw, 90vw",
  priority,
  tone = "light",
}: {
  src: string | null;
  alt: string;
  category: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  tone?: "light" | "dark";
}) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-paper", className)}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-contain p-[8%] transition-transform duration-[1200ms] ease-[var(--ease-lux)] group-hover:scale-[1.06]" />
      </div>
    );
  }
  return (
    <div
      role="img"
      aria-label={`${alt} — görsel hazırlanıyor`}
      className={cn(
        "relative grid place-items-center overflow-hidden",
        tone === "dark" ? "bg-ink-2 text-champagne/70" : "bg-gradient-to-br from-paper to-stone text-ink/25",
        className,
      )}
    >
      <div className="absolute inset-0 grain opacity-60" />
      <svg viewBox="0 0 120 120" className="relative w-[46%] transition-transform duration-[1200ms] ease-[var(--ease-lux)] group-hover:scale-[1.06]" fill="none" stroke="currentColor" strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {ART[category] ?? ART.default}
      </svg>
    </div>
  );
}

const ART: Record<string, React.ReactNode> = {
  "termos-matara": (
    <>
      <rect x="44" y="24" width="32" height="12" rx="3" />
      <path d="M42 38h36v58a8 8 0 0 1-8 8H50a8 8 0 0 1-8-8z" />
      <path d="M42 52h36M52 64v24" opacity=".5" />
    </>
  ),
  "kupa-bardak": (
    <>
      <path d="M34 40h44v40a14 14 0 0 1-14 14H48a14 14 0 0 1-14-14z" />
      <path d="M78 50h6a10 10 0 0 1 0 20h-6" />
      <path d="M48 26c0 6 6 6 6 12M62 24c0 6 6 6 6 12" opacity=".5" />
    </>
  ),
  "defter-ajanda": (
    <>
      <rect x="34" y="22" width="52" height="76" rx="4" />
      <path d="M44 22v76M78 22v76" opacity=".5" />
      <path d="M52 44h20M52 54h14" opacity=".6" />
    </>
  ),
  kalem: (
    <>
      <path d="M30 90L80 40l8 8-50 50-12 4z" />
      <path d="M74 46l8 8M80 40l6-6a4 4 0 0 1 6 0l2 2a4 4 0 0 1 0 6l-6 6" />
    </>
  ),
  teknoloji: (
    <>
      <rect x="38" y="20" width="44" height="80" rx="8" />
      <path d="M54 30h12" />
      <path d="M62 50l-8 14h12l-8 14" />
    </>
  ),
  canta: (
    <>
      <path d="M30 46h60l-6 52H36z" />
      <path d="M46 46v-8a14 14 0 0 1 28 0v8" />
    </>
  ),
  tekstil: <path d="M44 24l-20 12 8 16 8-4v48h40V48l8 4 8-16-20-12c-2 8-8 12-16 12s-14-4-16-12z" />,
  masaustu: (
    <>
      <path d="M24 86h72" />
      <rect x="34" y="50" width="22" height="36" rx="2" />
      <circle cx="76" cy="66" r="14" />
      <path d="M76 58v8l5 4" />
    </>
  ),
  "hediye-set": (
    <>
      <rect x="28" y="48" width="64" height="48" rx="2" />
      <path d="M24 36h72v12H24zM60 36v60" />
      <path d="M60 36c-8-14-24-10-18 0M60 36c8-14 24-10 18 0" />
    </>
  ),
  "kutu-ambalaj": (
    <>
      <path d="M24 44l36-16 36 16-36 16z" />
      <path d="M24 44v36l36 16 36-16V44M60 60v36" />
    </>
  ),
  "doga-dostu": (
    <>
      <path d="M60 96V54" />
      <path d="M60 64c-22 0-30-16-30-34 18 0 30 10 30 34zM60 54c0-20 12-30 32-30 0 18-10 30-32 30z" />
    </>
  ),
  default: (
    <>
      <rect x="30" y="30" width="60" height="60" rx="6" />
      <path d="M44 60h32M60 44v32" opacity=".5" />
    </>
  ),
};
