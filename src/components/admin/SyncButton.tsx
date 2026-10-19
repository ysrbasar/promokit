"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/primitives";

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
            const r = await fetch("/api/admin/sync", { method: "POST" });
            const d = await r.json().catch(() => ({}));
            setMsg(r.ok ? `Güncellendi · ${d.status?.stats?.products ?? "?"} ürün` : `Hata: ${d.status?.error ?? d.error ?? r.status}`);
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
