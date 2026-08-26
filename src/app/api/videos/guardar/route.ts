import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/** Persiste un vídeo ya generado — antes solo vivía en memoria de la página y se perdía al recargar. */
export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase no configurado" }, { status: 501 });

  const body = await req.json();
  const ownerId = String(body?.ownerId ?? "");
  const variante = String(body?.variante ?? "v4");
  const guion = body?.guion ? String(body.guion).slice(0, 4000) : null;
  const videoUrl = String(body?.videoUrl ?? "");

  if (!ownerId || !videoUrl) return NextResponse.json({ error: "Faltan ownerId o videoUrl" }, { status: 400 });

  const { error } = await supabase.from("generated_videos").insert({ owner_id: ownerId, variante, guion, video_url: videoUrl });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
