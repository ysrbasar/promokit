# PromoKit — Premium kurumsal hediye kiti platformu

Kullanıcıların sorularla ya da katalogdan seçerek kurumsal hediye kiti oluşturduğu, hazır kitleri incelediği ve teklif istediği Next.js uygulaması. "PromoKit" bir çalışma adıdır; marka adı `src/components/layout/Logo.tsx` içinde değiştirilir.

> **Veri durumu (19.10.2026):** Katalog tek kaynaktan, ipromosyon.com XML beslemelerinden gelir: 1.161 ürün, 2.319 varyant, 263 ürün stokta, 898 ürün "Stokta yok" etiketiyle listelenir. 73 kutulu set var ve bunlardan 46 hazır kit üretildi. Müşteriye liste fiyatı (iskontosuz) "KDV hariç" notuyla gösterilir. Alış fiyatları yalnızca yönetim panelinde görünür.

## Hızlı başlangıç

En kolayı: Node.js 20+ kurulu bir bilgisayarda `kur.bat` (Windows) ya da `./kur.sh` (macOS/Linux) çalıştırın; site http://localhost:3000 adresinde açılır.

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

## Katalog: ipromosyon XML ve otomatik güncelleme

`.env` dosyasına tedarikçi anahtarını ekleyin. `kur.bat`, `kur.sh` ve `canli.bat` ilk çalıştırmada bunu sorar. **Anahtar depoya girmez.**

```
IPRO_XML_KEY=<anahtar>
IPRO_SYNC_MINUTES=30      # isteğe bağlı, en az 5
```

- Sunucu açıkken (`npm run dev` veya `npm start`), `src/instrumentation.ts` beslemeleri her `IPRO_SYNC_MINUTES` dakikada bir çeker. Veri eskimişse sunucu açılır açılmaz da çeker.
  - "hepsi" (`iproapi`) beslemesinden ürün, açıklama, liste fiyatı, minimum sipariş ve baskı yöntemleri gelir.
  - "stoklu" (`iproapi_cl`) beslemesinden varyant stoğu, gelecek stok ve varyant fiyatı gelir.
- Çıktılar:
  - `data/runtime/catalog.json` (müşteri kataloğu)
  - `data/runtime/synced-kits.json` (setlerden üretilen hazır kitler)
  - `data/private/costs.json` (**alış fiyatları**)
  - `data/runtime/sync-status.json`

  Bu dosyaların hepsi gitignore'dadır. Depodaki `data/catalog.json` ve `data/kits.json` başlangıç verisidir.
- Besleme hatalı ya da şüpheli derecede küçükse (50 üründen az) mevcut katalog korunur. Hata, yönetim panelinde gösterilir.
- **Yönetim → Katalog güncelleme** sayfası şunları gösterir:
  - tedarikçinin XML oluşturma tarihleri
  - son başarılı güncelleme ve sonraki planlı güncelleme
  - hata durumu
  - "Şimdi güncelle" düğmesi
- Komut satırından elle güncelleme: `npm run catalog:update` (yalnızca `data/runtime/` altına yazar) ya da `npm run catalog:update -- --seed` (ek olarak depodaki başlangıç verisini de yeniler).
- Stokta olmayan ürünler katalogda "Stokta yok" etiketiyle görünür, ancak kit önerilerine girmez. Katalogdaki "Yalnızca stokta olanlar" filtresi bunları gizler.

### Logo baskı fiyatları

- Fiyatlar tedarikçinin baskı fiyat sayfasından (ipromosyon.com/sayfa/baski-fiyatlari) alındı ve `src/lib/config/printPricing.ts` dosyasında tablo olarak tutuluyor.
- Hesap ürün grubuna, baskı yöntemine ve adede göre yapılıyor. Örneğin: "500 adede kadar sabit 750 TL, üzeri adet başı 1,50 TL". Gofre ve kademeli fiyatlar da dahil.
- Ürün sayfasında 100, 250, 500 ve 1000 adet için adet başı baskı fiyatı gösteriliyor.
- Kitte baskı yöntemi seçildiği anda tutar, kit adedine göre toplama ekleniyor.
- **Yönetim → Ayarlar → Logo baskı kâr payı (%)** müşteriye gösterilen baskı fiyatına eklenir. Teklifte baskının alış bedeli ve satış bedeli ayrı ayrı saklanır ve kâra yansır.
- Tedarikçi fiyat listesini güncellerse bu tablonun elle güncellenmesi gerekir; sayfa XML ile gelmiyor.

