import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Profesional } from "@/lib/data/profesionales";
import type { FiltrosBusqueda } from "@/lib/search/buscarProfesionales";

/**
 * Buscador público de profesionales (`/clientes/buscar`) — antes filtraba
 * sobre un array de 4 nombres de ejemplo (`PROFESIONALES`), así que un
 * profesional real dado de alta (Lili Fit clásico o cualquier vertical del
 * Generador) nunca aparecía. Ahora consulta `owners` directamente. Sigue
 * siendo 100% determinista (filtro SQL ILIKE, sin LLM) — mismo principio
 * que el buscador de ejemplo (V10 §8.2: nunca precios, nunca IA aquí).
 */
export async function buscarProfesionalesReal(filtros: FiltrosBusqueda): Promise<Profesional[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  let query = supabase
    .from("owners")
    .select("id, name, especialidad, ciudad, slug")
    .eq("mindtwin_status", "active");

  if (filtros.especialidad) {
    query = query.ilike("especialidad", `%${filtros.especialidad}%`);
  }
  if (filtros.ciudad) {
    query = query.ilike("ciudad", `%${filtros.ciudad}%`);
  }
  if (filtros.q) {
    const q = filtros.q.replace(/[%_]/g, "");
    query = query.or(`name.ilike.%${q}%,especialidad.ilike.%${q}%`);
  }

  const { data, error } = await query.limit(50);
  if (error || !data) return [];

  return data.map((row) => ({
    slug: row.slug ?? row.id,
    nombre: row.name,
    especialidad: row.especialidad,
    ciudad: row.ciudad ?? "",
    bio: row.especialidad,
    precioTextoMin: 0,
  }));
}
