import type { EgoId } from "@/lib/ego/types";
import type { Filosofo } from "@/lib/ego/talesWeights";

/**
 * owner_psychotwin (§1/§11 del prompt de Constancia): "resumen del Psychotwin:
 * estilo comunicativo, frases características, tono". No existe un campo
 * separado para esto — se genera de forma determinista (sin LLM) a partir
 * del EGO ID real y las lentes TALES dominantes del owner, para no inventar
 * un perfil que no está respaldado por datos reales.
 */
export function resumenPsychotwin(ego: EgoId, talesDominantes: Filosofo[]): string {
  const directo = ego.big_five.C >= 60 && ego.big_five.A < 60;
  const calido = ego.big_five.A >= 60;
  const analitico = ego.big_five.C >= 60;
  const narrativo = talesDominantes.includes("Homero") || talesDominantes.includes("Platón");
  const socratico = talesDominantes.includes("Sócrates");

  const rasgos: string[] = [];
  if (directo) rasgos.push("directo, va al grano");
  if (calido) rasgos.push("cálido y cercano");
  if (analitico && !directo) rasgos.push("estructurado y preciso");
  if (narrativo) rasgos.push("habla con ejemplos e historias, no con listas");
  if (socratico) rasgos.push("prefiere preguntar antes que sentenciar");
  if (ego.rfq === "promocion") rasgos.push("enmarca todo en términos de logro y progreso");
  else rasgos.push("enmarca todo en términos de cuidar lo que ya se ha conseguido");

  return rasgos.slice(0, 3).join("; ") || "tono cercano y profesional, sin adornos";
}
