import { NextRequest, NextResponse } from "next/server";
import { higgsfieldAuthHeader } from "@/lib/videos/pipeline";

/**
 * Entrena un "Soul ID" de Higgsfield — personaje consistente entrenado a
 * partir de 20+ fotos de la misma persona (proceso real, 3-5 min), en vez
 * del image2video de una sola foto que usábamos hasta ahora. Sin API/SDK
 * oficial de TypeScript documentada al detalle en REST puro; usamos el
 * mismo header "Authorization: Key {id}:{secret}" que ya funciona para
 * platform.higgsfield.ai en src/lib/videos/pipeline.ts — si Higgsfield
 * exige aquí un esquema distinto (p.ej. hf-api-key/hf-secret), el error
 * de la API llegará explícito al frontend para poder ajustarlo.
 */
export async function POST(req: NextRequest) {
  const authHeader = higgsfieldAuthHeader();
  if (!authHeader) {
    return NextResponse.json({ error: "Falta configurar HIGGSFIELD_API_KEY/HIGGSFIELD_API_KEY_ID." }, { status: 501 });
  }

  const body = await req.json();
  const ownerName = String(body?.ownerName ?? "MindTwin");
  const photoUrls = Array.isArray(body?.photoUrls) ? (body.photoUrls as string[]) : [];

  if (photoUrls.length < 20) {
    return NextResponse.json(
      { error: `Higgsfield Soul ID necesita al menos 20 fotos — has enviado ${photoUrls.length}.` },
      { status: 400 }
    );
  }

  try {
    const res = await fetch("https://platform.higgsfield.ai/v1/custom-references", {
      method: "POST",
      headers: { Authorization: authHeader, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name: `MindTwin · ${ownerName}`,
        input_images: photoUrls.map((url) => ({ type: "image_url", image_url: url })),
      }),
    });

    if (!res.ok) {
      const details = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Higgsfield rechazó el entrenamiento del Soul (${res.status}).`, details: details.slice(0, 500) },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json({ ok: true, soulTrainingId: data?.id, raw: data });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error desconocido" }, { status: 500 });
  }
}
