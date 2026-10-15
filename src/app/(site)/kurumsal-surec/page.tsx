import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/motion";
import { ButtonLink, Container } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Kurumsal Süreç ve Teklif", alternates: { canonical: "/kurumsal-surec" } };

const STEPS = [
  ["Kitinizi oluşturun", "Sorularla ilerleyin, hazır bir kit seçin ya da katalogdan ürünleri kendiniz bir araya getirin."],
  ["Teklif talebi gönderin", "Kit içeriği, ürün kodları, renkler, adetler, baskı tercihleri ve logonuz tek formda bize ulaşır."],
  ["Doğrulama", "Stok durumu, baskı yöntemi, minimum adetler ve termin tedarikçiyle teyit edilir."],
  ["Teklif ve baskı önizlemesi", "Yazılı teklifiniz ve logonuzun ürünlere uygulanmış önizlemesi hazırlanır."],
  ["Onay ve üretim", "Onayınızla baskı, paketleme ve kitleme süreci başlar."],
  ["Teslimat", "Kitler belirttiğiniz adrese toplu olarak ya da talebe göre teslim edilir."],
];

export default function ProcessPage() {
  return (
    <>
      <PageHeader dark eyebrow="Süreç" title="Talepten teslimata" lead="Şeffaf, adım adım ilerleyen bir süreç. Hiçbir teslim tarihi veya fiyat, tedarikçi onayı olmadan kesinleştirilmez." />
      <Container className="max-w-4xl py-20 pb-28">
        <ol className="relative space-y-12 border-l border-line pl-10">
          {STEPS.map(([t, d], i) => (
            <Reveal as="li" key={t} delay={i * 0.05} className="relative">
              <span className="absolute -left-[3.15rem] grid size-8 place-items-center rounded-full border border-champagne bg-ivory font-display text-sm text-gold-deep">{i + 1}</span>
              <h2 className="text-3xl">{t}</h2>
              <p className="mt-2 text-muted">{d}</p>
            </Reveal>
          ))}
        </ol>
        <ButtonLink href="/kit-olustur" size="lg" className="mt-16">Kitimi oluştur</ButtonLink>
      </Container>
    </>
  );
}
