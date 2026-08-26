import type { DemoTwin } from "@/lib/demo/localTwin";
import { TALES_FILOSOFOS, type Filosofo } from "@/lib/ego/talesWeights";

/**
 * Bloque TALES para el system prompt de N3 (Framework TALES v2.0, DOC 2 —
 * TALES_system_prompt_template.md, PDF entregado 2026-08-26). Calibra el
 * tono/estilo de razonamiento del twin al EGO ID del owner ("primera función
 * de TALES", §1.3). tales_state (el "GPS" del pre-procesador N2, §2.3-2.5)
 * NO está implementado todavía — esto es solo el "mapa" (tales_weights),
 * fase 1 de la hoja de ruta del framework (§3.6).
 */
const FUNCION_FILOSOFO: Record<Exclude<Filosofo, "Kant">, string> = {
  "Demócrito": "curiosidad, pensamiento lateral, exploración de posibilidades",
  "Sócrates": "mayéutica — preguntas que desafían sin confrontar",
  "Aristóteles": "análisis sistemático, estructura, búsqueda del equilibrio",
  "Epicuro": "valor del placer presente, autocompasión, hedonismo sostenible",
  "Platón": "idealismo, visión de largo plazo, conexión con el propósito",
  "Séneca": "estoicismo práctico: gestión del riesgo y la adversidad",
  "Gorgias": "retórica persuasiva, comunicación efectiva (peso limitado, evita manipulación)",
  "Heráclito": "cambio como constante natural, pensamiento dialéctico, antirrigidez",
  "Homero": "narrativa épica personal — conecta al owner con su propia historia",
};

/** peso_efectivo[i] = tales_weights[i] × tales_data_factor[i] — sin tales_state (fase 2, no implementada aún). */
function pesoEfectivo(twin: DemoTwin, filosofo: Filosofo): number {
  const peso = twin.tales_weights?.[filosofo] ?? 0;
  const dataFactor = 1 + (twin.tales_data?.[filosofo] ?? 0) * 0.2;
  return Math.min(1, peso * dataFactor);
}

const KANT_BLOQUE =
  "[KANT — META-LENTE ÉTICA · SIEMPRE ACTIVO · PESO = 1.0]\n" +
  "Dimensión 1 — Ética humana: cuando el contexto involucra decisiones que afectan a otros, introduce sutilmente " +
  "la perspectiva del impacto colectivo. No mediante juicio explícito — mediante preguntas o encuadres que inviten " +
  "a considerar el efecto en terceros. Principio: si esta acción se convirtiera en norma universal, ¿qué mundo produciría?\n" +
  "Dimensión 2 — Consciencia planetaria: cuando el contexto lo permite de forma natural (hábitos, consumo, " +
  "alimentación, movilidad), incorpora brevemente la perspectiva del impacto en el planeta. Nunca como sermón.\n" +
  "Kant no desvía conversaciones ni supera el 15% de la respuesta. Una frase es suficiente. Planta semillas, no impone.";

/**
 * Serializa EGO ID + pesos TALES del owner en un bloque de system prompt.
 * twin === null (fuentes/EGO ID todavía sin completar) → devuelve "" y el
 * prompt cae en el tono genérico de systemInstructionBase, sin romper nada.
 */
export function bloqueTalesPrompt(twin: DemoTwin | null): string {
  if (!twin?.ego?.serialized || !twin.tales_weights) return "";

  const filosofosVariables = TALES_FILOSOFOS.filter((f): f is Exclude<Filosofo, "Kant"> => f !== "Kant")
    .map((f) => ({ f, peso: pesoEfectivo(twin, f) }))
    .sort((a, b) => b.peso - a.peso);

  const lineasFilosofos = filosofosVariables
    .map(({ f, peso }) => `- ${f} (${Math.round(peso * 100)}%): ${FUNCION_FILOSOFO[f]}`)
    .join("\n");

  return (
    `[TALES — EGO ID del owner: ${twin.ego.serialized}]\n` +
    `Estas son las 9 lentes filosóficas variables que calibran tu tono y forma de razonar, de más a menos presentes ` +
    `en este owner — no cambian de qué hablas, cambian cómo razonas sobre ello:\n${lineasFilosofos}\n\n` +
    `${KANT_BLOQUE}`
  );
}
