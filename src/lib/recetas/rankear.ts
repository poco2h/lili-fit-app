import { BACTERIA_NUTRIENTE, RECETAS, type Receta } from "./data";

/**
 * Equivalente en TypeScript al RPC de Postgres `recetas_para_bacterias`
 * (arquitectura aprobada de sistema_recetas_microbioma.pdf): dado un
 * conjunto de bacterias bajas/deficientes, calcula qué nutrientes las
 * estimulan y devuelve las recetas ordenadas por nutrientes_cubiertos
 * DESC, LIMIT 10. Determinista, sin IA — mismo criterio que tendrá el
 * RPC real cuando se migre a Supabase.
 */
export function recetasParaBacterias(bacteriaIds: string[]): Receta[] {
  const nutrientesRelevantes = new Set(
    BACTERIA_NUTRIENTE.filter((bn) => bacteriaIds.includes(bn.bacteriaId)).map((bn) => bn.nutrienteId)
  );

  if (nutrientesRelevantes.size === 0) return RECETAS.slice(0, 10);

  return [...RECETAS]
    .map((r) => ({
      receta: r,
      nutrientesCubiertos: r.nutrienteIds.filter((n) => nutrientesRelevantes.has(n)).length,
    }))
    .filter((r) => r.nutrientesCubiertos > 0)
    .sort((a, b) => b.nutrientesCubiertos - a.nutrientesCubiertos)
    .slice(0, 10)
    .map((r) => r.receta);
}

/** Mapea nombres libres de bacterias deficientes (twin.gut) a los IDs del catálogo. */
export function nombresABacteriaIds(nombres: string[]): string[] {
  const normalizado = (s: string) => s.toLowerCase().split(" ")[0];
  const nombresNorm = nombres.map(normalizado);
  return [
    "akkermansia", "bifidobacterium", "faecalibacterium", "lactobacillus", "bacteroides", "prevotella", "ruminococcus",
  ].filter((id) => nombresNorm.some((n) => id.startsWith(n) || n.startsWith(id)));
}
