import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { subirAssetHeyGen, crearPhotoAvatarHeyGen } from "@/lib/videos/heygen";

/**
 * Flujo completo "Photo Avatar" de HeyGen (v3): sube una foto, crea el
 * avatar y guarda el avatar_id resultante en twin_profiles.heygen_avatar_id
 * — la misma columna que usa el Digital Twin de vídeo, porque generar vídeo
 * (POST /v2/video/generate) funciona igual sea cual sea el origen del avatar.
 */
export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase no configurado" }, { status: 501 });

  const form = await req.formData();
  const ownerId = String(form.get("ownerId") ?? "");
  const ownerName = String(form.get("ownerName") ?? "MindTwin");
  const foto = form.get("foto");

  if (!ownerId || !(foto instanceof File)) {
    return NextResponse.json({ error: "Faltan ownerId o el archivo de foto." }, { status: 400 });
  }

  const buffer = Buffer.from(await foto.arrayBuffer());
  const asset = await subirAssetHeyGen(buffer, foto.name || "foto.jpg", foto.type || "image/jpeg");
  if (!asset.ok) return NextResponse.json({ error: asset.error }, { status: 502 });

  const avatar = await crearPhotoAvatarHeyGen(asset.assetId, `MindTwin · ${ownerName}`);
  if (!avatar.ok) return NextResponse.json({ error: avatar.error }, { status: 502 });

  const { data: existente } = await supabase
    .from("twin_profiles")
    .select("id")
    .eq("owner_id", ownerId)
    .is("follower_id", null)
    .maybeSingle();

  if (existente) {
    await supabase.from("twin_profiles").update({ heygen_avatar_id: avatar.avatarId }).eq("id", existente.id);
  } else {
    await supabase.from("twin_profiles").insert({ owner_id: ownerId, heygen_avatar_id: avatar.avatarId });
  }

  return NextResponse.json({ ok: true, avatarId: avatar.avatarId, assetUrl: asset.url });
}
