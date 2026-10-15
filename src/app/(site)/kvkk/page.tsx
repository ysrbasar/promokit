import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { LegalDraftNotice, Prose } from "@/components/layout/Prose";
import { Container } from "@/components/ui/primitives";
import { COMPANY } from "@/lib/site";

export const metadata: Metadata = { title: "KVKK Aydınlatma Metni", alternates: { canonical: "/kvkk" } };

export default function KvkkPage() {
  const name = COMPANY.name ?? "[Şirket unvanı]";
  return (
    <>
      <PageHeader eyebrow="Yasal" title="KVKK Aydınlatma Metni" />
      <Container className="py-16 pb-28">
        <Prose>
          <LegalDraftNotice />
          <p>6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca veri sorumlusu sıfatıyla {name}, teklif talebi formu aracılığıyla paylaştığınız kişisel verileri aşağıda açıklanan kapsamda işlemektedir.</p>
          <h2>İşlenen kişisel veriler</h2>
          <ul>
            <li>Kimlik ve iletişim: ad soyad, firma adı, e-posta, telefon, teslimat şehri</li>
            <li>Talep bilgileri: kit içeriği, adetler, teslim tarihi tercihi, açıklamalar, yüklediğiniz logo/dosya</li>
            <li>İşlem güvenliği: talep tarihi ve teknik kayıtlar</li>
          </ul>
          <h2>İşleme amaçları ve hukuki sebepler</h2>
          <p>Verileriniz; teklif talebinizin değerlendirilmesi, size teklif sunulması ve iletişime geçilmesi amaçlarıyla, KVKK m.5/2-c (bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması) ve m.5/2-f (meşru menfaat) hukuki sebeplerine dayanılarak işlenir. Pazarlama iletileri yalnızca ayrıca vereceğiniz açık rızaya dayanılarak gönderilir.</p>
          <h2>Aktarım</h2>
          <p>Verileriniz, teklifin hazırlanması için gerekli olduğu ölçüde ürün tedarikçileri, baskı ve lojistik hizmet sağlayıcılarıyla paylaşılabilir. [Yurt dışına aktarım ve barındırma sağlayıcısı bilgisi eklenmelidir.]</p>
          <h2>Saklama süresi</h2>
          <p>[Saklama süresi şirket politikanıza göre belirtilmelidir.]</p>
          <h2>Haklarınız</h2>
          <p>KVKK m.11 kapsamındaki haklarınızı kullanmak için {COMPANY.email ?? "[başvuru e-posta adresi]"} adresine başvurabilirsiniz.</p>
        </Prose>
      </Container>
    </>
  );
}
