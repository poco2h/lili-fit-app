import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Arranca la videollamada real-time HeyGen (reemplazo de Tavus, ver
 * PROMPT VISION ARTIFICIAL). HeyGen descontinuó "Interactive Avatar"
 * (streaming.create_token, paquete @heygen/streaming-avatar) — este
 * endpoint da 404 real desde 2026-08. El reemplazo es LiveAvatar
 * (api.liveavatar.com, paquete @heygen/liveavatar-web-sdk), migrado
 * 2026-08-28. Igual que antes: HEYGEN_API_KEY (secreto de servidor) se
 * cambia por un session_token de un solo uso — el token, no la API key,
 * es lo único que llega al navegador.
 *
 * avatar_id: el heygen_avatar_id guardado en twin_profiles viene del
 * sistema ANTERIOR (Interactive Avatar) y no es compatible con el catálogo
 * de LiveAvatar (espacios de IDs distintos) — hasta que se entrene/registre
 * un avatar propio en LiveAvatar, se usa siempre el avatar de muestra
 * público de HeyGen para LiveAvatar.
 *
 * is_sandbox: true a propósito (decisión explícita del usuario 2026-08-28,
 * para no gastar créditos reales de LiveAvatar mientras se verifica que la
 * migración funciona). Cambiar a false cuando se confirme que hay plan/
 * créditos de LiveAvatar contratados.
 */
const STOCK_AVATAR_ID = "dd73ea75-1218-4ef3-92ce-606d5f7fbc0a";
const SANDBOX = true;

export async function POST(req: NextRequest) {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Falta configurar HEYGEN_API_KEY." }, { status: 501 });

  const { ownerId } = (await req.json().catch(() => ({}))) as { ownerId?: string };

  let avatarId: string | null = null;
  if (ownerId) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data } = await supabase
        .from("twin_profiles")
        .select("heygen_avatar_id")
        .eq("owner_id", ownerId)
        .is("follower_id", null)
        .maybeSingle();
      avatarId = data?.heygen_avatar_id ?? null;
    }
  }

  const res = await fetch("https://api.liveavatar.com/v1/sessions/token", {
    method: "POST",
    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "LITE",
      // avatarId (del sistema antiguo) deliberadamente no se usa aquí, ver comentario arriba.
      avatar_id: STOCK_AVATAR_ID,
      is_sandbox: SANDBOX,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return NextResponse.json({ error: `LiveAvatar sessions/token falló (${res.status}): ${body.slice(0, 300)}` }, { status: 502 });
  }
  const data = (await res.json()) as { data?: { session_token: string } };
  if (!data.data?.session_token) return NextResponse.json({ error: "LiveAvatar no devolvió session_token." }, { status: 502 });

  return NextResponse.json({
    token: data.data.session_token,
    avatarId: STOCK_AVATAR_ID,
    avatarEsStock: !avatarId,
  });
}
