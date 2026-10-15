"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/primitives";

export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
        setBusy(false);
        if (r.ok) {
          router.replace("/admin");
          router.refresh();
        } else setError(((await r.json().catch(() => ({}))) as { error?: string }).error ?? "Giriş başarısız");
      }}
    >
      {!configured && (
        <p role="note" className="rounded-soft bg-warning/10 p-3 text-sm text-warning">
          Yönetici girişi yapılandırılmadı. <code>npm run admin:hash -- &quot;parola&quot;</code> çıktısını <code>.env</code> dosyasına ekleyip sunucuyu yeniden başlatın.
        </p>
      )}
      <label className="block text-sm font-medium" htmlFor="pw">
        Parola
      </label>
      <input id="pw" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 w-full rounded-soft border border-line-strong bg-paper px-4" />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={busy || !configured}>
        {busy ? "Kontrol ediliyor…" : "Giriş yap"}
      </Button>
    </form>
  );
}