### Hazır kitler ve XML

- Tedarikçinin kutulu setleri otomatik olarak hazır kite dönüşür. Yeni setler her XML güncellemesinde kendiliğinden eklenir.
- **Yönetim → Hazır kitler** sayfasında bir kiti silersen o kit gizlenir ve XML yenilense de geri gelmez. Gizlenen kitler aynı sayfada "Kaldırılan kitler" altında listelenir; "Geri getir" ile geri alınabilir.
- Düzenlediğin kitler senin halinle korunur. Değiştirmediğin kitler XML'deki güncel bilgilerle yenilenmeye devam eder.
- Yönetici değişiklikleri `data/runtime/kit-state.json` dosyasında yalnızca farklar olarak tutulur: gizlenen kitlerin adresleri ve değiştirilen ya da eklenen kitler.

### Sepet (tekli sipariş)

- Her ürünün **Kitime ekle** ve **Sepete ekle** düğmesi var. Sepet `/sepet` sayfasındadır.
- Online ödeme yok: sepet, teklif formuyla sipariş talebi olarak gönderilir ve yönetim panelinde "Sepet siparişi" adıyla görünür.

### Kartla ödeme (Ödemeix)

- Sepette **Kartla öde** düğmesi var. Müşteri Ödemeix'in güvenli ödeme sayfasına yönlendirilir (3D Secure, taksit); kart bilgisi bu sunucudan hiç geçmez.
- Ödenecek tutar sunucuda, katalogdaki güncel fiyattan **KDV dahil** hesaplanır; istemcinin gönderdiği fiyata güvenilmez. Fiyatı olmayan, stoğu veya minimum adedi yetmeyen ürünle ödeme açılmaz.
- Sipariş yalnız imzalı webhook (HMAC-SHA256, 5 dakika zaman kontrolü, tekrar ayıklama) ya da Ödemeix durum sorgusu "başarılı" dediğinde **Ödendi** olur. Dönüş sayfasına gelinmesi tek başına yeterli değildir.
- **Yönetim → Siparişler** sayfası tahsilat toplamını, her siparişin geçmişini, **Durumu yenile** ve **Tam iade** düğmelerini içerir.
- Ödeme için `/mesafeli-satis` ön bilgilendirme ve sözleşme onayı gerekir. Bu metin bir taslaktır ve yayından önce hukuki kontrolden geçmelidir.
- Ayarlar (`.env`):
  - `ODEMEIX_SECRET_KEY` = `sk_test_…` veya `sk_live_…`
  - `ODEMEIX_WEBHOOK_SECRET` = `whsec_…`
  - `NEXT_PUBLIC_SITE_URL` = sitenin gerçek adresi (dönüş adresleri için)
  - Ödemeix panelinde webhook adresi: `https://<alan-adı>/api/odemeix/webhook`
- Webhook yalnız herkese açık HTTPS adrese gelir. Yerel kurulumda dönüş sayfası ödeme durumunu Ödemeix'ten sorgulayarak siparişi günceller.

### Kâr takibi

- Teklif kaydedilirken her satırın o anki liste fiyatı ve alış fiyatı teklife yazılır.
- **Teklifler** sayfası her teklif için ciro, alış, kâr ve marjı gösterir; "Kazanıldı" durumundaki teklifler ve açık teklifler için toplamları da verir.
- **Ürünler** tablosu liste fiyatını, alış fiyatını ve marjı gösterir.
- Hesap şu formülle yapılır: liste fiyatı × adet × kit adedi. KDV, baskı ve ambalaj dahil değildir.
- Alış fiyatları hiçbir genel API'ye veya sayfaya gönderilmez (`src/lib/server/costs.ts`).

### Veri kuralları (uygulanan)

