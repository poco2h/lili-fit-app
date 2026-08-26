import { NextRequest, NextResponse } from "next/server";
import { listarSesionesFollower } from "@/lib/billing/store";

export async function GET(req: NextRequest) {
  const ownerId = req.nextUrl.searchParams.get("ownerId") ?? "demo_owner";
  const followerId = req.nextUrl.searchParams.get("followerId") ?? "demo_follower";

  try {
    const sesiones = await listarSesionesFollower(ownerId, followerId);
    return NextResponse.json({ sesiones });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error desconocido" }, { status: 500 });
  }
}
