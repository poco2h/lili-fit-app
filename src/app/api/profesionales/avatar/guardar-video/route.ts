import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { DemoTwin } from "@/lib/demo/localTwin";

/** Guarda la referencia del vídeo de avatar (avatar_video_url) dentro del demo_twin del owner, sin pisar el resto del blob. */
export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase no configurado" }, { status: 501 });

  const body = await req.json();
  const ownerId = String(body?.ownerId ?? "");
  const videoUrl = String(body?.videoUrl ?? "");
  if (!ownerId || !videoUrl) return NextResponse.json({ error: "Faltan ownerId o videoUrl" }, { status: 400 });

  const { data: existente } = await supabase
    .from("twin_profiles")
    .select("id, demo_twin")
    .eq("owner_id", ownerId)
    .is("follower_id", null)
    .maybeSingle();

  const twinActual = (existente?.demo_twin as DemoTwin | undefined) ?? ({} as DemoTwin);
  const twinActualizado = { ...twinActual, avatar_video_url: videoUrl };

  if (existente) {
    await supabase.from("twin_profiles").update({ demo_twin: twinActualizado, updated_at: new Date().toISOString() }).eq("id", existente.id);
  } else {
    await supabase.from("twin_profiles").insert({ owner_id: ownerId, demo_twin: twinActualizado });
  }

  return NextResponse.json({ ok: true });
}
