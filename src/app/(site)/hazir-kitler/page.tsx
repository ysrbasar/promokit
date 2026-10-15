import type { Metadata } from "next";
import { KitCard } from "@/components/kit/KitCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/motion";
import { ButtonLink, Container } from "@/components/ui/primitives";
import { getKitViews } from "@/lib/server/views";

export const metadata: Metadata = {
  title: "Hazır Kitler",
  description: "Welcome kit, yönetici kiti, etkinlik ve teknoloji kitleri: stoktaki gerçek ürünlerden hazırlanmış kurumsal hediye kombinasyonları.",
  alternates: { canonical: "/hazir-kitler" },
};
export const dynamic = "force-dynamic";

export default async function ReadyKitsPage() {
  const kits = await getKitViews();
  return (
    <>
      <PageHeader dark eyebrow="Hazır kitler" title={<>Seçilmiş <em className="text-champagne">kombinasyonlar</em></>} lead="Her kit gerçek katalog ürünlerine bağlıdır. Stok koşulunu karşılamayan bir ürün olursa benzer bir ürünle değiştirilir ya da kit 'stok doğrulanacak' olarak işaretlenir." />
      <Container className="py-16 pb-28">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {kits.map((k, i) => (
            <Reveal key={k.kit.slug} delay={(i % 3) * 0.08}>
              <KitCard view={k} />
            </Reveal>
          ))}
        </div>
        <div className="mt-20 rounded-card border border-line bg-paper p-10 text-center">
          <p className="font-display text-3xl">Aradığınız kombinasyon burada yok mu?</p>
          <p className="mt-2 text-muted">Birkaç soruyla size özel bir kit oluşturalım.</p>
          <ButtonLink href="/kit-olustur" className="mt-6">
            Kitimi oluştur
          </ButtonLink>
        </div>
      </Container>
    </>
  );
}
