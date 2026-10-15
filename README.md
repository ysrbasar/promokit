# Maison Kit — Premium kurumsal hediye kiti platformu

Kullanıcıların sorularla ya da katalogdan seçerek kurumsal hediye kiti oluşturduğu, hazır kitleri incelediği ve teklif istediği Next.js uygulaması. "Maison Kit" bir çalışma adıdır; marka adı `src/components/layout/Logo.tsx` içinde değiştirilir.

> **Önemli — veri durumu:** Geliştirme ortamının ağ politikası `prmstk.com`, `promosyonfirma.com` ve `promosyonkit.com` alan adlarına erişimi engelledi. Bu yüzden **gerçek katalog bu depoda içe aktarılmadı.** Uygulama şu an `data/demo-catalog.json` içindeki **örnek veriyle** çalışır. Örnek ürünlerin kodları `DEMO-` önekiyle başlar, fiyatları "örnek fiyat" olarak etiketlenir ve görselleri yoktur. Sitenin altında da kalıcı bir "Örnek veri" şeridi görünür. Veri toplama araçları hazırdır ve kaynaklara erişimi olan bir makinede aşağıdaki adımlarla çalıştırılmalıdır.

## Hızlı başlangıç

```bash
cd promokit
npm install
npm run dev            # http://localhost:3000
```

Yönetim paneli (`/admin`) için:

```bash
npm run admin:hash -- "en-az-10-karakterli-parola"   # çıktıyı .env dosyasına yapıştırın
npm run dev
```

## Gerçek kataloğu içe aktarma

Kaynaklara erişimi olan bir makinede, sırasıyla:

```bash
npm run scrape:inspect   # 1) 2.html ve birkaç sayfanın yapısını incele → data/import/prmstk-inspect.json
npm run scrape           # 2) 2.html … 264.html (kaldığı yerden devam eder, başarısız sayfaları raporlar)
npm run site:crawl       # 3) promosyonfirma.com ürün detayları (sitemap + JSON-LD)
npm run pdf:index        # 4) 2027 PDF kataloğu: ürün kodu → sayfa indeksi (sayfa grupları halinde)
npm run catalog:build    # 5) birleştir → data/catalog.json + data/import/report.json
npm run catalog:report   #    doğrulama raporunu yeniden yazdır
```

- **1. adım zorunludur.** Ayrıştırıcı üç strateji dener: yapılandırılmış seçiciler, başlık satırı tanınan tablolar ve "Stok:" etiketli bloklar. Gerçek sayfa yapısı görülemediği için tanınmayan bir yapı olabilir. O durumda `data/import/prmstk.config.json` içine `selectors` tanımlayın (alan listesi: `src/lib/import/prmstkParser.ts` → `ParserConfig`). Ayrıştırıcı hiçbir şey bulamazsa sayfayı `empty` olarak raporlar; veri uydurmaz.
- `data/catalog.json` oluştuğu anda uygulama otomatik olarak gerçek kataloğa geçer, örnek veri şeridi de kaybolur. Yeniden derleme gerekmez.
- `catalog:build -- --download-images` görselleri `public/products/<kod>/` altına indirir. **Bunu yalnızca kaynak sitenin görsellerin yeniden barındırılmasına izin verdiği doğrulandıktan sonra kullanın.** Varsayılan davranış kaynak URL'sini kullanmaktır.
- Robots.txt'e uyulur, istekler arasında 1,2–1,5 sn beklenir, hatalı istekler üstel geri çekilmeyle yeniden denenir. `--offline` ile ham HTML önbelleğinden ağ kullanmadan yeniden ayrıştırma yapılır.

### Veri kuralları (uygulanan)

| Kural | Nerede |
|---|---|
| Stok 0 → gösterilmez/önerilmez; 1–49 → varsayılan gizli; bilinmeyen stok ≠ 0, garanti verilmez | `src/lib/catalog/stock.ts` |
| Eşik yönetim panelinden değişir (varsayılan 50); varyant stokları ayrı | `src/lib/config/settings.ts`, `/admin/ayarlar` |
| Ürün kodu ana anahtar; varyantlar ana ürüne bağlanır; tekrar çalıştırma mükerrer üretmez | `src/lib/import/merge.ts` |
| Fiyat yalnızca kaynakta açıkça varsa "source" tipinde alınır; eksik fiyatla toplam hesaplanmaz | `merge.ts`, `src/lib/catalog/pricing.ts` |
| Birden fazla ürüne atanmış görsel kullanılmaz → inceleme kuyruğu | `merge.ts` |
| Kaynaklar arası çelişki sessizce birleştirilmez → `sources` + `review-queue.json` | `merge.ts` |

## Özellikler

