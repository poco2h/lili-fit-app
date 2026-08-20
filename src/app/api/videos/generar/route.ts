import { NextRequest, NextResponse } from "next/server";
import { generarVideo, type VariantePV } from "@/lib/videos/pipeline";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const variante = (body?.variante as VariantePV) ?? "v3";
  const guion = String(body?.guion ?? "").slice(0, 4000);
  const ownerId = body?.ownerId ? String(body.ownerId) : undefined;

  if (!guion.trim()) {
    return NextResponse.json({ error: "El guion no puede estar vacío" }, { status: 400 });
  }

  const resultado = await generarVideo(variante, guion, ownerId);
  return NextResponse.json(resultado);
}
