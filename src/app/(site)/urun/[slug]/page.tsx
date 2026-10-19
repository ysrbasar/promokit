import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductActions } from "@/components/product/ProductActions";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductImage } from "@/components/product/ProductImage";
import { PriceTag, StockBadge } from "@/components/product/StockAndPrice";
import { Reveal } from "@/components/ui/motion";
import { Badge, Container, SectionHeading } from "@/components/ui/primitives";
import { productImage, toLite } from "@/lib/catalog/lite";
import { isProductEligible } from "@/lib/catalog/stock";
import { categoryLabel } from "@/lib/config/taxonomy";
import { EMPTY_ANSWERS, findAlternatives } from "@/lib/kit/recommendation";
import { getCatalog, getProductBySlug, getSettings } from "@/lib/server/repositories";
import { SITE_URL } from "@/lib/site";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return {};
  const img = productImage(p);
  return {
    title: `${p.name} (${p.productCode})`,
    description: p.description ?? `${p.name} — ${categoryLabel(p.category)}. Kurumsal hediye kitinize ekleyin, logonuzla kişiselleştirin.`,
    alternates: { canonical: `/urun/${p.slug}` },
    openGraph: img ? { images: [img] } : undefined,
    robots: p.isDemo ? { index: false } : undefined,
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const p = await getProductBySlug((await params).slug);
  if (!p || !p.isActive) notFound();
  const [{ products }, settings] = await Promise.all([getCatalog(), getSettings()]);
  const lite = toLite(p);
  const answers = { ...EMPTY_ANSWERS, quantity: 0, purpose: p.giftOccasions[0] ?? null };
  const similar = findAlternatives(p, products, answers, settings, { limit: 4 });
  const complementary = products
    .filter((x) => x.category !== p.category && isProductEligible(x, settings.minStock) && x.giftOccasions.some((o) => p.giftOccasions.includes(o)))
    .filter((x, i, arr) => arr.findIndex((y) => y.category === x.category) === i)
    .slice(0, 4);

  const bySetCode = new Map(products.map((x) => [x.productCode.toLocaleUpperCase("tr-TR"), x]));
  const setItems = p.setContents.map((c) => ({ ...c, product: bySetCode.get(c.code) ?? null }));
  const outOfStock = p.stockStatus === "out";

  const specs: [string, string][] = [
    ...(p.minOrderQty ? [["Minimum sipariş", `${p.minOrderQty.toLocaleString("tr-TR")} adet`] as [string, string]] : []),
    ...Object.entries(p.technicalSpecifications),
    ...(p.capacity && !Object.values(p.technicalSpecifications).includes(p.capacity) ? [["Kapasite", p.capacity] as [string, string]] : []),
    ...(p.dimensions && !Object.values(p.technicalSpecifications).includes(p.dimensions) ? [["Ölçüler", p.dimensions] as [string, string]] : []),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.productCode,
    category: categoryLabel(p.category),
    url: `${SITE_URL}/urun/${p.slug}`,
    ...(lite.image ? { image: lite.image.startsWith("http") ? lite.image : `${SITE_URL}${lite.image}` } : {}),
    ...(p.description ? { description: p.description } : {}),
    ...(p.material ? { material: p.material } : {}),
    ...(p.availableColors.length ? { color: p.availableColors.join(", ") } : {}),
  };

  return (
    <>
      {!p.isDemo && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      <Container className="pb-24 pt-28 sm:pt-32">
        <nav aria-label="Sayfa yolu" className="mb-8 flex flex-wrap gap-2 text-xs text-muted">
          <Link href="/katalog" className="hover:text-ink">
            Katalog
          </Link>
          <span>/</span>
          <Link href={`/kategori/${p.category}`} className="hover:text-ink">
            {categoryLabel(p.category)}
          </Link>
          <span>/</span>
          <span className="text-ink">{p.name}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
          <Reveal>
            <div className="group sticky top-28 space-y-3">
              <ProductImage src={lite.image} alt={p.name} category={p.category} priority className="aspect-square rounded-card border border-line" sizes="(min-width: 1024px) 50vw, 100vw" />
              {p.gallery.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {p.gallery.slice(1, 5).map((g, i) => (
                    <ProductImage key={g} src={g} alt={`${p.name} görsel ${i + 2}`} category={p.category} className="aspect-square rounded-soft border border-line" sizes="120px" />
                  ))}
                </div>
              )}
              {p.isDemo && <p className="text-xs text-subtle">Örnek katalog kaydı — gerçek ürün görseli ve bilgisi değildir.</p>}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="eyebrow">{categoryLabel(p.category)}{p.subcategory && ` · ${p.subcategory}`}</p>
            <h1 className="mt-4 text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">{p.name}</h1>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <Badge>
                Ürün kodu <span className="font-mono">{p.productCode}</span>
              </Badge>
              <StockBadge status={p.stockStatus} />
              {p.stockUpdatedAt && <span className="text-xs text-subtle">Stok güncelleme: {new Date(p.stockUpdatedAt).toLocaleDateString("tr-TR")}</span>}
            </div>
            <PriceTag price={p.price} currency={p.priceCurrency} type={p.priceType} className="mt-6 text-lg" />
            {p.price !== null && !p.isDemo && (
              <p className="mt-1 text-xs text-subtle">
                Liste fiyatıdır, KDV dahil değildir{p.vatRate ? ` (KDV %${p.vatRate})` : ""}. Baskı ve ambalaj teklifte ayrıca belirtilir.
              </p>
            )}
            {outOfStock && (
              <p className="mt-4 rounded-soft border border-line bg-stone px-4 py-3 text-sm">
                Bu ürün şu an stokta yok. {p.stockKept ? "Yeni stok geldiğinde gönderim yapılabilir; tarih teklifte bildirilir." : "Siparişe özel üretilir; termin teklifte bildirilir."}
              </p>
            )}
            {p.description && <p className="mt-6 max-w-xl leading-relaxed text-muted">{p.description}</p>}

            <div className="mt-10">
              <ProductActions product={lite} />
            </div>

            {setItems.length > 0 && (
              <section className="mt-12" aria-labelledby="set-icerigi">
                <h2 id="set-icerigi" className="eyebrow mb-4">
                  Set içeriği
                </h2>
                <ul className="divide-y divide-line border-y border-line">
                  {setItems.map((c) => (
                    <li key={c.code} className="flex items-center gap-4 py-3 text-sm">
                      {c.product ? (
                        <ProductImage src={toLite(c.product).image} alt={c.name} category={c.product.category} className="size-12 shrink-0 rounded-soft border border-line" sizes="48px" />
                      ) : (
                        <span className="size-12 shrink-0 rounded-soft border border-line bg-stone" />
                      )}
                      <span className="min-w-0 flex-1">
                        {c.product ? (
                          <Link href={`/urun/${c.product.slug}`} className="hover:underline">
                            {c.name}
                          </Link>
                        ) : (
                          c.name
                        )}
                        <span className="block font-mono text-xs text-subtle">{c.code}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {specs.length > 0 && (
              <section className="mt-12" aria-labelledby="ozellikler">
                <h2 id="ozellikler" className="eyebrow mb-4">
                  Teknik özellikler
                </h2>
                <dl className="divide-y divide-line border-y border-line">
                  {specs.map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[40%_1fr] gap-4 py-3 text-sm">
                      <dt className="text-muted">{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            <section className="mt-10" aria-labelledby="kisisellestirme">
              <h2 id="kisisellestirme" className="eyebrow mb-4">
                Baskı ve kişiselleştirme
              </h2>
              {p.printingMethods.length ? (
                <div className="flex flex-wrap gap-2">
                  {p.printingMethods.map((m) => (
                    <Badge key={m} tone="gold">
                      {m}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">Uygun baskı yöntemi teklif aşamasında ürün özelinde belirlenir.</p>
              )}
            </section>
          </Reveal>
        </div>
      </Container>

      {similar.length > 0 && (
        <section className="border-t border-line bg-paper py-20">
          <Container>
            <SectionHeading eyebrow="Benzer ürünler" title="Aynı kategoride stokta" />
            <div className="mt-10 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-4">
              {similar.map((s) => (
                <ProductCard key={s.productCode} product={toLite(s)} />
              ))}
            </div>
          </Container>
        </section>
      )}
      {complementary.length > 0 && (
        <section className="py-20 pb-28">
          <Container>
            <SectionHeading eyebrow="Kitinizi tamamlayın" title="Birlikte iyi gider" />
            <div className="mt-10 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-4">
              {complementary.map((s) => (
                <ProductCard key={s.productCode} product={toLite(s)} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
