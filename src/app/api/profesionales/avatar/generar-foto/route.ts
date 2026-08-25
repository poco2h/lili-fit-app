import { NextRequest, NextResponse } from "next/server";
import { higgsfieldAuthHeader } from "@/lib/videos/pipeline";

/**
 * Genera una foto de referencia realista a partir de un Soul ID ya
 * entrenado (POST /v1/text2image/soul). Esa foto es la que luego se guarda
 * como twin_profiles.avatar_soul_id (misma columna que ya usaba la subida
 * manual de foto) y alimenta el pipeline de vídeo V2 existente sin tocarlo.
 */
export async function POST(req: NextRequest) {
  const authHeader = higgsfieldAuthHeader();
  if (!authHeader) return NextResponse.json({ error: "Falta configurar Higgsfield." }, { status: 501 });

  const body = await req.json();
  const soulId = String(body?.soulId ?? "");
  const prompt = String(body?.prompt ?? "retrato profesional, mirando a cámara, luz de estudio, alta definición, fotorrealista");

  if (!soulId) return NextResponse.json({ error: "Falta soulId" }, { status: 400 });

  try {
    const res = await fetch("https://platform.higgsfield.ai/v1/text2image/soul", {
      method: "POST",
      headers: { Authorization: authHeader, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        prompt,
        custom_reference_id: soulId,
        custom_reference_strength: 1,
        width_and_height: "1536x2048",
        quality: "1080p",
        batch_size: 1,
      }),
    });

    if (!res.ok) {
      const details = await res.text().catch(() => "");
      return NextResponse.json({ error: `Higgsfield text2image/soul falló (${res.status}).`, details: details.slice(0, 500) }, { status: 502 });
    }

    const data = await res.json();
    const statusUrl = data?.status_url ?? data?.statusUrl ?? null;
    const imageUrl = data?.image?.url ?? data?.output?.url ?? null;

    if (imageUrl) return NextResponse.json({ estado: "completado", imageUrl });
    if (statusUrl) return NextResponse.json({ estado: "procesando", statusUrl, requestId: data?.request_id });
    return NextResponse.json({ estado: "procesando", mensaje: "Higgsfield está generando la foto…", raw: data });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error desconocido" }, { status: 500 });
  }
}