- **Ana sayfa:** Parallax hero, 3 adımda kit, öne çıkan hazır kitler, kategoriler, bütçeye ve sektöre göre giriş, premium seçki, süreç, SSS.
- **Kit sihirbazı (`/kit-olustur`):** Prompt'taki 9 adımın tamamı. Kategori seçiminde dahil/hariç tutma ve logo yükleme var. Masaüstünde canlı özet, mobilde alt panel bulunur. Sonuç ekranında ürün değiştirme, çıkarma, adet ve renk düzenleme yapılabilir.
- **Öneri motoru:** Kural tabanlıdır, harici yapay zekâ kullanmaz (`src/lib/kit/recommendation.ts`). Stok uygunluğu bir puan değil, ön koşuldur. Kit adedi varyant stoğunu aşarsa ürün önerilmez. Bütçe aşılırsa ürünler sessizce pahalılaştırılmaz, daha uygun alternatifle değiştirilir.
- **Serbest katalog:** Ad ve ürün koduyla arama, kategori/renk/malzeme/stok filtreleri, sıralama ve sayfalama. Filtre durumu URL'de tutulur.
- **Hazır kitler:** 10 başlangıç kiti gerçek ürün kodlarına bağlıdır. Stoğu yetersiz ürün benzer ürünle değiştirilir; katalogda olmayan kod kitin kuralıyla tamamlanır.
- **Teklif akışı:** İki adımlıdır: kit kontrolü, ardından iletişim bilgileri. İstemci ve sunucu aynı Zod şemasıyla doğrulama yapar. Logo dosyasının türü ve boyutu sihirli baytlarla kontrol edilir. KVKK onayı ve ayrı pazarlama izni alınır. Kayıt `data/runtime/quotes/` altına yazılır.
- **Yönetim paneli:** Gerçek kimlik doğrulama kullanır: scrypt parola hash'i, HMAC imzalı httpOnly çerez, middleware ve her API'de ikinci kontrol, giriş denemesi sınırı. Panelden yapılabilenler: ürün aktif/pasif/öne çıkan/kategori, stok eşiği ve bütçe aralıkları, hazır kit düzenleyici, teklif listesi ve durum, veri kalitesi raporu, eksik görseller, inceleme kuyruğu.
- **SEO:** Sitemap (örnek ürünler hariç), robots, canonical, Product ve FAQ JSON-LD. Yönetim sayfaları `noindex` alır.
- **Erişilebilirlik:** Klavye ile kullanılabilir, odak göstergeleri ve ARIA rolleri var, "hareketi azalt" tercihi desteklenir.

## Mimari

```
src/lib/catalog/      schema (Zod), stock (StockEligibilityService), search (ProductSearchService),
                      pricing (KitPricingService), enrich (sınıflandırma kuralları), lite (istemci görünümü)
src/lib/kit/          recommendation (KitRecommendationEngine), kitState (KitBuilderState, saf fonksiyonlar),
                      store (Zustand + localStorage), readyKits (hazır kit çözümleyici)
src/lib/import/       prmstkParser, siteParser, parseValues, merge (CatalogImportService)
src/lib/server/       repositories (ProductRepository/ayarlar/kitler), quotes (QuoteService), jsonStore, views
src/lib/auth/         session (HMAC), password (scrypt), admin
scripts/catalog/      scrape-prmstk, crawl-promosyonfirma, pdf-index, build-catalog, report, make-demo
data/                 demo-catalog.json, kits.json, (catalog.json), import/, runtime/ (gitignore)
```

Kalıcı veriler JSON dosyalarında tutulur. Bu dosyalara erişim yalnızca `src/lib/server/repositories.ts` ve `quotes.ts` üzerinden yapılır; veritabanına geçişte değişmesi gereken tek katman budur.

## Test ve doğrulama

```bash
npm test           # 29 birim testi (prompt'taki 15 test + ayrıştırıcı + kimlik doğrulama)
npm run typecheck
npm run lint
npm run build
```

Bu oturumda son çalıştırma sonuçları: 29/29 test geçti; typecheck, lint ve üretim derlemesi temiz. Bunlara ek olarak Playwright ile tarayıcıda uçtan uca şu akışlar elle denendi: sihirbaz → öneri → ürün değiştirme → teklif (önce hatalı, sonra geçerli gönderim) → başarı; kodla arama; hazır kiti özelleştirme; 390 px mobil görünümde yatay taşma olmaması; üretim modunda yönetici girişi ve panel işlemleri. Bu uçtan uca testler depoya eklenmedi.

## Bilinen eksikler / yapılmayanlar

- **Gerçek katalog içe aktarılmadı** (ağ erişimi yok). Ayrıştırıcı test fixture'ları olası sayfa yapılarını temsil eder; gerçek `prmstk.com` yapısına karşı doğrulanmadı.
- PDF'ten **OCR ve görsel kırpma uygulanmadı.** Yalnızca metin katmanından kod → sayfa indeksi çıkarılır; metinsiz sayfalar `ocrNeeded` olarak raporlanır.
- **E-posta/CRM entegrasyonu yok.** Teklifler yalnızca yönetim panelinde listelenir; başarı ekranı bunu açıkça belirtir.
- **Logo baskı önizlemesi yok.** Arayüzde de bu şekilde belirtilir.
- **Kalıcılık:** Teklifler, ayarlar ve yönetici düzenlemeleri dosya sistemine yazılır. Sunucusuz (serverless) ortamlarda kalıcı değildir. Tek sunuculu bir Node kurulumu (`npm run build && npm start`) kullanın ya da repository katmanını bir veritabanına bağlayın.
- Kullanıcı kitleri ve favoriler yalnızca tarayıcıda (localStorage) tutulur; sunucu hesabı yoktur.
- Yönetici çıkışı çerezi siler, ancak imzalı oturum süresi (8 saat) dolana kadar sunucu tarafında iptal listesi tutulmaz.
- KVKK, gizlilik ve kullanım koşulları **şablondur**; hukuki inceleme gerekir. Şirket ve iletişim bilgileri `NEXT_PUBLIC_*` ortam değişkenlerinden gelir.
- Görsel olmayan ürünlerde kategoriye özgü çizim gösterilir. Hero ve kit kompozisyonları temsilidir ve öyle etiketlenir.
