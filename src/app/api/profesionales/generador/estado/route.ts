import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/** Polling de la Pantalla 3 "Generando tu MindTwin..." — GET público (solo expone estado, no datos sensibles). */
export async function GET(req: NextRequest) {
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  if (!ownerId) return NextResponse.json({ error: "Falta ownerId" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase no configurado" }, { status: 501 });

  const { data: owner, error } = await supabase
    .from("owners")
    .select("id, name, slug, vertical, mindtwin_status, mindtwin_error, mindscore, stripe_conectado")
    .eq("id", ownerId)
    .maybeSingle();

  if (error || !owner) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json({
    status: owner.mindtwin_status,
    error: owner.mindtwin_error,
    slug: owner.slug,
    vertical: owner.vertical,
    mindscore: owner.mindscore,
    pagado: owner.stripe_conectado,
  });
}
