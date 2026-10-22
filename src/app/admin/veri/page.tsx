import { SyncButton } from "@/components/admin/SyncButton";
import { SyncStatusCard } from "@/components/admin/SyncStatusCard";
import { readSyncStatus, syncConfigured } from "@/lib/import/sync";
import { getCatalog } from "@/lib/server/repositories";

export default async function AdminCatalogSync() {
  const [status, { products, info }] = await Promise.all([readSyncStatus(), getCatalog()]);
  const prm = products.filter((p) => p.supplier === "prmstk");
  const configured = syncConfigured();
  const noImage = products.filter((p) => !p.imageOriginalUrl && !p.localImagePath);
  const noPrice = products.filter((p) => p.price === null);
  return (
    <div>
      <h1 className="text-4xl">Katalog güncelleme</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Ürünler, stoklar ve fiyatlar ipromosyon XML beslemesinden otomatik olarak yenilenir. Hata olursa son çalışan katalog korunur. Alış fiyatları yalnızca bu panelde görünür.
      </p>
      <div className="mt-6">
        <SyncButton disabled={!configured || status.running} />
        {!configured && <p className="mt-2 text-sm text-warning">.env dosyasına IPRO_XML_KEY eklenmeden otomatik güncelleme çalışmaz.</p>}
      </div>
      <div className="mt-6">
        <SyncStatusCard status={status} configured={configured} />
      </div>
      <div className="mt-6 rounded-card border border-line bg-paper p-6 text-sm">
        <p className="font-semibold">İkinci tedarikçi: prmstk.com</p>
        <p className="mt-2 text-muted">
          {info.suppliers.prmstk} ürün · {prm.filter((p) => (p.stockQuantity ?? 0) > 0).length} stokta · {prm.filter((p) => p.price !== null).length} fiyatlı
          {info.suppliers.prmstkGeneratedAt && <> · veri tarihi {new Date(info.suppliers.prmstkGeneratedAt).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" })}</>}
        </p>
        <p className="mt-2 text-xs text-muted">
          prmstk sitesinden tarama ile alınır; alış fiyatı içermediği için bu ürünlerde kâr hesaplanmaz. Otomatik değil, istek üzerine güncellenir (npm run catalog:prmstk). Ürünler sayfasındaki &quot;Kaynak&quot; sütunundan ayırt edilir.
        </p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-card border border-line bg-paper p-6 text-sm">
          <p className="font-semibold">Görseli olmayan ürünler ({noImage.length})</p>
          <p className="mt-2 text-xs text-muted">{noImage.slice(0, 30).map((p) => p.productCode).join(", ") || "—"}</p>
        </div>
        <div className="rounded-card border border-line bg-paper p-6 text-sm">
          <p className="font-semibold">Fiyatı olmayan ürünler ({noPrice.length})</p>
          <p className="mt-2 text-xs text-muted">Müşteriye &quot;Fiyat teklifte&quot; olarak gösterilir. {noPrice.slice(0, 30).map((p) => p.productCode).join(", ")}</p>
        </div>
      </div>
    </div>
  );
}
