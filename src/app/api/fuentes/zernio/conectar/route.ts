import { NextRequest, NextResponse } from "next/server";
import { urlConexionZernio } from "@/lib/whatsapp/zernio";

const PLATAFORMAS = ["instagram", "tiktok", "whatsapp"] as const;
type Plataforma = (typeof PLATAFORMAS)[number];

function esPlataformaValida(v: string): v is Plataforma {
  return (PLATAFORMAS as readonly string[]).includes(v);
}

/**
 * Devuelve la URL de autorización OAuth de Zernio para instagram/tiktok/whatsapp
 * (confirmado real vía su OpenAPI público — no es el modal manual de fallback).
 * Si Zernio no está configurado (sin ZERNIO_API_KEY o sin perfil), devuelve un
 * error 501 para que el frontend caiga en el formulario manual existente.
 */
export async function GET(req: NextRequest) {
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  const plataforma = req.nextUrl.searchParams.get("plataforma") ?? "";
  if (!ownerId || !esPlataformaValida(plataforma)) {
    return NextResponse.json({ error: "Faltan ownerId o plataforma válida" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mindtwin-app.vercel.app";
  const redirectUrl = `${appUrl}/api/fuentes/zernio/callback?ownerId=${encodeURIComponent(ownerId)}`;

  const resultado = await urlConexionZernio(plataforma, redirectUrl);
  if (!resultado.ok) return NextResponse.json({ error: resultado.motivo }, { status: 501 });

  return NextResponse.json({ ok: true, url: resultado.data });
}
