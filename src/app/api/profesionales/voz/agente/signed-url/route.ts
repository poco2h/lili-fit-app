import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Signed URL para conectar con el agente ElevenLabs Conversational AI del
 * entrenador desde el navegador del alumno (VisualCoachPanel) — el agente es
 * privado (lleva su voz clonada), así que no se puede usar el agentId a
 * pelo desde el cliente; hay que pedir este token server-side con
 * ELEVENLABS_API_KEY, que nunca se expone al navegador. Válido 15 minutos
 * para iniciar sesión (ver docs ElevenLabs).
 */
export async function GET(req: NextRequest) {
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  if (!ownerId) return NextResponse.json({ error: "Falta ownerId" }, { status: 400 });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ElevenLabs no configurado (falta ELEVENLABS_API_KEY)" }, { status: 501 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase no configurado" }, { status: 501 });

  const { data } = await supabase
    .from("twin_profiles")
    .select("elevenlabs_agent_id")
    .eq("owner_id", ownerId)
    .is("follower_id", null)
    .maybeSingle();

  const agentId = data?.elevenlabs_agent_id;
  if (!agentId) {
    return NextResponse.json({ error: "Este entrenador todavía no tiene su agente configurado (guarda su deporte en el dashboard)" }, { status: 501 });
  }

  const res = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`, {
    headers: { "xi-api-key": apiKey },
  });
  if (!res.ok) return NextResponse.json({ error: "ElevenLabs no pudo generar el signed URL" }, { status: 502 });

  const json = await res.json();
  return NextResponse.json({ signedUrl: json.signed_url });
}
