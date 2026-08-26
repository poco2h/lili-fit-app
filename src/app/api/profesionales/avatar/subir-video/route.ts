import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/** Sube el vídeo de 15-20s leyendo el guion (origen del avatar) al bucket "avatars" y devuelve su URL pública. */
export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase no configurado" }, { status: 501 });

  const form = await req.formData();
  const ownerId = String(form.get("ownerId") ?? "");
  const video = form.get("video");
  if (!ownerId || !(video instanceof File)) {
    return NextResponse.json({ error: "Faltan ownerId o el archivo de vídeo." }, { status: 400 });
  }

  const ext = (video.name.split(".").pop() || "mp4").toLowerCase();
  const path = `${ownerId}/video/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, video, { contentType: video.type || "video/mp4" });

  if (uploadError) {
    return NextResponse.json({ error: `Error subiendo el vídeo: ${uploadError.message}` }, { status: 500 });
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return NextResponse.json({ ok: true, url: data.publicUrl });
}
