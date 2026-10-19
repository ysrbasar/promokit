import { SyncButton } from "@/components/admin/SyncButton";
import { SyncStatusCard } from "@/components/admin/SyncStatusCard";
import { readSyncStatus, syncConfigured } from "@/lib/import/sync";
import { getCatalog } from "@/lib/server/repositories";

export default async function AdminCatalogSync() {
  const [status, { products }] = await Promise.all([readSyncStatus(), getCatalog()]);
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
