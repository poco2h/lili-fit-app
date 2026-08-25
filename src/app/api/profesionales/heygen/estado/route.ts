import { NextRequest, NextResponse } from "next/server";
import { consultarEstadoVideoHeyGen } from "@/lib/videos/heygen";

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get("videoId");
  if (!videoId) return NextResponse.json({ estado: "error", mensaje: "Falta videoId" }, { status: 400 });
  const resultado = await consultarEstadoVideoHeyGen(videoId);
  return NextResponse.json(resultado);
}
