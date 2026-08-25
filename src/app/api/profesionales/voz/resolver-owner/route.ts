import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Resuelve el owner_id/nombre a partir del email de la sesión Supabase Auth
 * actual (el token llega en Authorization: Bearer <access_token>). Separa
 * la cuenta de "visitante" (Supabase Auth, gate de /profesionales) del
 * registro de negocio en `owners` — ambos comparten email pero son tablas
 * distintas.
 */
export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase no está configurado en este entorno." }, { status: 501 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Falta el token de sesión." }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user?.email) {
    return NextResponse.json({ error: "Sesión inválida." }, { status: 401 });
  }

  const { data: owner, error } = await supabase
    .from("owners")
    .select("id, name")
    .eq("email", userData.user.email)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!owner) {
    return NextResponse.json(
      { error: "No encontramos un perfil de profesional (owners) con este email. Date de alta primero en /profesionales/contratar." },
      { status: 404 }
    );
  }

  const { data: perfil } = await supabase
    .from("twin_profiles")
    .select("voice_id, avatar_soul_id, heygen_avatar_id, heygen_voice_id")
    .eq("owner_id", owner.id)
    .is("follower_id", null)
    .maybeSingle();

  return NextResponse.json({
    ownerId: owner.id,
    ownerName: owner.name,
    voiceId: perfil?.voice_id ?? null,
    avatarUrl: perfil?.avatar_soul_id ?? null,
    heygenAvatarId: perfil?.heygen_avatar_id ?? null,
    heygenVoiceId: perfil?.heygen_voice_id ?? null,
  });
}
