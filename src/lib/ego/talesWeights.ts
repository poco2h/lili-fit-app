import type { EgoId } from "./types";

export const TALES_FILOSOFOS = [
  "Demócrito", "Sócrates", "Aristóteles", "Epicuro", "Platón",
  "Séneca", "Gorgias", "Heráclito", "Homero", "Kant",
] as const;

export type Filosofo = (typeof TALES_FILOSOFOS)[number];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const n = (v: number) => clamp01(v / 100); // 0-100 -> 0-1

/**
 * tales_weights — pesos de las 9 lentes filosóficas TALES variables,
 * derivados de EGO ID por fórmulas fijas (V10 §2.1, sin LLM), + Kant como
 * meta-lente ética fija con peso 1.0 (confirmado en la doc de referencia
 * "MI CEREBRO · Arquitectura v1.0": "Kant — meta-lente ética fija, peso 1.0").
 * Antes llamado framework "LALA" — renombrado en agosto 2026.
 */
export function calcularTalesWeights(ego: EgoId): Record<Filosofo, number> {
  const eneatipo = ego.eneagrama.tipo;
  const esEneatipo = (...tipos: number[]) => (tipos.includes(eneatipo) ? 1 : 0.4);

  return {
    "Demócrito": clamp01(n(ego.big_five.O) * 0.6 + n(ego.teique.ie_global) * 0.4),
    "Sócrates": clamp01(esEneatipo(5, 6) * 0.6 + (ego.apego === "seguro" ? 1 : 0.3) * 0.4),
    "Aristóteles": clamp01(n(ego.big_five.C) * 0.7 + 0.3),
    "Epicuro": clamp01((ego.rfq === "promocion" ? 1 : 0.3) * 0.5 + n(ego.teique.bienestar) * 0.5),
    "Platón": clamp01(n(ego.big_five.O) * 0.5 + esEneatipo(4) * 0.5),
    "Séneca": clamp01((ego.rfq === "prevencion" ? 1 : 0.3) * 0.5 + (1 - n(ego.big_five.N)) * 0.5),
    "Gorgias": clamp01(n(ego.big_five.E) * 0.5 + (1 - n(ego.big_five.A)) * 0.5) * 0.6, // "reducido"
    "Heráclito": clamp01(n(ego.big_five.O) * 0.5 + esEneatipo(7, 8) * 0.5),
    "Homero": clamp01(n(ego.big_five.E) * 0.4 + 0.5) * 0.6, // "reducido"
    "Kant": 1.0, // fijo — meta-lente ética, nunca varía
  };
}
