export type VariantePV = "v3" | "v4" | "combo";

export type VideoJobResult = {
  estado: "completado" | "procesando" | "simulado" | "error";
  mensaje: string;
  videoUrl?: string;
  requestId?: string;
  statusUrl?: string;
};

/**
 * Voz pública de ElevenLabs ("Rachel") usada como placeholder hasta que el
 * owner clone su propia voz en la sesión S3 de Conversar (elevenlabs_voice_id
 * en twin_profile, hoy siempre null — ver src/lib/types/twinProfile.ts).
 */
const VOICE_ID_PLACEHOLDER = "21m00Tcm4TlvDq8ikWAM";

/**
 * Imagen de referencia usada como placeholder hasta que exista un flujo real
 * de subida de foto/avatar del owner (Mis Fuentes o el propio onboarding).
 * Tiene que ser una URL pública que Higgsfield pueda descargar de verdad.
 */
const IMAGE_URL_PLACEHOLDER = "https://picsum.photos/id/64/768/1024";

export type HiggsfieldStatus = {
  status: "queued" | "in_progress" | "nsfw" | "failed" | "completed" | "canceled";
  request_id: string;
  status_url?: string;
  error?: string | null;
  video?: { url: string } | null;
};

function higgsfieldAuthHeader(): string | null {
  const secret = process.env.HIGGSFIELD_API_KEY;
  const keyId = process.env.HIGGSFIELD_API_KEY_ID;
  if (!secret || !keyId) return null;
  return `Key ${keyId}:${secret}`;
}

/**
 * Consulta UNA vez el estado de un request ya enviado a Higgsfield — pensado
 * para que el cliente haga polling llamando a este endpoint cada pocos
 * segundos, en vez de mantener la función serverless abierta sondeando
 * (los planes de Vercel cortan la función mucho antes de que Higgsfield
 * termine de generar el vídeo — probado: FUNCTION_INVOCATION_TIMEOUT).
 */
export async function consultarEstadoVideo(statusUrl: string): Promise<VideoJobResult> {
  const authHeader = higgsfieldAuthHeader();
  if (!authHeader) return { estado: "error", mensaje: "Falta configurar Higgsfield." };

  const res = await fetch(statusUrl, { headers: { Authorization: authHeader } });
  if (!res.ok) return { estado: "error", mensaje: `Higgsfield status ${res.status}` };
  const data = (await res.json()) as HiggsfieldStatus;

  if (data.status === "completed" && data.video?.url) {
    return { estado: "completado", mensaje: "Vídeo generado.", videoUrl: data.video.url, requestId: data.request_id };
  }
  if (data.status === "failed" || data.status === "nsfw" || data.status === "canceled") {
    return { estado: "error", mensaje: `Higgsfield: ${data.error ?? data.status}`, requestId: data.request_id };
  }
  return {
    estado: "procesando",
    mensaje: `Higgsfield sigue procesando el vídeo… (${data.status})`,
    requestId: data.request_id,
    statusUrl,
  };
}

/**
 * Pipeline V3 (Talking Head) / V4 (Full Body) — MIS VIDEOS MT_.docx:
 * V3 = guion → ElevenLabs TTS → lipsync → mp4 9:16 (el modelo de lipsync de
 * Higgsfield todavía no aparece documentado en platform.higgsfield.ai/docs a
 * fecha de esta integración — solo hay modelos image2video/text2image).
 * V4 = imagen → higgsfield-ai/dop/standard (image2video) → mp4.
 * API real: POST https://platform.higgsfield.ai/higgsfield-ai/{modelo} con
 * Authorization: Key {HIGGSFIELD_API_KEY_ID}:{HIGGSFIELD_API_KEY}. La
 * respuesta es asíncrona (request_id + status_url) — este pipeline solo
 * ENVÍA el trabajo; el cliente sondea /api/videos/estado con el status_url.
 */
export async function generarVideo(variante: VariantePV, guion: string): Promise<VideoJobResult> {
  const elevenlabsKey = process.env.ELEVENLABS_API_KEY;
  const authHeader = higgsfieldAuthHeader();

  if (!elevenlabsKey || !authHeader) {
    const faltan = [!elevenlabsKey && "ELEVENLABS_API_KEY", !authHeader && "HIGGSFIELD_API_KEY/HIGGSFIELD_API_KEY_ID"].filter(Boolean);
    return {
      estado: "simulado",
      mensaje: `Simulado — faltan ${faltan.join(" y ")}. Guion recibido (${guion.length} caracteres).`,
    };
  }

  if (variante === "v3" || variante === "combo") {
    return {
      estado: "error",
      mensaje:
        "V1 (hablar a cámara) y el combinado necesitan lipsync, y ese modelo todavía no está publicado en la " +
        "API de Higgsfield (solo hay image2video y text2image documentados). En cuanto Higgsfield lo publique, se activa aquí.",
    };
  }

  try {
    // 1) TTS con ElevenLabs — voz placeholder hasta tener elevenlabs_voice_id real del owner.
    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID_PLACEHOLDER}`, {
      method: "POST",
      headers: { "xi-api-key": elevenlabsKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text: guion, model_id: "eleven_multilingual_v2" }),
    });
    if (!ttsRes.ok) throw new Error(`ElevenLabs TTS falló (${ttsRes.status})`);

    // 2) Higgsfield image2video (V4) — solo ENVÍA el trabajo, no espera a que termine.
    const submitRes = await fetch("https://platform.higgsfield.ai/higgsfield-ai/dop/standard", {
      method: "POST",
      headers: { Authorization: authHeader, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        image_url: IMAGE_URL_PLACEHOLDER,
        prompt: guion.slice(0, 500),
      }),
    });
    if (!submitRes.ok) {
      const body = await submitRes.text().catch(() => "");
      throw new Error(`Higgsfield submit falló (${submitRes.status}): ${body.slice(0, 300)}`);
    }
    const submitData = (await submitRes.json()) as { request_id: string; status_url: string };

    return {
      estado: "procesando",
      mensaje: "Higgsfield está generando el vídeo…",
      requestId: submitData.request_id,
      statusUrl: submitData.status_url,
    };
  } catch (e) {
    return { estado: "error", mensaje: e instanceof Error ? e.message : "Error desconocido" };
  }
}
