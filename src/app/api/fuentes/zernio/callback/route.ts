import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { DemoTwin, Sources } from "@/lib/demo/localTwin";

/** Zernio redirige aquí tras el OAuth con ?connected={platform}&accountId=Y&username=Z añadidos a nuestro redirect_url original (que ya llevaba ?ownerId=X). */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const ownerId = params.get("ownerId");
  const plataforma = params.get("connected") as keyof Sources | null;
  const accountId = params.get("accountId");
  const username = params.get("username");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mindtwin-app.vercel.app";
  const destino = new URL("/app/fuentes", appUrl);

  const supabase = getSupabaseAdmin();
  if (!supabase || !ownerId || !plataforma || !accountId) {
    destino.searchParams.set("zernio_error", "1");
    return NextResponse.redirect(destino);
  }

  const { data: existente } = await supabase
    .from("twin_profiles")
    .select("id, demo_twin")
    .eq("owner_id", ownerId)
    .is("follower_id", null)
    .maybeSingle();

  const twinActual = (existente?.demo_twin as DemoTwin | undefined) ?? ({} as DemoTwin);
  const twinActualizado: DemoTwin = {
    ...twinActual,
    sources: { ...twinActual.sources, [plataforma]: true },
    sources_data: {
      ...twinActual.sources_data,
      [plataforma]: { detalle: username || accountId, conectadoEn: new Date().toISOString() },
    },
  };

  if (existente) {
    await supabase.from("twin_profiles").update({ demo_twin: twinActualizado, updated_at: new Date().toISOString() }).eq("id", existente.id);
  } else {
    await supabase.from("twin_profiles").insert({ owner_id: ownerId, demo_twin: twinActualizado });
  }

  destino.searchParams.set("zernio_conectado", plataforma);
  return NextResponse.redirect(destino);
}
