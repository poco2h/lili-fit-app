import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { syncAgent } from "@/lib/elevenlabs/agent";

export type ExercisePreset = {
  id: string;
  label: string;
  joint_targets: Record<string, [number, number]>;
};

export type SportsProfile = {
  sport: string;
  knowledge_base: string;
  exercises: ExercisePreset[];
};

export const SPORTS_PROFILE_DEFAULT: SportsProfile = {
  sport: "fitness_general",
  knowledge_base: "",
  exercises: [
    { id: "sentadilla", label: "Sentadilla", joint_targets: { knee_left: [80, 100], knee_right: [80, 100], hip_left: [70, 110], hip_right: [70, 110] } },
    { id: "plancha", label: "Plancha", joint_targets: { back_angle: [160, 180], elbow_left: [80, 100], elbow_right: [80, 100] } },
    { id: "flexion", label: "Flexión", joint_targets: { elbow_left: [70, 110], elbow_right: [70, 110], back_angle: [160, 180] } },
  ],
};

/** Lee la config de deporte/ejercicios del entrenador (twin_profiles.sports_profile, fila owner-level). */
export async function GET(req: NextRequest) {
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  if (!ownerId) return NextResponse.json({ error: "Falta ownerId" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ sportsProfile: SPORTS_PROFILE_DEFAULT, ownerName: null });

  const [{ data }, { data: owner }] = await Promise.all([
    supabase.from("twin_profiles").select("sports_profile").eq("owner_id", ownerId).is("follower_id", null).maybeSingle(),
    supabase.from("owners").select("name").eq("id", ownerId).maybeSingle(),
  ]);

  const sportsProfile: SportsProfile =
    data?.sports_profile && Object.keys(data.sports_profile).length > 0 ? data.sports_profile : SPORTS_PROFILE_DEFAULT;

  return NextResponse.json({ sportsProfile, ownerName: owner?.name ?? null });
}

/** Guarda la config de deporte/ejercicios del entrenador. */
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const ownerId = String(body?.ownerId ?? "");
  const sportsProfile = body?.sportsProfile as SportsProfile | undefined;
  if (!ownerId || !sportsProfile) return NextResponse.json({ error: "Faltan ownerId o sportsProfile" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase no configurado" }, { status: 501 });

  const { data: existente } = await supabase
    .from("twin_profiles")
    .select("id")
    .eq("owner_id", ownerId)
    .is("follower_id", null)
    .maybeSingle();

  if (existente) {
    await supabase.from("twin_profiles").update({ sports_profile: sportsProfile, updated_at: new Date().toISOString() }).eq("id", existente.id);
  } else {
    await supabase.from("twin_profiles").insert({ owner_id: ownerId, sports_profile: sportsProfile });
  }

  const syncResult = await syncAgent(ownerId).catch((e) => ({ synced: false as const, reason: e instanceof Error ? e.message : "Error desconocido" }));

  return NextResponse.json({ ok: true, agentSynced: syncResult.synced, agentSyncReason: syncResult.reason });
}
