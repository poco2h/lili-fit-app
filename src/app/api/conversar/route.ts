import { NextRequest, NextResponse } from "next/server";
import { responderConversar } from "@/lib/conversar/engine";
import type { Role } from "@/lib/conversar/guardrails";
import { obtenerSportsContext, resumenParaPrompt } from "@/lib/sports/sync";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const mensaje = String(body?.mensaje ?? "").slice(0, 2000);
  const role: Role = body?.role === "owner" ? "owner" : "follower";
  const ownerName = String(body?.ownerName ?? "tu profesional");
  const ownerId = body?.ownerId ? String(body.ownerId) : undefined;
  const marcas = Array.isArray(body?.marcas) ? body.marcas : [];
  const marcaYaMencionada = Boolean(body?.marcaYaMencionada);
  const celebId = body?.celebId ? String(body.celebId) : null; // solo Lili Celebs
  const historial = Array.isArray(body?.historial) ? body.historial : undefined;

  if (!mensaje.trim()) {
    return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
  }

  const sportsContextResumen = celebId
    ? resumenParaPrompt(await obtenerSportsContext(celebId))
    : undefined;

  const resultado = await responderConversar({
    mensaje,
    role,
    ownerName,
    ownerId,
    marcas,
    marcaYaMencionada,
    sportsContextResumen,
    historial,
  });
  return NextResponse.json(resultado);
}
