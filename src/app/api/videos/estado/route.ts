import { NextRequest, NextResponse } from "next/server";
import { consultarEstadoVideo } from "@/lib/videos/pipeline";

export async function GET(req: NextRequest) {
  const statusUrl = req.nextUrl.searchParams.get("statusUrl");
  if (!statusUrl || !(statusUrl.startsWith("https://platform.higgsfield.ai/") || statusUrl.startsWith("heygen://"))) {
    return NextResponse.json({ estado: "error", mensaje: "statusUrl inválido" }, { status: 400 });
  }
  const resultado = await consultarEstadoVideo(statusUrl);
  return NextResponse.json(resultado);
}
