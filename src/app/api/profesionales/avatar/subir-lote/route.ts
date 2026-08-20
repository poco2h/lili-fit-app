import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Sube UNA foto del lote de entrenamiento del Soul ID al bucket "avatars"
 * y devuelve su URL pública — a diferencia de /avatar/subir, no toca
 * twin_profiles (el avatar final se fija en /avatar/guardar-foto una vez
 * generada la foto realista con el Soul ya entrenado).
 */
export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase no configurado" }, { status: 501 });

  const form = await req.formData();
  const ownerId = String(form.get("ownerId") ?? "");
  const foto = form.get("foto");
  if (!ownerId || !(foto instanceof File)) {
    return NextResponse.json({ error: "Faltan ownerId o el archivo de foto." }, { status: 400 });
  }

  const ext = (foto.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${ownerId}/soul/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, foto, { contentType: foto.type || "image/jpeg" });

  if (uploadError) {
    return NextResponse.json({ error: `Error subiendo la foto: ${uploadError.message}` }, { status: 500 });
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return NextResponse.json({ ok: true, url: data.publicUrl });
}
