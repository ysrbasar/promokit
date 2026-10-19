import Link from "next/link";
import { ProfitSummary } from "@/components/admin/ProfitSummary";
import { SyncStatusCard } from "@/components/admin/SyncStatusCard";
import { isProductEligible } from "@/lib/catalog/stock";
import { readSyncStatus, syncConfigured } from "@/lib/import/sync";
import { sumProfits } from "@/lib/quote/profit";
import { getCatalog, getReadyKits, getSettings } from "@/lib/server/repositories";
import { listQuotesWithProfit } from "@/lib/server/quotes";

export default async function AdminHome() {
  const [{ products, info }, settings, rows, kits, sync] = await Promise.all([getCatalog(), getSettings(), listQuotesWithProfit(), getReadyKits(), readSyncStatus()]);
  const quotes = rows.map((r) => r.quote);
  const won = sumProfits(rows.filter((r) => r.quote.status === "won").map((r) => r.profit));
  const stats = [
    ["Katalog kaynağı", info.kind === "demo" ? "ÖRNEK VERİ" : "İçe aktarılan", info.kind === "demo" ? "Gerçek katalog içe aktarılmadı" : new Date(info.generatedAt).toLocaleString("tr-TR")],
    ["Toplam ürün", String(products.length), `${products.filter((p) => !p.isActive).length} pasif`],
    ["Stokta", String(products.filter((p) => (p.stockQuantity ?? 0) > 0).length), `${products.filter((p) => isProductEligible(p, settings.minStock)).length} ürün ${settings.minStock}+ adet eşiğini geçiyor`],
    ["Stokta yok", String(products.filter((p) => p.stockStatus === "out").length), "sitede \"Stokta yok\" etiketiyle"],
    ["Görseli olmayan", String(products.filter((p) => !p.imageOriginalUrl && !p.localImagePath).length), ""],
    ["Hazır kit", String(kits.length), ""],
    ["Yeni teklif talebi", String(quotes.filter((q) => q.status === "new").length), `toplam ${quotes.length}`],
  ];
  return (
    <div>
      <h1 className="text-4xl">Genel bakış</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(([k, v, s]) => (
          <div key={k} className="rounded-card border border-line bg-paper p-6">
            <p className="text-xs text-muted">{k}</p>
            <p className="mt-2 font-display text-4xl">{v}</p>
            {s && <p className="mt-1 text-xs text-subtle">{s}</p>}
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div>
          <ProfitSummary title="Kazanılan tekliflerden kâr" profits={won} />
          <Link href="/admin/teklifler" className="mt-3 inline-block text-sm underline decoration-champagne underline-offset-4">Teklif bazında kâr</Link>
        </div>
        <div>
          <SyncStatusCard status={sync} configured={syncConfigured()} />
          <Link href="/admin/veri" className="mt-3 inline-block text-sm underline decoration-champagne underline-offset-4">Katalog güncelleme</Link>
        </div>
      </div>
      <p className="mt-8 text-xs text-muted">E-posta/CRM entegrasyonu yapılandırılmadı: teklif talepleri yalnızca bu panelde listelenir.</p>
    </div>
  );
}
