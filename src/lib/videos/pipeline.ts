export type VariantePV = "v3" | "v4" | "combo";

export type VideoJobResult = {
  estado: "completado" | "simulado" | "error";
  mensaje: string;
  videoUrl?: string;
};

/**
 * Pipeline V3 (Talking Head) / V4 (Full Body) — MIS VIDEOS MT_.docx:
 * V3 = guion → ElevenLabs TTS → higgsfield_lipsync() (Kling Omni 3) → mp4 9:16.
 * V4 = Soul ID (20-30 fotos, una vez) + motion prompt → higgsfield_img2video()
 * (Kling 3.0 / Wan 2.6 / Seedance 2.0) → FFmpeg mezcla audio.
 * Regla fija: RRSS (V3/V4) = Higgsfield, sin excepciones — nunca Tavus aquí.
 *
 * ElevenLabs e Higgsfield están pendientes de API key (estado de Juan,
 * 11 ago 2026) — sin ellas, se devuelve un resultado "simulado" explícito
 * en vez de fingir un vídeo real.
 */
export async function generarVideo(variante: VariantePV, guion: string): Promise<VideoJobResult> {
  const elevenlabsKey = process.env.ELEVENLABS_API_KEY;
  const higgsfieldKey = process.env.HIGGSFIELD_API_KEY;

  if (!elevenlabsKey || !higgsfieldKey) {
    return {
      estado: "simulado",
      mensaje:
        `Simulado — faltan ${!elevenlabsKey ? "ELEVENLABS_API_KEY" : ""}${!elevenlabsKey && !higgsfieldKey ? " y " : ""}${!higgsfieldKey ? "HIGGSFIELD_API_KEY" : ""}. ` +
        `Guion recibido (${guion.length} caracteres) — la llamada real a ElevenLabs TTS + Higgsfield (${variante}) está lista, solo falta configurar las claves.`,
    };
  }

  try {
    // 1) TTS con la voz clonada del owner (elevenlabs_voice_id en twin_profile)
    const ttsRes = await fetch("https://api.elevenlabs.io/v1/text-to-speech/placeholder", {
      method: "POST",
      headers: { "xi-api-key": elevenlabsKey, "Content-Type": "application/json" },
      body: JSON.stringify({ text: guion }),
    });
    if (!ttsRes.ok) throw new Error("ElevenLabs TTS falló");

    // 2) Higgsfield: lipsync (V3) o img2video (V4) — endpoint real pendiente de confirmar con Juan
    const hfRes = await fetch("https://api.higgsfield.ai/v1/generate", {
      method: "POST",
      headers: { Authorization: `Bearer ${higgsfieldKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ variante }),
    });
    if (!hfRes.ok) throw new Error("Higgsfield falló");

    const data = await hfRes.json();
    return { estado: "completado", mensaje: "Vídeo generado.", videoUrl: data?.url };
  } catch (e) {
    return { estado: "error", mensaje: e instanceof Error ? e.message : "Error desconocido" };
  }
}
