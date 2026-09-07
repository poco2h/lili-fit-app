import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/** Pantalla 4 "Mis Alumnos" — tabla + métricas, a partir de followers + bolsa (canal "texto") + compras de packs. */
export async function GET(req: NextRequest) {
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  if (!ownerId) return NextResponse.json({ error: "Falta ownerId" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase no configurado" }, { status: 501 });

  const { data: followers, error: errFollowers } = await supabase
    .from("followers")
    .select("id, email, display_name, created_at")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (errFollowers) return NextResponse.json({ error: errFollowers.message }, { status: 500 });

  const followerIds = (followers ?? []).map((f) => f.id);

  const { data: wallets } = followerIds.length
    ? await supabase
        .from("follower_minute_wallets")
        .select("follower_id, balance_seconds")
        .eq("owner_id", ownerId)
        .eq("canal", "texto")
        .in("follower_id", followerIds)
    : { data: [] as { follower_id: string; balance_seconds: number }[] };

  const { data: compras } = await supabase
    .from("pack_purchases")
    .select("follower_id, amount_cents, pack_id, created_at, packs(name)")
    .eq("owner_id", ownerId)
    .eq("status", "completed");

  const balancePorFollower = new Map((wallets ?? []).map((w) => [w.follower_id, w.balance_seconds]));
  const ultimoPackPorFollower = new Map<string, string>();
  let ingresosMesCents = 0;
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  for (const c of compras ?? []) {
    const nombrePack = (c as { packs?: { name?: string } | null }).packs?.name;
    if (nombrePack && c.follower_id) ultimoPackPorFollower.set(c.follower_id, nombrePack);
    if (new Date(c.created_at as string) >= inicioMes) ingresosMesCents += c.amount_cents as number;
  }

  const alumnos = (followers ?? []).map((f) => {
    const balanceSeconds = balancePorFollower.get(f.id) ?? 0;
    return {
      id: f.id,
      email: f.email,
      displayName: f.display_name,
      pack: ultimoPackPorFollower.get(f.id) ?? null,
      balanceSeconds,
      estado: balanceSeconds === 0 ? "pendiente" : balanceSeconds < 30 * 60 ? "bolsa_baja" : "activo",
    };
  });

  return NextResponse.json({
    alumnos,
    metricas: {
      activos: alumnos.filter((a) => a.estado === "activo").length,
      bolsaBaja: alumnos.filter((a) => a.estado === "bolsa_baja").length,
      ingresosMesEur: Math.round(ingresosMesCents) / 100,
    },
  });
}
