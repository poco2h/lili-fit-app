export type HeyGenJobResult = {
  estado: "completado" | "procesando" | "simulado" | "error";
  mensaje: string;
  videoUrl?: string;
  videoId?: string;
};

/**
 * HeyGen NO expone por API el entrenamiento del Digital Twin (subir el
 * vídeo de 2 min) — esa parte es Enterprise-only. El profesional lo entrena
 * a mano en el dashboard de heygen.com y aquí solo guarda el avatar_id/
 * voice_id resultantes (ver /api/profesionales/heygen/guardar). Lo que sí
 * es API estándar (plan Creator) es generar vídeos nuevos con ese avatar ya
 * entrenado — eso es lo que hace este pipeline.
 */
export async function generarVideoHeyGen(
  guion: string,
  heygenAvatarId: string,
  heygenVoiceId: string
): Promise<HeyGenJobResult> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    return { estado: "simulado", mensaje: `Simulado — falta configurar HEYGEN_API_KEY. Guion recibido (${guion.length} caracteres).` };
  }

  try {
    const res = await fetch("https://api.heygen.com/v2/video/generate", {
      method: "POST",
      headers: { "X-Api-Key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        video_inputs: [
          {
            character: { type: "avatar", avatar_id: heygenAvatarId, avatar_style: "normal" },
            voice: { type: "text", input_text: guion, voice_id: heygenVoiceId },
          },
        ],
        dimension: { width: 720, height: 1280 },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`HeyGen submit falló (${res.status}): ${body.slice(0, 300)}`);
    }
    const data = (await res.json()) as { data?: { video_id: string }; error?: string };
    if (!data.data?.video_id) throw new Error(data.error ?? "HeyGen no devolvió video_id");

    return { estado: "procesando", mensaje: "HeyGen está generando el vídeo…", videoId: data.data.video_id };
  } catch (e) {
    return { estado: "error", mensaje: e instanceof Error ? e.message : "Error desconocido" };
  }
}

export type HeyGenAssetResult =
  | { ok: true; assetId: string; url: string }
  | { ok: false; error: string };

/**
 * Sube una imagen a HeyGen (POST /v3/assets, multipart) — primer paso para
 * crear un Photo Avatar. Necesita el Buffer del archivo y su content-type.
 */
export async function subirAssetHeyGen(archivo: Buffer, nombreArchivo: string, contentType: string): Promise<HeyGenAssetResult> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) return { ok: false, error: "Falta configurar HEYGEN_API_KEY." };

  try {
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(archivo)], { type: contentType }), nombreArchivo);

    const res = await fetch("https://api.heygen.com/v3/assets", {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: form,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `HeyGen /v3/assets falló (${res.status}): ${body.slice(0, 300)}` };
    }
    const data = (await res.json()) as { data?: { asset_id: string; url: string } };
    if (!data.data?.asset_id) return { ok: false, error: "HeyGen no devolvió asset_id." };

    return { ok: true, assetId: data.data.asset_id, url: data.data.url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error desconocido" };
  }
}

export type HeyGenPhotoAvatarResult =
  | { ok: true; avatarId: string }
  | { ok: false; error: string };

/**
 * Crea un Photo Avatar a partir de un asset ya subido (POST /v3/avatars,
 * type: "photo"). El avatar_id resultante se usa igual que el de un Digital
 * Twin de vídeo — generarVideoHeyGen() no distingue el origen del avatar.
 */
export async function crearPhotoAvatarHeyGen(assetId: string, nombre: string): Promise<HeyGenPhotoAvatarResult> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) return { ok: false, error: "Falta configurar HEYGEN_API_KEY." };

  try {
    const res = await fetch("https://api.heygen.com/v3/avatars", {
      method: "POST",
      headers: { "X-Api-Key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        type: "photo",
        name: nombre,
        file: { type: "asset_id", asset_id: assetId },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `HeyGen /v3/avatars falló (${res.status}): ${body.slice(0, 300)}` };
    }
    const data = (await res.json()) as { data?: { avatar_item?: { id: string }; id?: string } };
    const avatarId = data.data?.avatar_item?.id ?? data.data?.id;
    if (!avatarId) return { ok: false, error: "HeyGen no devolvió avatar_id." };

    return { ok: true, avatarId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error desconocido" };
  }
}

export async function consultarEstadoVideoHeyGen(videoId: string): Promise<HeyGenJobResult> {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) return { estado: "error", mensaje: "Falta configurar HEYGEN_API_KEY." };

  const res = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${encodeURIComponent(videoId)}`, {
    headers: { "X-Api-Key": apiKey, Accept: "application/json" },
  });
  if (!res.ok) return { estado: "error", mensaje: `HeyGen status ${res.status}` };

  const { data } = (await res.json()) as {
    data?: { status: "pending" | "waiting" | "processing" | "completed" | "failed"; video_url?: string; error?: { message: string } | null };
  };

  if (data?.status === "completed" && data.video_url) {
    return { estado: "completado", mensaje: "Vídeo generado.", videoUrl: data.video_url, videoId };
  }
  if (data?.status === "failed") {
    return { estado: "error", mensaje: `HeyGen: ${data.error?.message ?? "fallo desconocido"}`, videoId };
  }
  return { estado: "procesando", mensaje: `HeyGen sigue generando el vídeo… (${data?.status ?? "desconocido"})`, videoId };
}
