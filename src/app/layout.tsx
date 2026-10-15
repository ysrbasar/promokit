import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { CatalogProvider } from "@/components/providers/CatalogContext";
import { MotionProvider } from "@/components/ui/motion";
import { getCatalog, getSettings } from "@/lib/server/repositories";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const cormorant = Cormorant_Garamond({ subsets: ["latin", "latin-ext"], weight: ["300", "400", "500"], style: ["normal", "italic"], variable: "--font-cormorant", display: "swap" });
const manrope = Manrope({ subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600", "700"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Maison Kit — Markanıza özel kurumsal hediye kitleri", template: "%s · Maison Kit" },
  description: "İhtiyacınızı anlatın, bütçenizi belirleyin, ürünlerinizi seçin. Stoktaki gerçek ürünlerle kurumsal hediye kitinizi birlikte oluşturalım.",
  openGraph: { type: "website", locale: "tr_TR", siteName: "Maison Kit" },
  alternates: { canonical: "/" },
};

/** Katalog türü ve stok eşiği çalışma zamanında okunur (içe aktarma sonrası yeniden derleme gerekmez) */
export const dynamic = "force-dynamic";

export const viewport: Viewport = { themeColor: "#0e1525", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [{ info }, settings] = await Promise.all([getCatalog(), getSettings()]);
  return (
    <html lang="tr" className={`${cormorant.variable} ${manrope.variable}`}>
      <body className="min-h-dvh">
        <a href="#icerik" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory">
          İçeriğe geç
        </a>
        <CatalogProvider value={{ kind: info.kind, minStock: settings.minStock, budgetTiers: settings.budgetTiers }}>
          <MotionProvider>
            {children}
          </MotionProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
