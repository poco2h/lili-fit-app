import type { Filosofo } from "@/lib/ego/talesWeights";

/**
 * Pre-procesador N2 (Framework TALES v2.0 DOC 3 — TALES_preprocessor_rules.md,
 * PDF entregado 2026-08-26 §2.3-2.5). Determinista, sin LLM, sin coste de
 * tokens: analiza el mensaje ENTRANTE del owner/follower y calcula un boost
 * temporal por filósofo (el "GPS", tales_state) válido solo para esta
 * respuesta — NO sustituye tales_weights (el "mapa"), lo modula.
 */
export type TalesState = Partial<Record<Exclude<Filosofo, "Kant">, number>>;

export type ResultadoN2 = {
  talesState: TalesState;
  kantTriggerEtica: boolean;
  kantTriggerPlaneta: boolean;
};

const DIACRITICOS = /[̀-ͯ]/g;

const NEGACIONES = ["no", "nunca", "jamás", "tampoco", "nada", "nadie", "ninguno", "ninguna"];
const ADJETIVOS_EXTREMOS = ["siempre", "nunca", "totalmente", "completamente", "perfecto", "imposible", "mejor", "peor", "único", "increíble"];
const PALABRAS_PLANETA = ["consumo", "consum", "viaj", "alimentaci", "comida", "dieta", "avión", "coche", "plástico", "ropa", "compra", "reciclar", "energía"];
const PALABRAS_ETICA = ["presion", "obligar", "castig", "juzgar", "culpa", "despedir", "mis jugadores", "mi equipo", "mis empleados", "mis clientes", "decisión sobre"];

function normalizar(texto: string): string {
  return texto.toLowerCase().normalize("NFD").replace(DIACRITICOS, "");
}

function palabras(texto: string): string[] {
  return normalizar(texto).match(/[a-z]+/g) ?? [];
}

function frases(texto: string): string[] {
  return texto
    .split(/[.!?\n]+/)
    .map((f) => f.trim())
    .filter(Boolean);
}

function sube(state: TalesState, filosofo: Exclude<Filosofo, "Kant">, delta: number) {
  state[filosofo] = Math.min(0.5, (state[filosofo] ?? 0) + delta);
}

/** Análisis lingüístico determinista del mensaje entrante — sin LLM. */
export function analizarMensajeN2(mensaje: string): ResultadoN2 {
  const talesState: TalesState = {};
  const texto = mensaje.trim();
  const listaPalabras = palabras(texto);
  const listaFrases = frases(texto);
  const totalPalabras = listaPalabras.length || 1;

  if (listaFrases.length > 0) {
    const mediaPalabrasPorFrase = listaFrases.reduce((acc, f) => acc + palabras(f).length, 0) / listaFrases.length;
    if (mediaPalabrasPorFrase > 0 && mediaPalabrasPorFrase < 8) {
      sube(talesState, "Séneca", 0.3);
      sube(talesState, "Aristóteles", 0.2);
    }
  }

  const conteoYo = listaPalabras.filter((p) => p === "yo").length;
  if (conteoYo / totalPalabras > 0.4) {
    sube(talesState, "Sócrates", 0.4);
  }

  const listaNegaciones = NEGACIONES.map(normalizar);
  const conteoNegaciones = listaPalabras.filter((p) => listaNegaciones.includes(p)).length;
  if (conteoNegaciones / totalPalabras > 0.2) {
    sube(talesState, "Epicuro", 0.3);
    sube(talesState, "Homero", 0.2);
  }

  const tieneFuturo = /\b\w+(re|ras|ra|remos|reis|ran)\b/.test(normalizar(texto)) || /\b(voy a|vamos a)\b/.test(normalizar(texto));
  const listaAdjetivos = ADJETIVOS_EXTREMOS.map(normalizar);
  const tieneAdjetivoExtremo = listaPalabras.some((p) => listaAdjetivos.includes(p));
  if (tieneFuturo && tieneAdjetivoExtremo) {
    sube(talesState, "Sócrates", 0.3);
    sube(talesState, "Aristóteles", 0.2);
  }

  const conteoElipsis = (texto.match(/\.\.\./g) ?? []).length;
  const fragmentosCortos = listaFrases.filter((f) => {
    const n = palabras(f).length;
    return n > 0 && n <= 2;
  }).length;
  if (conteoElipsis >= 2 || fragmentosCortos >= 2) {
    sube(talesState, "Aristóteles", 0.4);
  }

  const textoNormalizado = normalizar(texto);
  const kantTriggerPlaneta = PALABRAS_PLANETA.map(normalizar).some((p) => textoNormalizado.includes(p));
  const kantTriggerEtica = PALABRAS_ETICA.map(normalizar).some((p) => textoNormalizado.includes(p));

  return { talesState, kantTriggerEtica, kantTriggerPlaneta };
}
