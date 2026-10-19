import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KitCard, KitPriceLine } from "@/components/kit/KitCard";
import { ReadyKitActions } from "@/components/kit/ReadyKitActions";
import { ProductImage } from "@/components/product/ProductImage";
import { kitImages } from "@/lib/catalog/lite";
import { StockBadge } from "@/components/product/StockAndPrice";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { Badge, Container, SectionHeading } from "@/components/ui/primitives";
import { categoryLabel } from "@/lib/config/taxonomy";
import { getKitView, getKitViews } from "@/lib/server/views";

type Params = Promise<{ slug: string }>;
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const v = await getKitView((await params).slug);
  if (!v) return {};
  return { title: v.kit.name, description: v.kit.description, alternates: { canonical: `/hazir-kitler/${v.kit.slug}` } };
}

export default async function ReadyKitDetail({ params }: { params: Params }) {
  const { slug } = await params;
  const v = await getKitView(slug);
  if (!v) notFound();
  const others = (await getKitViews()).filter((k) => k.kit.slug !== slug).slice(0, 3);
  const setContents = v.lines.flatMap((l) => l.product.setContents);

  return (
    <>
      {/* Kapak */}
      <section className="dark-surface relative overflow-hidden bg-ink pb-20 pt-32 text-ivory sm:pt-36">
        <div aria-hidden className="absolute -left-40 top-0 size-[620px] rounded-full bg-[radial-gradient(circle,rgb(196_164_106/0.14),transparent_65%)]" />
        <Container className="relative grid items-center gap-14 lg:grid-cols-[1fr_1.1fr]">
          <Reveal>
            <Link href="/hazir-kitler" className="text-xs text-ivory/50 hover:text-champagne">
              ← Hazır kitler
            </Link>
            <p className="eyebrow mt-8">{v.kit.audience}</p>
            <h1 className="mt-4 text-5xl leading-[1] sm:text-7xl">{v.kit.name}</h1>
            <p className="mt-4 font-display text-2xl italic text-champagne">{v.kit.tagline}</p>
            <p className="mt-6 max-w-lg leading-relaxed text-ivory/65">{v.kit.description}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-ivory/70">
              <span>{v.pieces} parça</span>
              <span className="text-ivory/30">·</span>
              <KitPriceLine pricing={v.pricing} />
              <span className="text-ivory/30">·</span>
              <span>Önerilen: {v.kit.recommendedQuantity}</span>
              {v.availability === "partial" && <Badge tone="warning">Stok doğrulanacak</Badge>}
            </div>
            <div className="mt-10">
              <ReadyKitActions slug={v.kit.slug} name={v.kit.name} lines={v.lines.map((l) => ({ productCode: l.productCode, variantCode: l.variantCode, qty: l.qty }))} products={v.lines.map((l) => l.product)} />
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="relative grid grid-cols-2 gap-3" aria-label="Temsili kit kompozisyonu">
              {kitImages(v.lines.map((l) => l.product)).map((m, i) => (
                <div key={m.key} className={i % 2 ? "translate-y-8" : ""}>
                  <ProductImage src={m.src} alt={m.alt} category={m.category} tone="dark" className="aspect-square rounded-card border border-ivory/10" sizes="(min-width: 1024px) 25vw, 45vw" priority={i < 2} />
                </div>
              ))}
            </div>
            {v.lines.length > 1 && <p className="mt-12 text-center text-[0.7rem] text-ivory/35">Temsili kompozisyondur; ürünlerin kutu içindeki gerçek fotoğrafı değildir.</p>}
          </Reveal>
        </Container>
      </section>

      {/* Hikâye */}
      <section className="py-24">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <Reveal>
            <p className="eyebrow">Kitin hikâyesi</p>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="font-display text-3xl leading-snug sm:text-4xl">{v.kit.story}</p>
            <dl className="mt-10 grid gap-6 sm:grid-cols-3">
              {[
                ["Hedef kitle", v.kit.audience],
                ["Kullanım amacı", v.kit.purpose],
                ["Önerilen kişi sayısı", v.kit.recommendedQuantity],
              ].map(([k, val]) => (
                <div key={k} className="border-t border-line pt-4">
                  <dt className="text-xs text-muted">{k}</dt>
                  <dd className="mt-1 font-medium">{val}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </Container>
      </section>

      {/* İçindekiler */}
      <section className="border-y border-line bg-paper py-24">
        <Container>
          <SectionHeading eyebrow="Kitin içinde" title="Her parçanın bir rolü var" />
          {v.notes.length > 0 && (
            <ul className="mt-6 space-y-1 text-sm text-warning">
              {v.notes.map((n) => (
                <li key={n}>• {n}</li>
              ))}
            </ul>
          )}
          {setContents.length > 0 && (
            <div className="mt-10 rounded-card border border-line bg-ivory p-6">
              <p className="eyebrow">Kutu içeriği</p>
              <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                {setContents.map((c) => (
                  <li key={c.code} className="flex gap-3">
                    <span className="font-mono text-xs text-subtle">{c.code}</span>
                    <span>{c.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {v.lines.map((l) => (
              <StaggerItem key={l.productCode}>
                <Link href={`/urun/${l.product.slug}`} className="group block overflow-hidden rounded-card border border-line bg-ivory transition-shadow duration-500 hover:shadow-lift">
                  <ProductImage src={l.product.image} alt={l.product.name} category={l.product.category} className="aspect-square" />
                  <div className="p-5">
                    <p className="eyebrow">{l.role || categoryLabel(l.product.category)}</p>
                    <p className="mt-2 font-display text-xl leading-tight">{l.product.name}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted">
                      <span className="font-mono">{l.productCode}</span>
                      <span>× {l.qty}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <StockBadge status={l.product.stockStatus} />
                      {l.status === "substituted" && <Badge tone="gold">Alternatif</Badge>}
                      {l.status === "rule" && <Badge tone="gold">Önerilen</Badge>}
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* Kişiselleştirme */}
      <section className="py-24">
        <Container className="grid gap-10 lg:grid-cols-2">
          <Reveal>
            <SectionHeading eyebrow="Kişiselleştirme" title="Markanızın imzasıyla" lead="Uygulanabilecek yöntemler ürün bazında teklif aşamasında kesinleşir." />
          </Reveal>
          <Reveal delay={0.1} className="flex flex-wrap content-start gap-3">
            {v.kit.personalization.map((p) => (
              <span key={p} className="rounded-full border border-champagne/60 px-5 py-2.5 text-sm">
                {p}
              </span>
            ))}
          </Reveal>
        </Container>
      </section>

      {/* Alternatif kombinasyonlar */}
      {others.length > 0 && (
        <section className="bg-stone/60 py-24 pb-28">
          <Container>
            <SectionHeading eyebrow="Alternatif kombinasyonlar" title="Bunlara da göz atın" />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((k) => (
                <KitCard key={k.kit.slug} view={k} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
