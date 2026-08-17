import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Cliente Supabase server-side (service role). Devuelve null si el proyecto
 * todavía no está configurado — las server actions deben degradar con gracia
 * (simular éxito + log) en vez de romper la UI mientras no tengamos las
 * credenciales del proyecto MindTwin dedicado.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!cached) cached = createClient(url, key);
  return cached;
}
