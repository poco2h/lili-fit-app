import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { DemoTwin } from "@/lib/demo/localTwin";

/** Registrar esta URL como webhook en el dashboard de Terra (dev). Procesa el evento "auth" — reference_id es el ownerId que le pasamos al generar la sesión de conexión. */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const secret = process.env.TERRA_WEBHOOK_SECRET;
  const firma = req.headers.get("terra-signature");

  if (secret && firma) {
    const [tPart, vPart] = firma.split(",");
    const timestamp = tPart?.split("=")[1];
    const firmaRecibida = vPart?.split("=")[1];
    const esperado = crypto.createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex");
    if (!firmaRecibida || firmaRecibida !== esperado) {
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }
  }

  let payload: { type?: string; user?: { reference_id?: string; provider?: string } } = {};
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (payload.type !== "auth" || !payload.user?.reference_id) {
    return NextResponse.json({ ok: true, ignorado: true });
  }

  const ownerId = payload.user.reference_id;
  const proveedor = payload.user.provider ?? "wearable";

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase no configurado" }, { status: 501 });

  const { data: existente } = await supabase
    .from("twin_profiles")
    .select("id, demo_twin")
    .eq("owner_id", ownerId)
    .is("follower_id", null)
    .maybeSingle();

  const twinActual = (existente?.demo_twin as DemoTwin | undefined) ?? ({} as DemoTwin);
  const twinActualizado: DemoTwin = {
    ...twinActual,
    sources: { ...twinActual.sources, wearables: true },
    sources_data: {
      ...twinActual.sources_data,
      wearables: { detalle: proveedor, conectadoEn: new Date().toISOString() },
    },
  };

  if (existente) {
    await supabase.from("twin_profiles").update({ demo_twin: twinActualizado, updated_at: new Date().toISOString() }).eq("id", existente.id);
  } else {
    await supabase.from("twin_profiles").insert({ owner_id: ownerId, demo_twin: twinActualizado });
  }

  return NextResponse.json({ ok: true });
}
