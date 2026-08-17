import { createBrowserClient } from "@supabase/ssr";

/** Cliente Supabase de navegador. Null si el proyecto todavía no está configurado. */
export function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}
