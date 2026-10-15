import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Prose } from "@/components/layout/Prose";
import { Container } from "@/components/ui/primitives";
import { getCatalog, getSettings } from "@/lib/server/repositories";

export const metadata: Metadata = { title: "Hakkımızda", alternates: { canonical: "/hakkimizda" } };
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const [{ info }, settings] = await Promise.all([getCatalog(), getSettings()]);
  return (
    <>
      <PageHeader eyebrow="Hakkımızda" title={<>Hediyeyi bir <em className="text-gold-deep">deneyime</em> dönüştürüyoruz</>} lead="Kurumsal hediye seçimini uzun katalog sayfalarından çıkarıp, birkaç soruyla ilerleyen, stoktaki gerçek ürünlere dayanan bir deneyime dönüştürüyoruz." />
      <Container className="py-16 pb-28">
        <Prose>
          <h2>Yaklaşımımız</h2>
          <p>Her kit bir amaca hizmet eder: yeni bir çalışanı karşılamak, bir müşteriye teşekkür etmek ya da bir etkinliği akılda kalıcı kılmak. Bu yüzden ürün listesiyle değil, ihtiyacınızla başlıyoruz.</p>
          <ul>
            <li>Öneriler yalnızca yeterli stoğu bulunan ürünlerden oluşturulur.</li>
            <li>Kaynağında doğrulanmamış fiyat, kesin fiyat gibi gösterilmez.</li>
            <li>Teslim tarihi ve baskı detayları tedarikçi onayıyla teklifte kesinleşir.</li>
          </ul>
          <h2 id="veri">Ürün verisi ve stok</h2>
          <p>
            Ürün kataloğu tedarikçi stok listesi, ürün web sitesi ve basılı katalogdan ürün kodu esas alınarak birleştirilir. Stok bilgisi her ürün için son güncelleme tarihiyle saklanır; varsayılan olarak yalnızca <strong>{settings.minStock} adet ve üzeri</strong> stoğu olan renk/varyantlar önerilir. Stok bilgisi bilinmeyen ürünlere stok garantisi verilmez.
          </p>
          {info.kind === "demo" ? (
            <p>
              <strong>Şu an gösterilen katalog örnek veridir.</strong> Gerçek tedarikçi kataloğu henüz içe aktarılmamıştır; ürün adları, stoklar ve fiyatlar arayüzü göstermek için temsili olarak hazırlanmıştır ve sipariş amacıyla kullanılamaz.
            </p>
          ) : (
            <p>Katalog son olarak {new Date(info.generatedAt).toLocaleString("tr-TR")} tarihinde güncellendi ({info.count} ürün).</p>
          )}
        </Prose>
      </Container>
    </>
  );
}
