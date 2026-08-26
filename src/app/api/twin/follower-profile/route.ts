import { NextRequest, NextResponse } from "next/server";
import { resolveFollowerUuid } from "@/lib/demo/identities";
import { leerTwinServer } from "@/lib/session/twinProfileServer";

/**
 * Lee el DemoTwin propio del Follower (su EGO ID, S1-S3) — análogo a
 * /api/twin/profile pero resolviendo primero su id local (sin login,
 * followerLocalId.ts) al UUID real de `followers` vía el mismo mecanismo
 * ya usado por la facturación (src/lib/demo/identities.ts).
 */
export async function GET(req: NextRequest) {
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  const followerId = req.nextUrl.searchParams.get("followerId");
  if (!ownerId || !followerId) return NextResponse.json({ twin: null });

  const followerUuid = await resolveFollowerUuid(followerId, ownerId);
  if (!followerUuid) return NextResponse.json({ twin: null });

  const twin = await leerTwinServer(ownerId, followerUuid);
  return NextResponse.json({ twin });
}
