import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { JointName, JointStatus } from "@/lib/pose/angles";

type EventRow = {
  follower_id: string;
  event_type: "feedback_auto" | "qa_alumno" | "qa_coach";
  exercise: string | null;
  deviations: Partial<Record<JointName, { status: JointStatus }>> | null;
  text: string | null;
  created_at: string;
};

/**
 * Agrega visual_coach_events por alumno (nº de sesiones/eventos, errores
 * articulares más frecuentes) y transcript completo — para el panel de
 * stats del Coach Dashboard (/profesor/[id]).
 */
export async function GET(req: NextRequest) {
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  if (!ownerId) return NextResponse.json({ error: "Falta ownerId" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ alumnos: [] });

  const { data, error } = await supabase
    .from("visual_coach_events")
    .select("follower_id, event_type, exercise, deviations, text, created_at")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as EventRow[];
  const followerIds = Array.from(new Set(rows.map((r) => r.follower_id)));
  const { data: followerRows } = followerIds.length
    ? await supabase.from("followers").select("id, display_name").in("id", followerIds)
    : { data: [] as Array<{ id: string; display_name: string | null }> };
  const nombrePorFollower = new Map((followerRows ?? []).map((f) => [f.id, f.display_name]));

  const porAlumno = new Map<
    string,
    { followerId: string; totalEventos: number; erroresPorJoint: Map<string, number>; transcript: EventRow[] }
  >();

  for (const row of rows) {
    if (!porAlumno.has(row.follower_id)) {
      porAlumno.set(row.follower_id, { followerId: row.follower_id, totalEventos: 0, erroresPorJoint: new Map(), transcript: [] });
    }
    const alumno = porAlumno.get(row.follower_id)!;
    alumno.totalEventos += 1;
    if (row.event_type === "qa_alumno" || row.event_type === "qa_coach") alumno.transcript.push(row);
    if (row.event_type === "feedback_auto" && row.deviations) {
      for (const [joint, dev] of Object.entries(row.deviations)) {
        if (dev?.status === "deviation") alumno.erroresPorJoint.set(joint, (alumno.erroresPorJoint.get(joint) ?? 0) + 1);
      }
    }
  }

  const alumnos = Array.from(porAlumno.values()).map((a) => ({
    followerId: a.followerId,
    displayName: nombrePorFollower.get(a.followerId) ?? null,
    totalEventos: a.totalEventos,
    erroresRecurrentes: Array.from(a.erroresPorJoint.entries())
      .sort((x, y) => y[1] - x[1])
      .map(([joint, count]) => ({ joint, count })),
    transcript: a.transcript.map((t) => ({ eventType: t.event_type, text: t.text, createdAt: t.created_at })),
  }));

  return NextResponse.json({ alumnos });
}
