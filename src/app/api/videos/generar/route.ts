import { NextRequest, NextResponse } from "next/server";
import { generarVideo, type VariantePV } from "@/lib/videos/pipeline";

// Higgsfield image2video puede tardar más que el límite por defecto de la
// función serverless mientras sondeamos su status_url — ver src/lib/videos/pipeline.ts.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const variante = (body?.variante as VariantePV) ?? "v3";
  const guion = String(body?.guion ?? "").slice(0, 4000);

  if (!guion.trim()) {
    return NextResponse.json({ error: "El guion no puede estar vacío" }, { status: 400 });
  }

  const resultado = await generarVideo(variante, guion);
  return NextResponse.json(resultado);
}
