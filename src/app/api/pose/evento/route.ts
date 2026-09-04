import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { resolveOwnerUuid, resolveFollowerUuid } from "@/lib/demo/identities";

/**
 * Loguea un evento de Visual Coach (feedback automático o turno de Q&A) en
 * visual_coach_events — server-side con service role para no exponer la key
 * de Supabase al cliente. Mismo patrón de resolución de ids que el billing
 * (resolveOwnerUuid/resolveFollowerUuid, src/lib/demo/identities.ts).
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const ownerId = String(body?.ownerId ?? "");
  const followerId = String(body?.followerId ?? "");
  const eventType = body?.eventType as "feedback_auto" | "qa_alumno" | "qa_coach" | undefined;
  if (!ownerId || !followerId || !eventType) {
    return NextResponse.json({ error: "Faltan ownerId, followerId o eventType" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase no configurado" }, { status: 501 });

  try {
    const ownerUuid = await resolveOwnerUuid(ownerId);
    const followerUuid = await resolveFollowerUuid(followerId, ownerUuid!);

    const { error } = await supabase.from("visual_coach_events").insert({
      owner_id: ownerUuid,
      follower_id: followerUuid,
      session_billing_id: body?.sessionBillingId ?? null,
      event_type: eventType,
      exercise: body?.exercise ?? null,
      joint_angles: body?.jointAngles ?? null,
      deviations: body?.deviations ?? null,
      text: body?.text ?? null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error desconocido" }, { status: 500 });
  }
}
