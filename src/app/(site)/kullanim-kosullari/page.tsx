import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { LegalDraftNotice, Prose } from "@/components/layout/Prose";
import { Container } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Kullanım Koşulları", alternates: { canonical: "/kullanim-kosullari" } };

export default function TermsPage() {
  return (
    <>
      <PageHeader eyebrow="Yasal" title="Kullanım koşulları" />
      <Container className="py-16 pb-28">
        <Prose>
          <LegalDraftNotice />
          <ul>
            <li>Sitede gösterilen stok bilgileri tedarikçi verisinden alınır ve bilgi amaçlıdır; kesin stok teklif aşamasında doğrulanır.</li>
            <li>&quot;Örnek fiyat&quot; veya &quot;tahmini&quot; olarak işaretlenen tutarlar teklif niteliği taşımaz.</li>
            <li>Teklif talebi göndermek satın alma taahhüdü oluşturmaz; sipariş, yazılı teklifin onaylanmasıyla kesinleşir.</li>
            <li>Kit kompozisyon görselleri temsilidir.</li>
          </ul>
        </Prose>
      </Container>
    </>
  );
}
