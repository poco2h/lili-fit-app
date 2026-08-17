export type Dimension =
  | "O" | "C" | "E" | "A" | "N" // Big Five
  | "ecr_ansioso" | "ecr_evitativo"
  | "rfq_promocion" | "rfq_prevencion"
  | "teique_bienestar" | "teique_autocontrol" | "teique_emocionalidad" | "teique_sociabilidad"
  | `via_${string}`
  | `eneagrama_${number}`;

export type LikertItem = {
  id: string;
  test: "bfi20" | "eneagrama36" | "ecr4" | "rfq6" | "teique30" | "via24";
  texto: string;
  dimension: Dimension;
  reverse?: boolean; // puntuación invertida (6 - respuesta) en escala 1-5
};

export type Respuestas = Record<string, number>; // itemId -> 1..5

export type EgoId = {
  big_five: { O: number; C: number; E: number; A: number; N: number }; // 0-100
  eneagrama: { tipo: number; ala: number; scores: Record<number, number> };
  apego: "seguro" | "ansioso" | "evitativo" | "desorganizado";
  rfq: "promocion" | "prevencion";
  teique: { ie_global: number; bienestar: number; autocontrol: number; emocionalidad: number; sociabilidad: number };
  via_top5: string[];
  indices: { IR: number; IA: number; IEj: number; IC: number };
  serialized: string;
};

export const VIA_FORTALEZAS = [
  "Creatividad", "Curiosidad", "Juicio", "Amor por aprender", "Perspectiva",
  "Valentía", "Perseverancia", "Honestidad", "Vitalidad",
  "Amor", "Amabilidad", "Inteligencia social",
  "Trabajo en equipo", "Equidad", "Liderazgo",
  "Perdón", "Humildad", "Prudencia", "Autorregulación",
  "Apreciación de la belleza", "Gratitud", "Esperanza", "Humor", "Espiritualidad",
];
