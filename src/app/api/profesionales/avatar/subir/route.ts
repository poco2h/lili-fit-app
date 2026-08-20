import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Sube la foto de referencia del owner al bucket público "avatars" y guarda
 * la URL pública en twin_profiles.avatar_soul_id (reutilizado como URL de
 * foto — Higgsfield todavía no documenta una API de "Soul" real, solo
 * image2video/text2image, así que hoy es la imagen que alimenta esos
 * modelos, ver src/lib/videos/pipeline.ts).
 */
export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase no está configurado en este entorno." }, { status: 501 });
  }

  const form = await req.formData();
  const ownerId = String(form.get("ownerId") ?? "");
  const foto = form.get("foto");

  if (!ownerId || !(foto instanceof File)) {
    return NextResponse.json({ error: "Faltan ownerId o el archivo de foto." }, { status: 400 });
  }

  const ext = (foto.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${ownerId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, foto, { contentType: foto.type || "image/jpeg", upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: `Error subiendo la foto: ${uploadError.message}` }, { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = publicUrlData.publicUrl;

  const { data: existente } = await supabase
    .from("twin_profiles")
    .select("id")
    .eq("owner_id", ownerId)
    .is("follower_id", null)
    .maybeSingle();

  if (existente) {
    await supabase.from("twin_profiles").update({ avatar_soul_id: avatarUrl }).eq("id", existente.id);
  } else {
    await supabase.from("twin_profiles").insert({ owner_id: ownerId, avatar_soul_id: avatarUrl });
  }

  return NextResponse.json({ ok: true, avatarUrl });
}
