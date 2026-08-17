import { PROFESIONALES, type Profesional } from "@/lib/data/profesionales";

export type FiltrosBusqueda = {
  q?: string;
  especialidad?: string;
  ciudad?: string;
};

function normaliza(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Buscador determinista de profesionales — sin LLM, sin tokens, sin coste variable.
 * Filtro por coincidencia de texto sobre nombre/especialidad/ciudad. Nunca menciona
 * ni ordena por precio del profesional en la landing pública (V10 §8.2:
 * "El cliente ve el precio que fija el profesional" solo tras contactar).
 */
export function buscarProfesionales(filtros: FiltrosBusqueda): Profesional[] {
  const q = filtros.q ? normaliza(filtros.q) : "";
  const especialidad = filtros.especialidad ? normaliza(filtros.especialidad) : "";
  const ciudad = filtros.ciudad ? normaliza(filtros.ciudad) : "";

  return PROFESIONALES.filter((p) => {
    const haystack = normaliza(`${p.nombre} ${p.especialidad} ${p.ciudad} ${p.bio}`);
    if (q && !haystack.includes(q)) return false;
    if (especialidad && !normaliza(p.especialidad).includes(especialidad)) return false;
    if (ciudad && !normaliza(p.ciudad).includes(ciudad)) return false;
    return true;
  });
}

/**
 * Reordena (no filtra) para que los profesionales de la ciudad detectada
 * por IP (V10 §8.2) aparezcan primero, sin ocultar el resto. Determinista:
 * mismo `ciudadDetectada` siempre produce el mismo orden.
 */
export function ordenarPorProximidad(
  profesionales: Profesional[],
  ciudadDetectada: string | null
): Profesional[] {
  if (!ciudadDetectada) return profesionales;
  const ciudad = normaliza(ciudadDetectada);
  return [...profesionales].sort((a, b) => {
    const aCerca = normaliza(a.ciudad) === ciudad ? 0 : 1;
    const bCerca = normaliza(b.ciudad) === ciudad ? 0 : 1;
    return aCerca - bCerca;
  });
}
