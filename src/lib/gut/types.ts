/** Archivo cargado manualmente por el profesional para enriquecer el GUT ID (niveles N3/N4). */
export type GutArchivoManual = {
  fileUrl: string;
  fileName: string;
  subidoEn: string; // ISO date
};

export type GutData = {
  source: "n1_import" | "conversational" | null;
  gut_baseline_score: number | null; // 0-1000 (escala ampliada V10.1, antes 0-100)
  bacterias_dominantes: string[];
  bacterias_deficientes: string[];
  gatillos: string[];
  sintomas: string[];
  n1_connected: boolean;
  n1_user_id: string | null;
  last_updated: string | null; // ISO date
  /** N3 — Bioimpedancia (PDF/CSV del dispositivo de medición). */
  n3_bioimpedancia: GutArchivoManual | null;
  /** N4 — Test de microbioma (heces), informe de laboratorio. */
  n4_microbioma: GutArchivoManual | null;
};

export const GUT_DATA_VACIO: GutData = {
  source: null,
  gut_baseline_score: null,
  bacterias_dominantes: [],
  bacterias_deficientes: [],
  gatillos: [],
  sintomas: [],
  n1_connected: false,
  n1_user_id: null,
  last_updated: null,
  n3_bioimpedancia: null,
  n4_microbioma: null,
};

/** Badge de fidelidad del GUT ID (V10 §3): <7 días = Actualizado, >30 días = Desactualizado. */
export function badgeGutId(gut: GutData): "sin-datos" | "actualizado" | "desactualizado" {
  if (!gut.last_updated) return "sin-datos";
  const dias = (Date.now() - new Date(gut.last_updated).getTime()) / (1000 * 60 * 60 * 24);
  if (dias > 30) return "desactualizado";
  return "actualizado";
}
