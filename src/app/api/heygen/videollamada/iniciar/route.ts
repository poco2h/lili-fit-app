import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Arranca la videollamada real-time HeyGen (reemplazo de Tavus, ver
 * PROMPT VISION ARTIFICIAL): resuelve el heygen_avatar_id del owner y
 * cambia HEYGEN_API_KEY (secreto de servidor) por un access token de un
 * solo uso vía streaming.create_token. El token, no la API key, es lo
 * único que llega al navegador — así el SDK @heygen/streaming-avatar
 * puede abrir la sesión WebRTC sin exponer el secreto.
 */
const STOCK_AVATAR_ID = "Wayne_20240711";

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

  const res = await fetch("https://api.heygen.com/v1/streaming.create_token", {
    method: "POST",
    headers: { "x-api-key": apiKey },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return NextResponse.json({ error: `HeyGen create_token falló (${res.status}): ${body.slice(0, 300)}` }, { status: 502 });
  }
  const data = (await res.json()) as { data?: { token: string } };
  if (!data.data?.token) return NextResponse.json({ error: "HeyGen no devolvió token." }, { status: 502 });

  return NextResponse.json({
    token: data.data.token,
    avatarId: avatarId ?? STOCK_AVATAR_ID,
    avatarEsStock: !avatarId,
  });
}
