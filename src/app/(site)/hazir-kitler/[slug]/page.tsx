import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KitCard, KitPriceLine } from "@/components/kit/KitCard";
import { ReadyKitActions } from "@/components/kit/ReadyKitActions";
import { ProductImage } from "@/components/product/ProductImage";
import { kitImages } from "@/lib/catalog/lite";
import { StockBadge } from "@/components/product/StockAndPrice";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { AddToKitButton } from "@/components/kit/AddToKitButton";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Badge, Container, Icon, SectionHeading } from "@/components/ui/primitives";
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
  const products = v.lines.map((l) => l.product);
  const names = setContents.length ? setContents.map((c) => c.name) : products.map((p) => p.name);
  const pieces = setContents.length ? setContents.length : v.pieces;
  const allInStock = products.every((p) => p.stockStatus === "available");
  const methods = [...new Set(products.flatMap((p) => p.printingMethods))];
  const moq = Math.max(0, ...products.map((p) => p.minOrderQty ?? 0));
  const info = [
    { icon: "kutu-ambalaj", anim: "anim-pop", title: `${pieces} parça`, text: names.join(", ") },
    {
      icon: "truck",
      anim: "anim-drive",
      title: allInStock ? "Stoktan hızlı tedarik" : "Tedarik süresi teklifte",
      text: allInStock ? "Ürünler stokta; kesin teslim tarihi baskı onayıyla birlikte bildirilir." : "Stokta olmayan ürünler için gelecek stok tarihi teklifte bildirilir.",
    },
    { icon: "verify", anim: "anim-pop", title: "Onaylı baskı", text: "Logo önizlemesini onaylamadan üretime geçilmez." },
    {
      icon: "production",
      anim: "anim-spin-slow",
      title: methods.length ? `${methods.length} baskı seçeneği` : "Baskı teklifte",
      text: [methods.slice(0, 4).join(", "), moq ? `Minimum ${moq.toLocaleString("tr-TR")} adet` : ""].filter(Boolean).join(" · ") || "Uygun yöntem ürün özelinde belirlenir.",
    },
  ];

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
                <Link key={m.key} href={m.href} className={`group block transition-transform duration-500 hover:-translate-y-1 ${i % 2 ? "translate-y-8" : ""}`} aria-label={`${m.alt} ürün sayfası`}>
                  <ProductImage src={m.src} alt={m.alt} category={m.category} tone="dark" className="aspect-square rounded-card border border-ivory/10 transition-shadow group-hover:shadow-gold" sizes="(min-width: 1024px) 25vw, 45vw" priority={i < 2} />
                </Link>
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

      {/* Bilgi kartları */}
      <section className="pb-24">
        <Container>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {info.map((c) => (
              <li key={c.title} className="flex items-start gap-4 rounded-card border border-line bg-paper p-5 shadow-card transition-transform duration-500 hover:-translate-y-1">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-stone text-ink">
                  <CategoryIcon name={c.icon} className={`size-6 ${c.anim}`} />
                </span>
                <span className="min-w-0">
                  <span className="block font-bold">{c.title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted">{c.text}</span>
                </span>
              </li>
            ))}
          </ul>
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
                  <li key={c.code} className="flex items-center gap-3">
                    <Icon name="check" className="size-4 shrink-0 text-gold-deep" />
                    <span>{c.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {v.lines.map((l) => (
              <StaggerItem key={l.productCode}>
                <div className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-ivory transition-shadow duration-500 hover:shadow-lift">
                  <Link href={`/urun/${l.product.slug}`} className="block overflow-hidden">
                    <ProductImage src={l.product.image} alt={l.product.name} category={l.product.category} className="aspect-square transition-transform duration-700 group-hover:scale-105" />
                  </Link>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="eyebrow">{l.role || categoryLabel(l.product.category)}</p>
                    <Link href={`/urun/${l.product.slug}`} className="mt-2 font-display text-xl leading-tight hover:underline">
                      {l.product.name}
                    </Link>
                    <div className="mt-3 flex items-center justify-between">
                      <StockBadge status={l.product.stockStatus} />
                      <span className="text-xs text-muted">× {l.qty}</span>
                    </div>
                    {(l.status === "substituted" || l.status === "rule") && (
                      <Badge tone="gold" className="mt-2 self-start">
                        {l.status === "substituted" ? "Alternatif" : "Önerilen"}
                      </Badge>
                    )}
                    <div className="mt-auto flex flex-wrap gap-2 pt-4">
                      <AddToKitButton product={l.product} />
                      <AddToCartButton product={l.product} variantCode={l.variantCode} size="sm" />
                    </div>
                  </div>
                </div>
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
