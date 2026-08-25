import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { generarVideoHeyGen } from "@/lib/videos/heygen";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const ownerId = String(body?.ownerId ?? "");
  const guion = String(body?.guion ?? "").slice(0, 4000);
  if (!ownerId || !guion.trim()) {
    return NextResponse.json({ error: "Faltan ownerId o guion" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase no configurado" }, { status: 501 });

  const { data } = await supabase
    .from("twin_profiles")
    .select("heygen_avatar_id, heygen_voice_id")
    .eq("owner_id", ownerId)
    .is("follower_id", null)
    .maybeSingle();

  if (!data?.heygen_avatar_id || !data?.heygen_voice_id) {
    return NextResponse.json(
      { error: "Todavía no has guardado tu avatar_id/voice_id de HeyGen — entrena tu Digital Twin en heygen.com y guárdalos arriba." },
      { status: 400 }
    );
  }

  const resultado = await generarVideoHeyGen(guion, data.heygen_avatar_id, data.heygen_voice_id);
  return NextResponse.json(resultado);
}
