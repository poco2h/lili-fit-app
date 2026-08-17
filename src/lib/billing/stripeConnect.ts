/**
 * Split de revenue Lili Celebs — decisión del usuario (13 ago 2026): 70%
 * celeb / 30% Poco2h, tal y como aparece en las landings reales (V10 y
 * BrainTwin_Arquitectura documentan 65/35; se prioriza el valor de las
 * landings publicadas por decisión explícita).
 */
export const SPLIT_CELEB = 0.7;
export const SPLIT_POCO2H = 0.3;

export function calcularSplit(finalPriceEur: number) {
  return {
    celebEur: Math.round(finalPriceEur * SPLIT_CELEB * 100) / 100,
    poco2hEur: Math.round(finalPriceEur * SPLIT_POCO2H * 100) / 100,
  };
}
