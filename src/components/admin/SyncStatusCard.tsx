import type { SyncStatus } from "@/lib/import/sync";

const fmt = (t: string | null | undefined) => (t ? new Date(t).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" }) : "—");

export function SyncStatusCard({ status, configured }: { status: SyncStatus; configured: boolean }) {
  const rows: [string, string][] = [
    ["Tedarikçi ürün listesi tarihi", fmt(status.feeds?.all.generatedAt)],
    ["Tedarikçi stok listesi tarihi", fmt(status.feeds?.stock.generatedAt)],
    ["Son başarılı güncelleme", fmt(status.lastSuccessAt)],
    ["Son deneme", fmt(status.lastFinishedAt)],
    ["Sonraki otomatik güncelleme", configured ? fmt(status.nextRunAt) : "Kapalı (IPRO_XML_KEY yok)"],
    ["Güncelleme aralığı", `${status.intervalMinutes} dakika`],
  ];
  return (
    <div className="rounded-card border border-line bg-paper p-6 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-semibold">Katalog güncelleme (ipromosyon XML)</p>
        {status.running ? (
          <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs text-warning">çalışıyor</span>
        ) : status.ok === true ? (
          <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">başarılı</span>
        ) : status.ok === false ? (
          <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs text-danger">hata</span>
        ) : (
          <span className="rounded-full bg-stone px-2 py-0.5 text-xs text-muted">henüz çalışmadı</span>
        )}
      </div>
      {status.error && <p className="mt-2 text-danger">{status.error} — mevcut katalog korunuyor.</p>}
      <dl className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 border-b border-line py-1.5">
            <dt className="text-muted">{k}</dt>
            <dd className="text-right">{v}</dd>
          </div>
        ))}
      </dl>
      {status.stats && (
        <p className="mt-4 text-xs text-muted">
          {status.stats.products} ürün · {status.stats.variants} varyant · {status.stats.inStock} stokta · {status.stats.outOfStock} stokta yok · {status.stats.sets} set · {status.stats.withPrice} fiyatlı
        </p>
      )}
    </div>
  );
}
