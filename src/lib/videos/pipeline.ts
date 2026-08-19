export type VariantePV = "v3" | "v4" | "combo";

export type VideoJobResult = {
  estado: "completado" | "procesando" | "simulado" | "error";
  mensaje: string;
  videoUrl?: string;
  requestId?: string;
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

type HiggsfieldStatus = {
  status: "queued" | "in_progress" | "nsfw" | "failed" | "completed" | "canceled";
  request_id: string;
  status_url?: string;
  error?: string | null;
  video?: { url: string } | null;
};

async function pollHiggsfield(statusUrl: string, authHeader: string, timeoutMs = 50000): Promise<HiggsfieldStatus> {
  const terminal = new Set(["completed", "failed", "nsfw", "canceled"]);
  const start = Date.now();
  let delay = 2000;

  while (Date.now() - start < timeoutMs) {
    const res = await fetch(statusUrl, { headers: { Authorization: authHeader } });
    if (!res.ok) throw new Error(`Higgsfield status ${res.status}`);
    const data = (await res.json()) as HiggsfieldStatus;
    if (terminal.has(data.status)) return data;
    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay * 1.5, 10000);
  }

  throw new Error("timeout");
}

/**
 * Pipeline V3 (Talking Head) / V4 (Full Body) — MIS VIDEOS MT_.docx:
 * V3 = guion → ElevenLabs TTS → lipsync → mp4 9:16 (el modelo de lipsync de
 * Higgsfield todavía no aparece documentado en platform.higgsfield.ai/docs a
 * fecha de esta integración — solo hay modelos image2video/text2image).
 * V4 = imagen → higgsfield-ai/dop/standard (image2video) → mp4.
 * API real: POST https://platform.higgsfield.ai/higgsfield-ai/{modelo} con
 * Authorization: Key {HIGGSFIELD_API_KEY_ID}:{HIGGSFIELD_API_KEY}, la
 * respuesta es asíncrona (request_id + status_url a sondear).
 */
export async function generarVideo(variante: VariantePV, guion: string): Promise<VideoJobResult> {
  const elevenlabsKey = process.env.ELEVENLABS_API_KEY;
  const higgsfieldSecret = process.env.HIGGSFIELD_API_KEY;
  const higgsfieldKeyId = process.env.HIGGSFIELD_API_KEY_ID;

  if (!elevenlabsKey || !higgsfieldSecret || !higgsfieldKeyId) {
    const faltan = [
      !elevenlabsKey && "ELEVENLABS_API_KEY",
      !higgsfieldSecret && "HIGGSFIELD_API_KEY",
      !higgsfieldKeyId && "HIGGSFIELD_API_KEY_ID",
    ].filter(Boolean);
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

    // 2) Higgsfield image2video (V4) — imagen placeholder hasta tener el avatar real del owner.
    const authHeader = `Key ${higgsfieldKeyId}:${higgsfieldSecret}`;
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

    const final = await pollHiggsfield(submitData.status_url, authHeader);
    if (final.status === "completed" && final.video?.url) {
      return { estado: "completado", mensaje: "Vídeo generado.", videoUrl: final.video.url, requestId: final.request_id };
    }
    if (final.status === "failed" || final.status === "nsfw" || final.status === "canceled") {
      return { estado: "error", mensaje: `Higgsfield: ${final.error ?? final.status}`, requestId: final.request_id };
    }
    return {
      estado: "procesando",
      mensaje: "Higgsfield sigue procesando el vídeo — vuelve a comprobarlo en unos segundos.",
      requestId: submitData.request_id,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    if (msg === "timeout") {
      return { estado: "procesando", mensaje: "Higgsfield sigue procesando el vídeo — vuelve a comprobarlo en unos segundos." };
    }
    return { estado: "error", mensaje: msg };
  }
}
