"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/primitives";

export function OrderActions({ id, canRefund }: { id: string; canRefund: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const run = async (action: "refresh" | "refund") => {
    if (action === "refund" && !confirm("Ödemenin tamamı karta iade edilecek. Emin misiniz?")) return;
    setBusy(true);
    setMsg(null);
    const r = await fetch(`/api/admin/orders/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    const d = await r.json().catch(() => ({}));
    setMsg(r.ok ? "Güncellendi" : (d.error ?? "Hata"));
    setBusy(false);
    router.refresh();
  };
  return (
    <span className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" disabled={busy} onClick={() => run("refresh")}>
        Durumu yenile
      </Button>
      {canRefund && (
        <Button size="sm" variant="ghost" className="text-danger" disabled={busy} onClick={() => run("refund")}>
          Tam iade
        </Button>
      )}
      {msg && <span className="text-xs text-muted">{msg}</span>}
    </span>
  );
}
