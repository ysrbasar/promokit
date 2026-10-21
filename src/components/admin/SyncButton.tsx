"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/primitives";

/** startedAfter'dan sonra biten bir çalışma görünene kadar (en çok ~90 sn) durumu yoklar */
async function waitForSync(startedAfter: number): Promise<string> {
  for (let i = 0; i < 30; i++) {
    await new Promise((res) => setTimeout(res, 3_000));
    const s = (await fetch("/api/admin/sync").then((r) => r.json()).catch(() => null))?.status;
    if (s && !s.running && s.lastFinishedAt && Date.parse(s.lastFinishedAt) > startedAfter)
      return s.ok ? `Güncellendi · ${s.stats?.products ?? "?"} ürün` : `Hata: ${s.error}`;
  }
  return "Sonuç alınamadı; otomatik güncelleme 30 dakikada bir zaten çalışıyor.";
}

export function SyncButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        disabled={busy || disabled}
        onClick={async () => {
          setBusy(true);
          setMsg(null);
          try {
            const r = await fetch("/api/admin/sync", { method: "POST" }).catch(() => null);
            const d = r ? await r.json().catch(() => null) : null;
            if (r && d?.status) {
              setMsg(r.ok ? `Güncellendi · ${d.status.stats?.products ?? "?"} ürün` : `Hata: ${d.status.error ?? r.status}`);
            } else {
              // Yanıt gelmediyse (sunucu süre sınırı vb.) güncelleme sürüyor olabilir: durumu bir süre izle
              setMsg("Güncelleme sürüyor, sonuç bekleniyor…");
              setMsg(await waitForSync(Date.now() - 5_000));
            }
            router.refresh();
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Güncelleniyor… (1-2 dk)" : "Şimdi güncelle"}
      </Button>
      {msg && <span role="status" className="text-sm text-muted">{msg}</span>}
    </div>
  );
}
