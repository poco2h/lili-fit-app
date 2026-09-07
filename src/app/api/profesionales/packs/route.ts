import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/** Packs de horas del owner (Pantalla 4 "Mis Packs de Horas" / Pantalla 5 pública). */
export async function GET(req: NextRequest) {
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  if (!ownerId) return NextResponse.json({ error: "Falta ownerId" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase no configurado" }, { status: 501 });

  const soloActivos = req.nextUrl.searchParams.get("activos") === "true";
  let query = supabase.from("packs").select("*").eq("owner_id", ownerId).order("price_cents", { ascending: true });
  if (soloActivos) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ packs: data });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase no configurado" }, { status: 501 });

  const body = await req.json();
  const ownerId = String(body?.ownerId ?? "");
  const name = String(body?.name ?? "").trim();
  const description = body?.description ? String(body.description).trim() : null;
  const hours = Number(body?.hours ?? 0);
  const priceEur = Number(body?.priceEur ?? 0);

  if (!ownerId || !name || hours <= 0 || priceEur <= 0) {
    return NextResponse.json({ error: "Faltan campos o valores inválidos (nombre, horas, precio)." }, { status: 400 });
  }

  const { data: owner } = await supabase.from("owners").select("min_hourly_rate_cents").eq("id", ownerId).maybeSingle();
  const minCents = owner?.min_hourly_rate_cents ?? 600;
  const priceCents = Math.round(priceEur * 100);
  if (priceCents / hours < minCents) {
    return NextResponse.json(
      { error: `El precio mínimo es de ${(minCents / 100).toFixed(2)}€/hora.` },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("packs")
    .insert({ owner_id: ownerId, name, description, hours, price_cents: priceCents })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pack: data });
}

export async function PATCH(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase no configurado" }, { status: 501 });

  const body = await req.json();
  const packId = String(body?.packId ?? "");
  const isActive = Boolean(body?.isActive);
  if (!packId) return NextResponse.json({ error: "Falta packId" }, { status: 400 });

  const { error } = await supabase.from("packs").update({ is_active: isActive }).eq("id", packId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
