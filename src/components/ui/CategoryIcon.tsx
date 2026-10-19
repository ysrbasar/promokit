import { cn } from "./primitives";

/** Kategori ve sektör çizgi ikonları (24×24, stroke = currentColor) */
const PATHS: Record<string, React.ReactNode> = {
  "termos-matara": (
    <>
      <path d="M9.5 2.5h5v3h-5z" />
      <path d="M9 5.5h6l1 2.5v12a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 8 20V8z" />
      <path d="M8 11h8M8 16h8" />
    </>
  ),
  "defter-ajanda": (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1.5" />
      <path d="M8 3v18M11 8h5M11 11.5h5" />
    </>
  ),
  kalem: (
    <>
      <path d="M16.5 3.5l4 4L9 19l-5 1 1-5z" />
      <path d="M14 6l4 4" />
    </>
  ),
  canta: (
    <>
      <rect x="3.5" y="7.5" width="17" height="12.5" rx="2" />
      <path d="M8.5 7.5V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5v2M3.5 12.5h17" />
    </>
  ),
  teknoloji: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2.2" />
      <path d="M11 18.5h2M10.5 7l-1 4h3l-1 4" />
    </>
  ),
  tekstil: <path d="M8 3.5L3.5 6.5l2 4 2-1V20.5h9V9.5l2 1 2-4L16 3.5c-.5 1.5-2 2.5-4 2.5s-3.5-1-4-2.5z" />,
  "kupa-bardak": (
    <>
      <path d="M5 6.5h11v9a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" />
      <path d="M16 9h1.5a2.5 2.5 0 0 1 0 5H16M8 2.5v2M11 2.5v2" />
    </>
  ),
  masaustu: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M9 20.5h6M12 16v4.5" />
    </>
  ),
  "hediye-set": (
    <>
      <rect x="3.5" y="9" width="17" height="11.5" rx="1" />
      <path d="M2.5 9h19V6.5h-19zM12 6.5v14M12 6.5C10 2.5 6.5 3.5 7.5 6.5M12 6.5c2-4 5.5-3 4.5 0" />
    </>
  ),
  "kutu-ambalaj": (
    <>
      <path d="M3.5 8L12 3.5 20.5 8v8L12 20.5 3.5 16z" />
      <path d="M3.5 8L12 12.5 20.5 8M12 12.5v8M7.7 5.8l8.5 4.5" />
    </>
  ),
  "doga-dostu": (
    <>
      <path d="M5 19c0-8 5-13.5 15-14.5C19.5 14 14 19 6 19z" />
      <path d="M5 19l8-8" />
    </>
  ),
  saat: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  takvim: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4M7.5 13h2M11 13h2M14.5 13h2M7.5 16.5h2M11 16.5h2" />
    </>
  ),
  anahtarlik: (
    <>
      <circle cx="8" cy="15" r="4.5" />
      <path d="M11.2 11.8L20 3M16.5 6.5l2.5 2.5M14.5 8.5l2 2" />
    </>
  ),
  "plaket-odul": (
    <>
      <path d="M7 3.5h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 5H4v1.5a3 3 0 0 0 3 3M17 5h3v1.5a3 3 0 0 1-3 3M12 13.5v4M8 20.5h8M9.5 17.5h5" />
    </>
  ),
  cakmak: (
    <>
      <rect x="7" y="10" width="10" height="11" rx="1.5" />
      <path d="M9 10V7.5h4V10M12 2.5c1.8 1.6 1.8 3.2 0 4.2-1.8-1-1.8-2.6 0-4.2z" />
    </>
  ),
  kirtasiye: (
    <>
      <path d="M3 17.5L17.5 3 21 6.5 6.5 21H3z" />
      <path d="M14.5 6l3.5 3.5M6 14.5l1.5 1.5M9 11.5l1.5 1.5M12 8.5l1.5 1.5" />
    </>
  ),
  "rozet-magnet": (
    <>
      <circle cx="12" cy="9" r="6" />
      <path d="M8.5 13.8L7 21l5-2.5 5 2.5-1.5-7.2M12 6.5l.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3z" />
    </>
  ),
  "oto-yasam": (
    <>
      <path d="M4 16.5V12l2-5h12l2 5v4.5z" />
      <path d="M4 12h16M6.5 19.5a1.5 1.5 0 1 0 0-3M17.5 19.5a1.5 1.5 0 1 1 0-3M8 14.5h1M15 14.5h1" />
    </>
  ),
  diger: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  // Sektör / amaç ikonları
  welcome: (
    <>
      <circle cx="10" cy="8" r="4" />
      <path d="M3 20.5c0-3.9 3.1-7 7-7 1.6 0 3 .5 4.2 1.4M18.5 14v6M15.5 17h6" />
    </>
  ),
  client: (
    <>
      <path d="M2.5 11.5l4-4 4 2 3-2 3 1 5 3-4.5 4.5" />
      <path d="M10.5 9.5l-2.5 3 2 1.5 3-2.5M8 15.5l2 2M11 14l2.5 2.5M14 13l2 2" />
    </>
  ),
  dealer: (
    <>
      <path d="M3.5 9.5L5 4.5h14l1.5 5" />
      <path d="M3.5 9.5a2.8 2.8 0 0 0 5.7 0 2.8 2.8 0 0 0 5.6 0 2.8 2.8 0 0 0 5.7 0M5 12v8.5h14V12M10 20.5v-5h4v5" />
    </>
  ),
  event: (
    <>
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 10.5a6.5 6.5 0 0 0 13 0M12 17v4.5M8.5 21.5h7" />
    </>
  ),
  education: (
    <>
      <path d="M2 9l10-5 10 5-10 5z" />
      <path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5M22 9v6" />
    </>
  ),
  vip: <path d="M3 18.5h18L19.5 7.5l-4.5 4L12 4.5l-3 7-4.5-4zM5 21.5h14" />,
  seasonal: (
    <>
      <path d="M12 2.5v19M3.8 7.3l16.4 9.4M3.8 16.7l16.4-9.4" />
      <path d="M9.5 3.5L12 6l2.5-2.5M9.5 20.5L12 18l2.5 2.5" />
    </>
  ),
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-6", className)} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {PATHS[name] ?? PATHS.diger}
    </svg>
  );
}
