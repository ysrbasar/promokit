import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { SettingsSchema } from "@/lib/config/settings";
import { saveSettings } from "@/lib/server/repositories";

export async function PUT(req: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const parsed = SettingsSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz ayar" }, { status: 422 });
  return NextResponse.json({ settings: await saveSettings(parsed.data) });
}
