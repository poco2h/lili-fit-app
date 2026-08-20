import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/** Fija una URL de foto ya generada (Soul ID) como avatar del owner. */
export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase no configurado" }, { status: 501 });

  const body = await req.json();
  const ownerId = String(body?.ownerId ?? "");
  const avatarUrl = String(body?.avatarUrl ?? "");
  if (!ownerId || !avatarUrl) return NextResponse.json({ error: "Faltan ownerId o avatarUrl" }, { status: 400 });

  const { data: existente } = await supabase
    .from("twin_profiles")
    .select("id")
    .eq("owner_id", ownerId)
    .is("follower_id", null)
    .maybeSingle();

  if (existente) {
    await supabase.from("twin_profiles").update({ avatar_soul_id: avatarUrl }).eq("id", existente.id);
  } else {
    await supabase.from("twin_profiles").insert({ owner_id: ownerId, avatar_soul_id: avatarUrl });
  }

  return NextResponse.json({ ok: true });
}
