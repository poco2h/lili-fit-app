import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { crearConversacionTavus } from "@/lib/videos/tavus";

/**
 * Arranca una videollamada Tavus CVI (V1/V2, regla fija V10 §12: nunca
 * Higgsfield aquí). Usa el avatar_replica_id del owner si ya clonó su cara
 * en Tavus; si no, cae a una stock face (ver src/lib/videos/tavus.ts) para
 * que el canal funcione desde ya.
 */
export async function POST(req: NextRequest) {
  const { ownerId, ownerName } = (await req.json().catch(() => ({}))) as {
    ownerId?: string;
    ownerName?: string;
  };
  if (!ownerName) return NextResponse.json({ error: "Falta ownerName" }, { status: 400 });

  let faceId: string | null = null;
  if (ownerId) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data } = await supabase
        .from("twin_profiles")
        .select("avatar_replica_id")
        .eq("owner_id", ownerId)
        .is("follower_id", null)
        .maybeSingle();
      faceId = data?.avatar_replica_id ?? null;
    }
  }

  const result = await crearConversacionTavus({ ownerName, faceId });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });

  return NextResponse.json({
    conversationId: result.conversationId,
    conversationUrl: result.conversationUrl,
    faceEsStock: !faceId,
  });
}
