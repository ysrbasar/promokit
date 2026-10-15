import { NextResponse } from "next/server";
import { QuoteRequestSchema } from "@/lib/quote/schema";
import { QuoteError, createQuote } from "@/lib/server/quotes";

/** POST /api/quotes (multipart/form-data: payload=JSON, attachment=dosya) */
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  let payload: unknown;
  try {
    payload = JSON.parse(String(form.get("payload") ?? ""));
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  const parsed = QuoteRequestSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[i.path.join(".")] ??= i.message;
    return NextResponse.json({ error: "Lütfen işaretli alanları kontrol edin", fieldErrors }, { status: 422 });
  }
  const file = form.get("attachment");
  try {
    const q = await createQuote(parsed.data, file instanceof File ? file : null);
    return NextResponse.json({ id: q.id }, { status: 201 });
  } catch (e) {
    if (e instanceof QuoteError) {
      return NextResponse.json({ error: e.message, fieldErrors: e.field ? { [e.field]: e.message } : {} }, { status: 422 });
    }
    console.error("[teklif]", e);
    return NextResponse.json({ error: "Talebiniz kaydedilemedi. Lütfen tekrar deneyin." }, { status: 500 });
  }
}
