import { NextRequest, NextResponse } from "next/server";
import { resolveOwnerUuid, resolveFollowerUuid } from "@/lib/demo/identities";

/**
 * Guarda el nombre que el alumno escribe al entrar a una sesión de Visual
 * Coach (sin registro). Se llama una vez al empezar, antes de la
 * cámara/billing, para que el dashboard del profesor ya lo muestre aunque
 * el alumno no llegue a generar ningún evento.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const ownerId = String(body?.ownerId ?? "");
  const followerId = String(body?.followerId ?? "");
  const displayName = String(body?.displayName ?? "").trim();
  if (!ownerId || !followerId || !displayName) {
    return NextResponse.json({ error: "Faltan ownerId, followerId o displayName" }, { status: 400 });
  }

  try {
    const ownerUuid = await resolveOwnerUuid(ownerId);
    if (!ownerUuid) return NextResponse.json({ error: "Supabase no configurado" }, { status: 501 });
    await resolveFollowerUuid(followerId, ownerUuid, displayName);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error desconocido" }, { status: 500 });
  }
}
