import Link from "next/link";
import { Container } from "../ui/primitives";
import { Logo } from "./Logo";

const COLS = [
  {
    title: "Keşfet",
    links: [
      { href: "/kit-olustur", label: "Kit Oluştur" },
      { href: "/hazir-kitler", label: "Hazır Kitler" },
      { href: "/katalog", label: "Ürün Kataloğu" },
      { href: "/favoriler", label: "Favoriler" },
    ],
  },
  {
    title: "Kurumsal",
    links: [
      { href: "/hakkimizda", label: "Hakkımızda" },
      { href: "/kurumsal-surec", label: "Teklif Süreci" },
      { href: "/sss", label: "Sık Sorulan Sorular" },
      { href: "/iletisim", label: "İletişim" },
    ],
  },
  {
    title: "Yasal",
    links: [
      { href: "/kvkk", label: "KVKK Aydınlatma Metni" },
      { href: "/gizlilik", label: "Gizlilik ve Çerezler" },
      { href: "/kullanim-kosullari", label: "Kullanım Koşulları" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="dark-surface relative overflow-hidden bg-ink text-ivory">
      <div className="hairline absolute inset-x-0 top-0 opacity-60" />
      <Container className="grid gap-12 py-20 lg:grid-cols-[1.3fr_2fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-6 text-sm leading-relaxed text-ivory/60">
            Markanıza özel kurumsal hediye kitleri. İhtiyacınızı anlatın, bütçenizi belirleyin, ürünlerinizi seçin; gerisini birlikte tamamlayalım.
          </p>
          <p className="mt-8 font-display text-3xl italic text-champagne">Tek bir deneyimde.</p>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          {COLS.map((c) => (
            <div key={c.title}>
              <p className="eyebrow mb-5">{c.title}</p>
              <ul className="space-y-3">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-ivory/70 transition-colors hover:text-champagne">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
      <Container className="flex flex-col gap-3 border-t border-ivory/10 py-6 text-xs text-ivory/40 sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} PromoKit. Tüm hakları saklıdır.</span>
        <span>Stok bilgileri tedarikçi verisinden alınır ve teklif aşamasında yeniden doğrulanır.</span>
      </Container>
    </footer>
  );
}
