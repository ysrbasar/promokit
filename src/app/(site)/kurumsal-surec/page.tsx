import type { Metadata } from "next";
import { ProcessRoad, type RoadStep } from "@/components/home/ProcessRoad";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink, Container } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Kurumsal Süreç ve Teklif", alternates: { canonical: "/kurumsal-surec" } };

const STEPS: RoadStep[] = [
  { title: "Kitinizi oluşturun", text: "Sorularla ilerleyin, hazır bir kit seçin ya da katalogdan ürünleri kendiniz bir araya getirin.", icon: "hediye-set", anim: "anim-pop" },
  { title: "Teklif talebi gönderin", text: "Kit içeriği, ürün kodları, renkler, adetler, baskı tercihleri ve logonuz tek formda bize ulaşır.", icon: "form", anim: "anim-float" },
  { title: "Doğrulama", text: "Stok durumu, baskı yöntemi, minimum adetler ve termin tedarikçiyle teyit edilir.", icon: "verify", anim: "anim-pop" },
  { title: "Teklif ve baskı önizlemesi", text: "Yazılı teklifiniz ve logonuzun ürünlere uygulanmış önizlemesi hazırlanır.", icon: "preview", anim: "anim-blink" },
  { title: "Onay ve üretim", text: "Onayınızla baskı, paketleme ve kitleme süreci başlar.", icon: "production", anim: "anim-spin-slow" },
  { title: "Teslimat", text: "Kitler belirttiğiniz adrese toplu olarak ya da talebe göre teslim edilir.", icon: "truck", anim: "anim-drive" },
];

export default function ProcessPage() {
  return (
    <>
      <PageHeader dark eyebrow="Süreç" title="Talepten teslimata" lead="Şeffaf, adım adım ilerleyen bir süreç. Hiçbir teslim tarihi veya fiyat, tedarikçi onayı olmadan kesinleştirilmez." />
      <Container className="py-20 pb-28">
        <ProcessRoad steps={STEPS} />
        <div className="mt-16 flex justify-center">
          <ButtonLink href="/kit-olustur" size="lg">
            Kitimi oluştur
          </ButtonLink>
        </div>
      </Container>
    </>
  );
}
