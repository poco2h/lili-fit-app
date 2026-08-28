import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { ONBOARDING_PROGRESS_INICIAL } from "@/lib/demo/localTwin";

/**
 * Reinicia sesion_actual a "S1" para el owner autenticado — vía Auth
 * Bearer token, mismo patrón que resolver-owner. Existe porque hay DOS
 * caminos que escriben sesion_actual: el flujo conversacional real (V10
 * §5, Mis Conversaciones) y el cuestionario estático /app/onboarding
 * (OnboardingFlow.tsx, anterior a ese flujo — ya retirado de la
 * navegación, ver app/onboarding/page.tsx). Si alguien pasó por el
 * cuestionario estático antes de que existiera Mis Conversaciones, su
 * sesion_actual quedó en "completo" sin haber hecho nunca el onboarding
 * conversacional real — Conversar entonces muestra el saludo corto de
 * "ya te conozco" en vez de arrancar las sesiones. Este endpoint da una
 * salida de autoservicio sin tocar datos de otros owners.
 */
export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase no está configurado en este entorno." }, { status: 501 });

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Falta el token de sesión." }, { status: 401 });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user?.email) return NextResponse.json({ error: "Sesión inválida." }, { status: 401 });

  const { data: owner } = await supabase.from("owners").select("id").eq("email", userData.user.email).maybeSingle();
  if (!owner) return NextResponse.json({ error: "No encontramos un perfil de profesional con este email." }, { status: 404 });

  const { data: perfil } = await supabase
    .from("twin_profiles")
    .select("id, demo_twin")
    .eq("owner_id", owner.id)
    .is("follower_id", null)
    .maybeSingle();

  if (!perfil) return NextResponse.json({ error: "Todavía no tienes un perfil de MindTwin." }, { status: 404 });

  const twinActualizado = { ...(perfil.demo_twin ?? {}), sesion_actual: "S1", onboarding_progress: ONBOARDING_PROGRESS_INICIAL };
  await supabase.from("twin_profiles").update({ demo_twin: twinActualizado, updated_at: new Date().toISOString() }).eq("id", perfil.id);

  return NextResponse.json({ ok: true });
}
