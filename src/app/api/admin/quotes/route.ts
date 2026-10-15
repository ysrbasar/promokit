import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { QUOTE_STATUSES } from "@/lib/quote/schema";
import { QuoteError, updateQuoteStatus } from "@/lib/server/quotes";

const Body = z.object({ id: z.string(), status: z.enum(QUOTE_STATUSES) });

export async function PATCH(req: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  try {
    await updateQuoteStatus(parsed.data.id, parsed.data.status);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof QuoteError) return NextResponse.json({ error: e.message }, { status: 404 });
    throw e;
  }
}
