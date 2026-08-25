import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/** Guarda el avatar_id/voice_id de HeyGen que el owner entrenó a mano en heygen.com. */
export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase no configurado" }, { status: 501 });

  const body = await req.json();
  const ownerId = String(body?.ownerId ?? "");
  const heygenAvatarId = String(body?.heygenAvatarId ?? "").trim();
  const heygenVoiceId = String(body?.heygenVoiceId ?? "").trim();
  if (!ownerId || !heygenAvatarId || !heygenVoiceId) {
    return NextResponse.json({ error: "Faltan ownerId, heygenAvatarId o heygenVoiceId" }, { status: 400 });
  }

  const { data: existente } = await supabase
    .from("twin_profiles")
    .select("id")
    .eq("owner_id", ownerId)
    .is("follower_id", null)
    .maybeSingle();

  if (existente) {
    await supabase
      .from("twin_profiles")
      .update({ heygen_avatar_id: heygenAvatarId, heygen_voice_id: heygenVoiceId })
      .eq("id", existente.id);
  } else {
    await supabase
      .from("twin_profiles")
      .insert({ owner_id: ownerId, heygen_avatar_id: heygenAvatarId, heygen_voice_id: heygenVoiceId });
  }

  return NextResponse.json({ ok: true });
}
