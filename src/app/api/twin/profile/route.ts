import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Lee/escribe el DemoTwin completo (EGO ID, GUT ID, TALES, fuentes,
 * dirección, sesión) por owner real — reemplaza el localStorage compartido
 * de src/lib/demo/localTwin.ts cuando hay un ownerId de sesión real.
 * Todo el blob se guarda en twin_profiles.demo_twin (JSONB) para no
 * duplicar el modelo de datos mientras el resto de columnas (ego_id,
 * gut_data, tales_weights...) siguen pensadas para otro fin (V10 §10.1).
 */
export async function GET(req: NextRequest) {
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  if (!ownerId) return NextResponse.json({ error: "Falta ownerId" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ twin: null });

  const { data } = await supabase
    .from("twin_profiles")
    .select("demo_twin")
    .eq("owner_id", ownerId)
    .is("follower_id", null)
    .maybeSingle();

  const twin = data?.demo_twin && Object.keys(data.demo_twin).length > 0 ? data.demo_twin : null;
  return NextResponse.json({ twin });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const ownerId = String(body?.ownerId ?? "");
  const twin = body?.twin;
  if (!ownerId || !twin) return NextResponse.json({ error: "Faltan ownerId o twin" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase no configurado" }, { status: 501 });

  const { data: existente } = await supabase
    .from("twin_profiles")
    .select("id")
    .eq("owner_id", ownerId)
    .is("follower_id", null)
    .maybeSingle();

  if (existente) {
    await supabase.from("twin_profiles").update({ demo_twin: twin, updated_at: new Date().toISOString() }).eq("id", existente.id);
  } else {
    await supabase.from("twin_profiles").insert({ owner_id: ownerId, demo_twin: twin });
  }

  return NextResponse.json({ ok: true });
}
