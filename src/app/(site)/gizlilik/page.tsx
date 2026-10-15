import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { LegalDraftNotice, Prose } from "@/components/layout/Prose";
import { Container } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Gizlilik ve Çerezler", alternates: { canonical: "/gizlilik" } };

export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="Yasal" title="Gizlilik ve çerezler" />
      <Container className="py-16 pb-28">
        <Prose>
          <LegalDraftNotice />
          <h2>Tarayıcıda saklanan veriler</h2>
          <p>Oluşturduğunuz kitler, kayıtlı kitleriniz ve favorileriniz yalnızca kullandığınız tarayıcının yerel depolama alanında (localStorage) tutulur ve sunucularımıza gönderilmez. Tarayıcı verilerini temizlediğinizde bu bilgiler silinir.</p>
          <h2>Çerezler</h2>
          <p>Ziyaretçi tarafında izleme veya reklam çerezi kullanılmamaktadır. Yönetim paneli, yalnızca yetkili kullanıcılar için zorunlu bir oturum çerezi kullanır.</p>
          <h2>Teklif talepleri</h2>
          <p>Teklif formuyla gönderdiğiniz bilgiler <a href="/kvkk">KVKK Aydınlatma Metni</a>&apos;nde açıklanan şekilde işlenir.</p>
        </Prose>
      </Container>
    </>
  );
}