| Kural | Nerede |
|---|---|
| Stok 0 → gösterilmez/önerilmez; 1–49 → varsayılan gizli; bilinmeyen stok ≠ 0, garanti verilmez | `src/lib/catalog/stock.ts` |
| Eşik yönetim panelinden değişir (varsayılan 50); varyant stokları ayrı | `src/lib/config/settings.ts`, `/admin/ayarlar` |
| Ürün kodu ana anahtar; varyantlar ana ürüne bağlanır; tekrar çalıştırma mükerrer üretmez | `src/lib/import/merge.ts` |
| Fiyat yalnızca kaynakta açıkça varsa "source" tipinde alınır; eksik fiyatla toplam hesaplanmaz | `src/lib/import/ipromosyon.ts`, `src/lib/catalog/pricing.ts` |
| Birden fazla ürüne atanmış görsel kullanılmaz → inceleme kuyruğu | `merge.ts` |
| Kaynaklar arası çelişki sessizce birleştirilmez → `sources` + `review-queue.json` | `merge.ts` |

## Netlify'da yayın

1. Netlify → **Add new site → Import an existing project → GitHub** → `ysrbasar/form360` deposu.
2. **Branch to deploy:** `claude/friendly-brown-ai3c25` · **Base directory:** `promokit` (gerisi `netlify.toml`'dan gelir).
3. **Site configuration → Environment variables** (hepsi "Functions" kapsamını içermeli):
   `STORAGE_DRIVER=blobs`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, `IPRO_XML_KEY`, `NEXT_PUBLIC_SITE_URL`
   ve ödeme için `ODEMEIX_SECRET_KEY`, `ODEMEIX_WEBHOOK_SECRET`.
4. Deploy. Ödemeix panelinde webhook adresi: `https://<alan-adı>/api/odemeix/webhook`.

Sunucusuz ortamda dosya sistemi kalıcı olmadığından `data/runtime` ve `data/private` altındaki her şey
(teklifler, yüklenen logolar, siparişler, ayarlar, güncel katalog, alış fiyatları) **Netlify Blobs**'a yazılır
(`src/lib/server/storage.ts`). Depodaki `data/catalog.json` ilk açılışta başlangıç kataloğu olarak kullanılır.
30 dakikalık XML güncellemesini `netlify/functions/catalog-sync.mts` zamanlanmış fonksiyonu yapar.

## Özellikler

- **Ana sayfa:** Parallax hero, 3 adımda kit, öne çıkan hazır kitler, kategoriler, bütçeye ve sektöre göre giriş, premium seçki, süreç, SSS.
- **Kit sihirbazı (`/kit-olustur`):** Prompt'taki 9 adımın tamamı. Kategori seçiminde dahil/hariç tutma ve logo yükleme var. Masaüstünde canlı özet, mobilde alt panel bulunur. Sonuç ekranında ürün değiştirme, çıkarma, adet ve renk düzenleme yapılabilir.
- **Öneri motoru:** Kural tabanlıdır, harici yapay zekâ kullanmaz (`src/lib/kit/recommendation.ts`). Stok uygunluğu bir puan değil, ön koşuldur. Kit adedi varyant stoğunu aşarsa ürün önerilmez. Bütçe aşılırsa ürünler sessizce pahalılaştırılmaz, daha uygun alternatifle değiştirilir.
- **Serbest katalog:** Ad ve ürün koduyla arama, kategori/renk/malzeme/stok filtreleri, sıralama ve sayfalama. Filtre durumu URL'de tutulur.
- **Hazır kitler:** 10 başlangıç kiti gerçek ürün kodlarına bağlıdır. Stoğu yetersiz ürün benzer ürünle değiştirilir; katalogda olmayan kod kitin kuralıyla tamamlanır.
- **Teklif akışı:** İki adımlıdır: kit kontrolü, ardından iletişim bilgileri. İstemci ve sunucu aynı Zod şemasıyla doğrulama yapar. Logo dosyasının türü ve boyutu sihirli baytlarla kontrol edilir. KVKK onayı ve ayrı pazarlama izni alınır. Kayıt `data/runtime/quotes/` altına yazılır.
- **Yönetim paneli:** Gerçek kimlik doğrulama kullanır: scrypt parola hash'i, HMAC imzalı httpOnly çerez, middleware ve her API'de ikinci kontrol, giriş denemesi sınırı. Panelden yapılabilenler: ürün aktif/pasif/öne çıkan/kategori, stok eşiği ve bütçe aralıkları, hazır kit düzenleyici, teklif listesi, durum ve teklif bazında kâr, katalog güncelleme durumu ve "Şimdi güncelle".
- **SEO:** Sitemap (örnek ürünler hariç), robots, canonical, Product ve FAQ JSON-LD. Yönetim sayfaları `noindex` alır.
- **Erişilebilirlik:** Klavye ile kullanılabilir, odak göstergeleri ve ARIA rolleri var, "hareketi azalt" tercihi desteklenir.

## Mimari

```
src/lib/catalog/      schema (Zod), stock (StockEligibilityService), search (ProductSearchService),
                      pricing (KitPricingService), enrich (sınıflandırma kuralları), lite (istemci görünümü)
src/lib/kit/          recommendation (KitRecommendationEngine), kitState (KitBuilderState, saf fonksiyonlar),
                      store (Zustand + localStorage), readyKits (hazır kit çözümleyici)
src/lib/import/       ipromosyon (XML ayrıştırıcı), sync (zamanlanmış güncelleme)
src/lib/server/       repositories (ProductRepository/ayarlar/kitler), quotes (QuoteService), jsonStore, views
src/lib/auth/         session (HMAC), password (scrypt), admin
scripts/catalog/      import-ipromosyon (npm run catalog:update), make-demo
data/                 demo-catalog.json, kits.json, catalog.json, runtime/ ve private/ (gitignore)
```

Kalıcı veriler JSON dosyalarında tutulur. Bu dosyalara erişim yalnızca `src/lib/server/repositories.ts` ve `quotes.ts` üzerinden yapılır; veritabanına geçişte değişmesi gereken tek katman budur.

## Test ve doğrulama

```bash
npm test           # 29 birim testi (prompt'taki 15 test + ayrıştırıcı + kimlik doğrulama)
npm run typecheck
npm run lint
npm run build
```

Bu oturumda son çalıştırma sonuçları: 27/27 test geçti; typecheck, lint ve üretim derlemesi temiz. Bunlara ek olarak Playwright ile tarayıcıda uçtan uca şu akışlar elle denendi: sihirbaz → öneri → ürün değiştirme → teklif (önce hatalı, sonra geçerli gönderim) → başarı; kodla arama; hazır kiti özelleştirme; 390 px mobil görünümde yatay taşma olmaması; üretim modunda yönetici girişi ve panel işlemleri. Bu uçtan uca testler depoya eklenmedi.

## Bilinen eksikler / yapılmayanlar

- 364 üründe beslemede fiyat yok. Bu ürünlerde fiyat "teklifte" olarak gösterilir ve kit toplamı hesaplanmaz.
- Ürün görselleri ipromosyon.com sunucusundan yüklenir; yerel kopya alınmaz.
- Yönetici hazır kitleri elle düzenlerse bu düzenleme, otomatik gelen setlerin yerine geçer.
- **E-posta/CRM entegrasyonu yok.** Teklifler yalnızca yönetim panelinde listelenir; başarı ekranı bunu açıkça belirtir.
- **Logo baskı önizlemesi yok.** Arayüzde de bu şekilde belirtilir.
- **Kalıcılık:** Teklifler, ayarlar ve yönetici düzenlemeleri dosya sistemine yazılır. Sunucusuz (serverless) ortamlarda kalıcı değildir. Tek sunuculu bir Node kurulumu (`npm run build && npm start`) kullanın ya da repository katmanını bir veritabanına bağlayın.
- Kullanıcı kitleri ve favoriler yalnızca tarayıcıda (localStorage) tutulur; sunucu hesabı yoktur.
- Yönetici çıkışı çerezi siler, ancak imzalı oturum süresi (8 saat) dolana kadar sunucu tarafında iptal listesi tutulmaz.
- KVKK, gizlilik ve kullanım koşulları **şablondur**; hukuki inceleme gerekir. Şirket ve iletişim bilgileri `NEXT_PUBLIC_*` ortam değişkenlerinden gelir.
- Görsel olmayan ürünlerde kategoriye özgü çizim gösterilir. Hero ve kit kompozisyonları temsilidir ve öyle etiketlenir.
