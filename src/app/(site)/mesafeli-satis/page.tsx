import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { LegalDraftNotice, Prose } from "@/components/layout/Prose";
import { Container } from "@/components/ui/primitives";
import { COMPANY } from "@/lib/site";

export const metadata: Metadata = { title: "Ön Bilgilendirme ve Mesafeli Satış Sözleşmesi", alternates: { canonical: "/mesafeli-satis" } };

const missing = <em>(tanımlanmadı — .env: NEXT_PUBLIC_COMPANY_NAME / _CONTACT_*)</em>;

/** 6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği çerçevesinde TASLAK metin; yayın öncesi hukuki kontrol gerekir. */
export default function DistanceSalesPage() {
  return (
    <>
      <PageHeader eyebrow="Yasal" title="Ön bilgilendirme ve mesafeli satış sözleşmesi" />
      <Container className="py-16 pb-28">
        <Prose>
          <LegalDraftNotice />
          <h2>1. Satıcı</h2>
          <ul>
            <li>Ünvan: {COMPANY.name ?? missing}</li>
            <li>Adres: {COMPANY.address ?? missing}</li>
            <li>Telefon: {COMPANY.phone ?? missing}</li>
            <li>E-posta: {COMPANY.email ?? missing}</li>
          </ul>
          <h2>2. Konu</h2>
          <p>Bu sözleşme, alıcının internet sitesi üzerinden sepetine ekleyip kartla ödediği ürünlerin satışı ve teslimine ilişkin tarafların hak ve yükümlülüklerini düzenler. Ürünlerin adı, seçeneği, adedi, KDV dahil birim ve toplam fiyatı ödeme öncesinde sepet ve ödeme sayfasında gösterilir; ödeme onaylandığında sipariş özeti e-posta adresine gönderilir.</p>
          <h2>3. Ödeme</h2>
          <p>Ödeme, Ödemeix altyapısının güvenli ödeme sayfasında 3D Secure ile alınır; kart bilgileri satıcının sistemlerinde saklanmaz. Taksit seçenekleri ve varsa vade farkı ödeme sayfasında, onaydan önce gösterilir.</p>
          <h2>4. Teslimat</h2>
          <p>Stokta bulunan ürünler, ödemenin onaylanmasından sonra en geç 30 gün içinde alıcının bildirdiği adrese teslim edilir. Tahmini teslim tarihi sipariş onayında bildirilir.</p>
          <h2>5. Cayma hakkı</h2>
          <p>Tüketici sıfatıyla alışveriş yapan alıcı, ürünü teslim aldığı tarihten itibaren 14 gün içinde gerekçe göstermeden cayma hakkını kullanabilir; cayma bildiriminin ulaşmasından itibaren 14 gün içinde ödeme aynı yöntemle iade edilir. Alıcının istekleri doğrultusunda kişiselleştirilen (logo baskılı, isme özel) ürünlerde Mesafeli Sözleşmeler Yönetmeliği m.15 gereği cayma hakkı kullanılamaz. Ticari amaçla (kurum adına) yapılan alımlar tüketici işlemi sayılmaz.</p>
          <h2>6. Uyuşmazlık</h2>
          <p>Tüketici şikâyetleri için yürürlükteki parasal sınırlar dahilinde Tüketici Hakem Heyetlerine, sınırı aşan uyuşmazlıklarda Tüketici Mahkemelerine başvurulabilir.</p>
          <p>Alıcı, ödeme öncesinde bu ön bilgilendirmeyi okuduğunu ve sözleşmeyi elektronik ortamda onayladığını kabul eder.</p>
        </Prose>
      </Container>
    </>
  );
}
