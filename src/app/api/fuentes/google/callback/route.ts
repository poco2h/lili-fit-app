import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { DemoTwin } from "@/lib/demo/localTwin";

/** Google redirige aquí tras el consentimiento con ?code=&state={ownerId}. Intercambia el code por tokens y guarda el email conectado. */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const code = params.get("code");
  const ownerId = params.get("state");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mindtwin-app.vercel.app";
  const destino = new URL("/app/fuentes", appUrl);

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const supabase = getSupabaseAdmin();
  if (!supabase || !code || !ownerId || !clientId || !clientSecret) {
    destino.searchParams.set("google_error", "1");
    return NextResponse.redirect(destino);
  }

  const redirectUri = `${appUrl}/api/fuentes/google/callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    destino.searchParams.set("google_error", "1");
    return NextResponse.redirect(destino);
  }
  const tokens = await tokenRes.json();

  let email = "";
  try {
    const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const info = await infoRes.json();
    email = info.email ?? "";
  } catch {
    // sigue sin email — se guarda la conexión igualmente
  }

  const { data: existente } = await supabase
    .from("twin_profiles")
    .select("id, demo_twin")
    .eq("owner_id", ownerId)
    .is("follower_id", null)
    .maybeSingle();

  const twinActual = (existente?.demo_twin as DemoTwin | undefined) ?? ({} as DemoTwin);
  const twinActualizado: DemoTwin = {
    ...twinActual,
    sources: { ...twinActual.sources, google: true },
    sources_data: {
      ...twinActual.sources_data,
      google: { detalle: email || "Cuenta de Google conectada", conectadoEn: new Date().toISOString() },
    },
  };

  if (existente) {
    await supabase.from("twin_profiles").update({ demo_twin: twinActualizado, updated_at: new Date().toISOString() }).eq("id", existente.id);
  } else {
    await supabase.from("twin_profiles").insert({ owner_id: ownerId, demo_twin: twinActualizado });
  }

  destino.searchParams.set("google_conectado", "1");
  return NextResponse.redirect(destino);
}
