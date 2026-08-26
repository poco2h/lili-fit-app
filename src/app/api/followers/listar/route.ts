import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { resolveOwnerUuid } from "@/lib/demo/identities";
import type { DemoTwin } from "@/lib/demo/localTwin";

const NUMERO_SESION: Record<string, string> = { S1: "1", S2: "2", S3: "3", S4: "4", completo: "Completado" };

/** Lista los followers reales (tabla `followers`) de un owner, con su progreso de onboarding y fidelity. */
export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase no configurado" }, { status: 501 });

  const ownerIdParam = req.nextUrl.searchParams.get("ownerId");
  if (!ownerIdParam) return NextResponse.json({ error: "Falta ownerId" }, { status: 400 });

  const ownerUuid = await resolveOwnerUuid(ownerIdParam);
  if (!ownerUuid) return NextResponse.json({ error: "No se pudo resolver el owner" }, { status: 404 });

  const { data: followers, error } = await supabase
    .from("followers")
    .select("id, email, created_at")
    .eq("owner_id", ownerUuid)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!followers || followers.length === 0) return NextResponse.json({ followers: [] });

  const { data: twins } = await supabase
    .from("twin_profiles")
    .select("follower_id, demo_twin, fidelity_pct")
    .in("follower_id", followers.map((f) => f.id));

  const twinPorFollower = new Map((twins ?? []).map((t) => [t.follower_id, t]));

  const resultado = followers.map((f) => {
    const twin = twinPorFollower.get(f.id);
    const demoTwin = twin?.demo_twin as DemoTwin | undefined;
    const sesion = demoTwin?.sesion_actual;
    const esEmailDemo = /^follower\+.+@demo\.mindtwin\.local$/.test(f.email);
    return {
      id: f.id,
      email: f.email,
      label: esEmailDemo ? `Follower #${f.id.slice(0, 8)}` : f.email,
      createdAt: f.created_at,
      sesionActual: sesion ? (NUMERO_SESION[sesion] ?? sesion) : "Sin empezar",
      mindscore: twin?.fidelity_pct ?? null,
    };
  });

  return NextResponse.json({ followers: resultado });
}
