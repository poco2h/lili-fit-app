import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/** Resuelve un slug público (`/mt/[slug]`) a los datos no sensibles del owner + sus packs activos. */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Falta slug" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase no configurado" }, { status: 501 });

  const { data: owner, error } = await supabase
    .from("owners")
    .select("id, name, especialidad, vertical, mindscore, mindtwin_status")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !owner || owner.mindtwin_status !== "active") {
    return NextResponse.json({ error: "MindTwin no encontrado o todavía no activo." }, { status: 404 });
  }

  const { data: packs } = await supabase
    .from("packs")
    .select("id, name, description, hours, price_cents")
    .eq("owner_id", owner.id)
    .eq("is_active", true)
    .order("price_cents", { ascending: true });

  return NextResponse.json({
    ownerId: owner.id,
    name: owner.name,
    especialidad: owner.especialidad,
    vertical: owner.vertical,
    mindscore: owner.mindscore,
    packs: packs ?? [],
  });
}
