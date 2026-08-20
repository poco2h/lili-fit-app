import { NextRequest, NextResponse } from "next/server";
import { consultarEstadoImagen } from "@/lib/videos/pipeline";

export async function GET(req: NextRequest) {
  const statusUrl = req.nextUrl.searchParams.get("statusUrl");
  if (!statusUrl || !statusUrl.startsWith("https://platform.higgsfield.ai/")) {
    return NextResponse.json({ estado: "error", mensaje: "statusUrl inválido" }, { status: 400 });
  }
  const resultado = await consultarEstadoImagen(statusUrl);
  return NextResponse.json(resultado);
}
