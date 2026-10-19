import Link from "next/link";
import { HeroSection } from "@/components/home/HeroSection";
import { KitCard } from "@/components/kit/KitCard";
import { ProductCard } from "@/components/product/ProductCard";
import { Accordion } from "@/components/ui/Accordion";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { ButtonLink, Container, Icon, SectionHeading } from "@/components/ui/primitives";
import { CATEGORIES, PURPOSES } from "@/lib/config/taxonomy";
import { FAQ } from "@/lib/content/faq";
import { getSettings } from "@/lib/server/repositories";
import { getCategoryCounts, getFeaturedProducts, getKitViews, getShowcaseProducts } from "@/lib/server/views";

export const dynamic = "force-dynamic";

const STEPS = [
  { n: "01", t: "Anlatın", d: "Kitin amacını, hedef kitlenizi ve kişi sayısını birkaç dokunuşla seçin." },
  { n: "02", t: "Şekillendirin", d: "Bütçe ve stile göre stoktaki ürünlerden önerilen kiti düzenleyin; ürün ekleyin, çıkarın, değiştirin." },
  { n: "03", t: "Teklif alın", d: "Logonuzu ekleyin, teslim tarihini belirtin. Ekibimiz stok ve baskıyı doğrulayıp teklifinizi hazırlasın." },
];

const SECTORS = [
  { k: "welcome", t: "İnsan Kaynakları", d: "Onboarding ve çalışan bağlılığı" },
  { k: "client", t: "Satış ve Pazarlama", d: "Müşteri ziyaretleri ve kampanyalar" },
  { k: "dealer", t: "Bayi Ağları", d: "Bayi toplantıları ve teşekkür" },
  { k: "event", t: "Etkinlik ve Fuar", d: "Kongre, lansman, fuar standı" },
  { k: "education", t: "Eğitim Kurumları", d: "Kampüs ve mezuniyet" },
  { k: "vip", t: "Üst Yönetim", d: "Yönetim kurulu ve VIP" },
];

