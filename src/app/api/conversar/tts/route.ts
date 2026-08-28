import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * TTS de Conversar (canal Voz) y de la videollamada real-time (V1) —
 * ElevenLabs Flash/Turbo (V10 §12). Sin ELEVENLABS_API_KEY (pendiente según
 * Juan), devuelve 501 explícito para que el cliente recurra al fallback de
 * voz del navegador (window.speechSynthesis) en vez de fingir audio real.
 * Acepta ?optimize_streaming_latency=0-4 (más alto = menor latencia, ver
 * ARQUITECTURA VISION ARTIFICIAL) y, si no llega voiceId directo, lo
 * resuelve a partir de ownerId igual que /api/twin/voice.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const { texto, voiceId: voiceIdBody, ownerId } = await req.json();

  let voiceId = voiceIdBody;
  if (!voiceId && ownerId) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data } = await supabase
        .from("twin_profiles")
        .select("voice_id")
        .eq("owner_id", ownerId)
        .is("follower_id", null)
        .maybeSingle();
      voiceId = data?.voice_id ?? undefined;
    }
  }
  voiceId = voiceId || process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey || !voiceId) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY/ELEVENLABS_VOICE_ID no configuradas" },
      { status: 501 }
    );
  }

  const latencia = req.nextUrl.searchParams.get("optimize_streaming_latency");

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      text: texto,
      model_id: "eleven_flash_v2_5",
      ...(latencia ? { optimize_streaming_latency: Number(latencia) } : {}),
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "ElevenLabs TTS falló" }, { status: 502 });
  }

  const audio = await res.arrayBuffer();
  return new NextResponse(audio, { headers: { "Content-Type": "audio/mpeg" } });
}
