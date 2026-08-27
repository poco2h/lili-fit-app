import { NextRequest, NextResponse } from "next/server";
import { generarSesionConexionTerra } from "@/lib/wearables/terra";

export async function GET(req: NextRequest) {
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  if (!ownerId) return NextResponse.json({ error: "Falta ownerId" }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mindtwin-app.vercel.app";
  const base = `${appUrl}/app/fuentes`;

  const resultado = await generarSesionConexionTerra({
    ownerId,
    redirectExitoUrl: `${base}?terra_conectado=1`,
    redirectErrorUrl: `${base}?terra_error=1`,
  });
  if (!resultado.ok) return NextResponse.json({ error: resultado.motivo }, { status: 501 });

  return NextResponse.json({ ok: true, url: resultado.data });
}