export default async function HomePage() {
  const [kits, featured, counts, settings, showcase] = await Promise.all([getKitViews(), getFeaturedProducts(12), getCategoryCounts(), getSettings(), getShowcaseProducts()]);
  const featuredKits = kits.filter((k) => k.kit.isFeatured).slice(0, 5);
  const [lead, ...restKits] = featuredKits;

  return (
    <>
      <HeroSection products={showcase.length >= 4 ? showcase : featured.slice(0, 4)} />

      {/* 2. Üç adımda kit */}
      <section id="nasil" className="py-24 sm:py-32">
        <Container>
          <div className="grid gap-16 lg:grid-cols-[1fr_1.4fr]">
            <Reveal>
              <SectionHeading eyebrow="Nasıl çalışır" title={<>Üç adımda <em className="text-gold-deep">size özel</em> kit</>} lead="Uzun formlar yok. Her adımda tek bir soru, görsel seçenekler ve anlık güncellenen bir kit özeti." />
              <ButtonLink href="/kit-olustur" className="mt-10">
                Sihirbazı başlat <Icon name="arrow" className="size-4" />
              </ButtonLink>
            </Reveal>
            <Stagger className="grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-3">
              {STEPS.map((s) => (
                <StaggerItem key={s.n} className="flex flex-col bg-paper p-8">
                  <span className="font-display text-5xl text-champagne">{s.n}</span>
                  <h3 className="mt-10 text-3xl">{s.t}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{s.d}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </Container>
      </section>

      {/* 3. Öne çıkan hazır kitler */}
      {lead && (
        <section className="bg-stone/60 py-24 sm:py-32">
          <Container>
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <Reveal>
                <SectionHeading eyebrow="Hazır kitler" title="Sıfırdan başlamayın" lead="Gerçek ürünlerden oluşturulmuş kombinasyonlar. Olduğu gibi teklif isteyin ya da kendinize göre özelleştirin." />
              </Reveal>
              <Link href="/hazir-kitler" className="group inline-flex items-center gap-2 text-sm font-semibold">
                Tüm kitler <Icon name="arrow" className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="mt-14 grid gap-6 lg:grid-cols-[1.2fr_1fr_1fr] lg:grid-rows-2">
              <Reveal className="lg:row-span-2">
                <KitCard view={lead} size="lg" />
              </Reveal>
              {restKits.slice(0, 4).map((k, i) => (
                <Reveal key={k.kit.slug} delay={0.08 * (i + 1)}>
                  <KitCard view={k} />
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 4. Kategoriler */}
      <section className="py-24 sm:py-32">
        <Container>
          <Reveal>
            <SectionHeading eyebrow="Ürün keşfi" title="Kategorilere göre keşfedin" align="center" />
          </Reveal>
          <Stagger className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-3 lg:grid-cols-4">
            {CATEGORIES.filter((c) => c.key !== "diger" && (counts.get(c.key) ?? 0) > 0).map((c) => (
              <StaggerItem key={c.key}>
                <Link href={`/kategori/${c.key}`} className="group flex h-full min-h-44 flex-col justify-between gap-6 bg-paper p-6 transition-colors duration-500 hover:bg-ink hover:text-ivory">
                  <span className="flex items-start justify-between">
                    <span className="grid size-14 place-items-center rounded-2xl bg-champagne-light/60 text-gold-deep transition-all duration-500 group-hover:-rotate-6 group-hover:scale-110 group-hover:bg-champagne group-hover:text-ink">
                      <CategoryIcon name={c.key} className="size-7" />
                    </span>
                    <span className="text-xs font-semibold text-subtle group-hover:text-champagne">{counts.get(c.key)} ürün</span>
                  </span>
                  <span>
                    <span className="block font-display text-2xl leading-tight">{c.label}</span>
                    <span className="mt-1 block text-xs text-muted group-hover:text-ivory/60">{c.hint}</span>
                  </span>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* 5. Bütçeye göre */}
      <section className="border-y border-line bg-paper py-20">
        <Container className="grid items-center gap-10 lg:grid-cols-[1fr_2fr]">
          <Reveal>
            <p className="eyebrow mb-4">Bütçeye göre</p>
            <h2 className="text-4xl leading-tight">Kişi başı bütçenizle başlayın</h2>
            <p className="mt-4 text-sm text-muted">Bütçe aralıkları yol göstericidir; kesin tutar adet ve baskıya göre teklifle netleşir.</p>
          </Reveal>
          <Stagger className="flex flex-wrap gap-3">
            {settings.budgetTiers.map((b) => (
              <StaggerItem key={b.key}>
                <Link href={`/kit-olustur?butce=${b.key}`} className="inline-flex h-12 items-center rounded-full border border-line-strong px-6 text-sm font-medium transition-all duration-300 hover:border-champagne hover:bg-champagne-light/40">
                  {b.label}
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* 6. Sektöre göre */}
      <section className="py-24 sm:py-32">
        <Container>
          <Reveal>
            <SectionHeading eyebrow="Sektöre göre" title="Ekibinizin ihtiyacına göre" />
          </Reveal>
          <Stagger className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SECTORS.map((s) => (
              <StaggerItem key={s.k}>
                <Link href={`/kit-olustur?amac=${s.k}`} className="group flex items-center justify-between gap-4 rounded-card border border-line bg-paper p-7 transition-all duration-500 hover:-translate-y-1 hover:border-champagne hover:shadow-gold">
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-ink text-champagne transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110">
                    <CategoryIcon name={s.k} className="size-7" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-2xl">{s.t}</span>
                    <span className="mt-1 block text-sm text-muted">{s.d}</span>
                    <span className="mt-3 block text-xs text-gold-deep">{PURPOSES.find((p) => p.key === s.k)?.label}</span>
                  </span>
                  <Icon name="arrow" className="size-5 shrink-0 text-champagne transition-transform group-hover:translate-x-1" />
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* 7. Premium seçki */}
      <section className="dark-surface bg-ink py-24 text-ivory sm:py-32">
        <Container>
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <Reveal>
              <SectionHeading eyebrow="Seçki" title={<>Premium <em className="text-champagne">ürün seçkisi</em></>} lead={<span className="text-ivory/60">Stok eşiğini karşılayan, öne çıkan ürünler.</span>} />
            </Reveal>
            <ButtonLink href="/katalog" variant="light">
              Kataloğa git
            </ButtonLink>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-5 text-ink sm:grid-cols-2 lg:grid-cols-4">
            {featured.slice(4, 12).map((p) => (
              <Reveal key={p.productCode}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* 8. Kendi kitini oluştur */}
      <section className="relative overflow-hidden py-28 sm:py-36">
        <div aria-hidden className="absolute inset-0 grain opacity-50" />
        <Container className="relative text-center">
          <Reveal>
            <p className="eyebrow mb-6">Kendi kitiniz</p>
            <h2 className="mx-auto max-w-3xl text-5xl leading-[1.02] sm:text-7xl">
              Her kit, markanızın <em className="text-gold-deep">bir cümlesi.</em>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-muted">Sorularla ilerleyin ya da katalogdan dilediğiniz ürünleri seçerek kendi kombinasyonunuzu kurun.</p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/kit-olustur" size="lg">
                Sorularla oluştur
              </ButtonLink>
              <ButtonLink href="/katalog" variant="outline" size="lg">
                Katalogdan seç
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* 9. Süreç */}
      <section className="border-t border-line bg-paper py-24">
        <Container className="grid gap-12 lg:grid-cols-4">
          <Reveal className="lg:col-span-1">
            <p className="eyebrow mb-4">Kurumsal süreç</p>
            <h2 className="text-4xl leading-tight">Talepten teslimata</h2>
            <Link href="/kurumsal-surec" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
              Ayrıntılar <Icon name="arrow" className="size-4" />
            </Link>
          </Reveal>
          {[
            ["Teklif talebi", "Kitiniz, adetler ve tercihleriniz tek formda bize ulaşır."],
            ["Doğrulama", "Stok, baskı yöntemi ve termin tedarikçiyle teyit edilir."],
            ["Onay ve üretim", "Baskı önizlemesini onaylarsınız; üretim ve paketleme başlar."],
          ].map(([t, d], i) => (
            <Reveal key={t} delay={0.1 * i}>
              <div className="h-px w-12 bg-champagne" />
              <h3 className="mt-6 text-2xl">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
            </Reveal>
          ))}
        </Container>
      </section>

      {/* 10. SSS */}
      <section className="py-24 sm:py-32">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <Reveal>
            <SectionHeading eyebrow="SSS" title="Sık sorulan sorular" />
            <Link href="/sss" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
              Tümü <Icon name="arrow" className="size-4" />
            </Link>
          </Reveal>
          <Reveal delay={0.1}>
            <Accordion items={FAQ.slice(0, 5)} />
          </Reveal>
        </Container>
      </section>
    </>
  );
}
