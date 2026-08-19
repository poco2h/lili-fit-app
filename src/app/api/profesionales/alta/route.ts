import { NextRequest, NextResponse } from "next/server";
import { altaVisitanteProfesional } from "@/lib/access/profesionalAuth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = String(body?.email ?? "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, error: "Email inválido." }, { status: 400 });
  }

  const resultado = await altaVisitanteProfesional(email);
  if (!resultado.ok) {
    return NextResponse.json(resultado, { status: 400 });
  }
  return NextResponse.json(resultado);
}
