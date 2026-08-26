import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { DemoTwin } from "@/lib/demo/localTwin";

/**
 * Lectura/escritura server-side del DemoTwin (mismo blob que
 * /api/twin/profile, pero invocable directamente desde el motor de
 * Conversar en vez de vía HTTP — evita una vuelta de red extra en cada
 * turno del onboarding conversacional, V10 §5).
 */
export async function leerTwinServer(ownerId: string): Promise<DemoTwin | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data } = await supabase
    .from("twin_profiles")
    .select("demo_twin")
    .eq("owner_id", ownerId)
    .is("follower_id", null)
    .maybeSingle();

  const twin = data?.demo_twin as DemoTwin | undefined;
  return twin && Object.keys(twin).length > 0 ? twin : null;
}

export async function guardarTwinServer(ownerId: string, twin: DemoTwin): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const { data: existente } = await supabase
    .from("twin_profiles")
    .select("id")
    .eq("owner_id", ownerId)
    .is("follower_id", null)
    .maybeSingle();

  if (existente) {
    await supabase.from("twin_profiles").update({ demo_twin: twin, updated_at: new Date().toISOString() }).eq("id", existente.id);
  } else {
    await supabase.from("twin_profiles").insert({ owner_id: ownerId, demo_twin: twin });
  }
}
