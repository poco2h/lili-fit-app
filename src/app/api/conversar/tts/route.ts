import { NextRequest, NextResponse } from "next/server";

/**
 * TTS de Conversar (canal Voz) — ElevenLabs Flash/Turbo (V10 §12).
 * Sin ELEVENLABS_API_KEY (pendiente según Juan), devuelve 501 explícito
 * para que el cliente recurra al fallback de voz del navegador
 * (window.speechSynthesis) en vez de fingir audio real.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const { texto, voiceId: voiceIdBody } = await req.json();
  const voiceId = voiceIdBody || process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !voiceId) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY/ELEVENLABS_VOICE_ID no configuradas" },
      { status: 501 }
    );
  }

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ text: texto, model_id: "eleven_flash_v2_5" }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "ElevenLabs TTS falló" }, { status: 502 });
  }

  const audio = await res.arrayBuffer();
  return new NextResponse(audio, { headers: { "Content-Type": "audio/mpeg" } });
}
