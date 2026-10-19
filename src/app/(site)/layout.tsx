import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileKitBar } from "@/components/layout/MobileKitBar";
import { getCatalog } from "@/lib/server/repositories";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { info } = await getCatalog();
  return (
    <>
      <Header />
      {info.kind === "demo" && (
        <div role="note" className="fixed inset-x-0 bottom-0 z-30 bg-champagne-light/95 px-4 py-1.5 text-center text-[0.7rem] leading-snug text-ink backdrop-blur">
          <strong className="font-semibold">Örnek veri:</strong> Gerçek tedarikçi kataloğu henüz içe aktarılmadı<span className="hidden sm:inline">; ürünler, stoklar ve fiyatlar temsilidir</span>.{" "}
          <Link href="/hakkimizda#veri" className="underline underline-offset-2">
            Ayrıntı
          </Link>
        </div>
      )}
      {/* Revizyon projesi notu: her sayfada sol altta küçük bir rozet */}
      <div role="note" className="pointer-events-none fixed bottom-20 left-3 z-30 flex items-center gap-2 rounded-full border border-champagne/50 bg-ink/90 px-3 py-1.5 text-[0.68rem] font-semibold text-ivory shadow-lift backdrop-blur lg:bottom-4 lg:left-4">
        <span className="stock-lamp text-champagne" aria-hidden />
        Bu bir revizyon projesidir
      </div>
      <main id="icerik">{children}</main>
      <Footer />
      <MobileKitBar />
    </>
  );
}
