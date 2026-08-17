export type Canal = "texto" | "voz" | "video_rt";

/**
 * Tasas variables base en €/minuto (coste de infraestructura Gemini/ElevenLabs/Tavus/LiveKit).
 * Fuente: Especificación Lili Fit Backend v1.0 (§11).
 */
export const TASA_VARIABLE: Record<Canal, number> = {
  texto: 0.001048,
  voz: 0.047048,
  video_rt: 0.153048,
};

export const FIJO_SESION_EUR = 0.76;
export const MULTIPLICADOR_BASE = 3.0; // Margen base plataforma (V10 §0.2)
export const IVA_FACTOR = 1.21; // 21% IVA España

export type PaqueteMinutos = 20 | 40 | 60;

/**
 * Tabla oficial de precios base para paquetes estándar (IVA incluido).
 * Texto: 20 min = 2,83 €, 40 min = 2,91 €, 60 min = 2,99 €
 * Voz: 20 min = 6,17 €, 40 min = 9,59 €, 60 min = 13,01 €
 * Video RT: 20 min = 13,87 €, 40 min = 24,98 €, 60 min = 36,09 €
 */
export const PRECIOS_BASE_PAQUETES: Record<Canal, Record<PaqueteMinutos, number>> = {
  texto: {
    20: 2.83,
    40: 2.91,
    60: 2.99,
  },
  voz: {
    20: 6.17,
    40: 9.59,
    60: 13.01,
  },
  video_rt: {
    20: 13.87,
    40: 24.98,
    60: 36.09,
  },
};

/**
 * Calcula el precio base de Lili Fit para un número arbitrario de minutos reales.
 * Fórmula: (0,76 € fijo + tasa_variable × minutos) × 3 × 1,21
 */
export function calcularPrecioBase(canal: Canal, minutosReales: number): number {
  const min = Math.max(0, minutosReales);
  const bruto = (FIJO_SESION_EUR + TASA_VARIABLE[canal] * min) * MULTIPLICADOR_BASE * IVA_FACTOR;
  return Math.round(bruto * 100) / 100;
}

/**
 * Calcula el precio final al cliente, aplicando el margen personalizado del profesional si existe.
 * Precio final = precio_base_Mylili × (1 + margen_profesional_pct / 100)
 */
export function calcularPrecioFinal(
  canal: Canal,
  minutosReales: number,
  margenProfesionalPct: number = 0
): number {
  const base = calcularPrecioBase(canal, minutosReales);
  if (margenProfesionalPct <= 0) return base;
  const finalPrice = base * (1 + margenProfesionalPct / 100);
  return Math.round(finalPrice * 100) / 100;
}

/**
 * Alias para compatibilidad con código existente.
 */
export function calcularPrecio(canal: Canal, minutos: number): number {
  return calcularPrecioFinal(canal, minutos, 0);
}
