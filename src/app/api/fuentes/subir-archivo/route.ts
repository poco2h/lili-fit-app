import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const BUCKET = "fuentes";

async function asegurarBucket(supabase: ReturnType<typeof getSupabaseAdmin>) {
  if (!supabase) return;
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((b) => b.name === BUCKET)) return;
  await supabase.storage.createBucket(BUCKET, { public: true });
}

/** Sube el archivo aportado al conectar una fuente (p.ej. el .txt exportado de WhatsApp) y devuelve su URL pública. */
export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase no configurado" }, { status: 501 });

  const form = await req.formData();
  const ownerId = String(form.get("ownerId") ?? "");
  const sourceKey = String(form.get("sourceKey") ?? "");
  const archivo = form.get("archivo");
  if (!ownerId || !sourceKey || !(archivo instanceof File)) {
    return NextResponse.json({ error: "Faltan ownerId, sourceKey o el archivo." }, { status: 400 });
  }

  await asegurarBucket(supabase);

  const ext = (archivo.name.split(".").pop() || "dat").toLowerCase();
  const path = `${ownerId}/${sourceKey}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, archivo, { contentType: archivo.type || "application/octet-stream" });

  if (uploadError) {
    return NextResponse.json({ error: `Error subiendo el archivo: ${uploadError.message}` }, { status: 500 });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ ok: true, url: data.publicUrl });
}
