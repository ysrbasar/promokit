import type { Metadata, Viewport } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { CatalogProvider } from "@/components/providers/CatalogContext";
import { MotionProvider } from "@/components/ui/motion";
import { getCatalog, getSettings } from "@/lib/server/repositories";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const serif = Playfair_Display({ subsets: ["latin", "latin-ext"], weight: ["500", "600", "700", "800"], style: ["normal", "italic"], variable: "--font-serif", display: "swap" });
const sans = Plus_Jakarta_Sans({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700", "800"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Nadide Kit — Markanıza özel premium promosyon kitleri", template: "%s · Nadide Kit" },
  description: "İhtiyacınızı anlatın, bütçenizi belirleyin, ürünlerinizi seçin. Stoktaki gerçek ürünlerle kurumsal hediye kitinizi birlikte oluşturalım.",
  openGraph: { type: "website", locale: "tr_TR", siteName: "Nadide Kit" },
  alternates: { canonical: "/" },
};

/** Katalog türü ve stok eşiği çalışma zamanında okunur (içe aktarma sonrası yeniden derleme gerekmez) */
export const dynamic = "force-dynamic";

export const viewport: Viewport = { themeColor: "#0e1525", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [{ info }, settings] = await Promise.all([getCatalog(), getSettings()]);
  return (
    <html lang="tr" className={`${serif.variable} ${sans.variable}`}>
      <body className="min-h-dvh">
        <a href="#icerik" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory">
          İçeriğe geç
        </a>
        <CatalogProvider value={{ kind: info.kind, minStock: settings.minStock, budgetTiers: settings.budgetTiers, printMarkupPct: settings.printMarkupPct }}>
          <MotionProvider>
            {children}
          </MotionProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
