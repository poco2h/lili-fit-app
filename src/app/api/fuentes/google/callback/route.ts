import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { DemoTwin } from "@/lib/demo/localTwin";
import { extraerMuestraGoogle } from "@/lib/fuentes/google";

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
  const tokens = (await tokenRes.json()) as { access_token?: string; refresh_token?: string; expires_in?: number };
  const accessToken = tokens.access_token ?? "";

  let email = "";
  try {
    const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const info = await infoRes.json();
    email = info.email ?? "";
  } catch {
    // sigue sin email — se guarda la conexión igualmente
  }

  // Uso real de los scopes concedidos (youtube.readonly + drive.readonly +
  // gmail.readonly) — sin esto se pide permiso y nunca se lee nada, lo cual
  // bloquea la verificación de Google. Falla en silencio (queda "" y se
  // reintenta en la próxima sincronización) para no romper el flujo de login.
  const muestraTexto = accessToken ? await extraerMuestraGoogle(accessToken).catch(() => "") : "";

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
      google: {
        detalle: email || "Cuenta de Google conectada",
        conectadoEn: new Date().toISOString(),
        accessToken,
        accessTokenExpira: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString(),
        // refresh_token solo llega la primera vez que el usuario consiente (prompt=consent lo fuerza siempre) — si por lo que sea no llega, se conserva el anterior.
        refreshToken: tokens.refresh_token || twinActual.sources_data?.google?.refreshToken,
        muestraTexto: muestraTexto || twinActual.sources_data?.google?.muestraTexto,
      },
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
