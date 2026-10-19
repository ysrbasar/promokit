import { KitsEditor } from "@/components/admin/KitsEditor";
import { RestoreKitButton } from "@/components/admin/RestoreKitButton";
import { getCatalog, getHiddenKits, getReadyKits, getSettings } from "@/lib/server/repositories";

export default async function AdminKits() {
  const [kits, { products }, settings, hidden] = await Promise.all([getReadyKits(), getCatalog(), getSettings(), getHiddenKits()]);
  return (
    <div className="max-w-5xl">
      <h1 className="text-4xl">Hazır kitler</h1>
      <p className="mt-2 text-sm text-muted">Kitler gerçek ürün kodlarına bağlanır. Stoğu yetersiz ürün sitede otomatik olarak benzer ürünle değiştirilir; katalogda olmayan kodlar öneri kuralıyla tamamlanır.</p>
      <p className="mt-2 rounded-soft border border-champagne/50 bg-champagne-light/30 px-4 py-3 text-sm">
        <strong>XML güncellemeleri:</strong> Tedarikçiye yeni eklenen kutulu setler otomatik olarak hazır kit olur. Buradan <strong>kaldırdığınız kitler gizli kalır</strong> ve XML her yenilendiğinde geri eklenmez. Düzenlediğiniz kitler de sizin halinizle korunur.
      </p>
      {hidden.length > 0 && (
        <details className="mt-4 rounded-card border border-line bg-paper p-4 text-sm">
          <summary className="cursor-pointer font-semibold">Kaldırılan kitler ({hidden.length})</summary>
          <ul className="mt-3 divide-y divide-line">
            {hidden.map((k) => (
              <li key={k.slug} className="flex items-center justify-between gap-3 py-2">
                <span>{k.name}</span>
                <RestoreKitButton slug={k.slug} />
              </li>
            ))}
          </ul>
        </details>
      )}
      <div className="mt-8">
        <KitsEditor initial={kits} products={products.map((p) => ({ code: p.productCode, name: p.name }))} budgetKeys={settings.budgetTiers.map((b) => ({ key: b.key, label: b.label }))} />
      </div>
    </div>
  );
}
