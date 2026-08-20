import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/** Devuelve el voice_id clonado (ElevenLabs) de un owner, si existe. */
export async function GET(req: NextRequest) {
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  if (!ownerId) return NextResponse.json({ error: "Falta ownerId" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ voiceId: null });

  const { data } = await supabase
    .from("twin_profiles")
    .select("voice_id")
    .eq("owner_id", ownerId)
    .is("follower_id", null)
    .maybeSingle();

  return NextResponse.json({ voiceId: data?.voice_id ?? null });
}
