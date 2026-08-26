import type { DemoTwin } from "@/lib/demo/localTwin";
import { TALES_FILOSOFOS, type Filosofo } from "@/lib/ego/talesWeights";
import { analizarMensajeN2, type TalesState } from "@/lib/conversar/preprocessorN2";

/**
 * Bloque TALES para el system prompt de N3 (Framework TALES v2.0, DOC 2 —
 * TALES_system_prompt_template.md, PDF entregado 2026-08-26). Calibra el
 * tono/estilo de razonamiento del twin al EGO ID del owner ("primera función
 * de TALES", §1.3) y, desde la Fase 2, también al estado de ego detectado en
 * el mensaje entrante por el pre-procesador N2 (tales_state, "segunda
 * función de TALES" / el "GPS", §1.4 y §2.3-2.5).
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

/** peso_efectivo[i] = tales_weights[i] × (1 + tales_state[i]) × tales_data_factor[i] — fórmula §2.7. */
function pesoEfectivo(twin: DemoTwin, filosofo: Exclude<Filosofo, "Kant">, talesState: TalesState): number {
  const peso = twin.tales_weights?.[filosofo] ?? 0;
  const boost = talesState[filosofo] ?? 0;
  const dataFactor = 1 + (twin.tales_data?.[filosofo] ?? 0) * 0.2;
  return Math.min(1, peso * (1 + boost) * dataFactor);
}

function bloqueKant(kantTriggerEtica: boolean, kantTriggerPlaneta: boolean): string {
  const dimensionesActivas =
    kantTriggerEtica && kantTriggerPlaneta
      ? "Este mensaje activa AMBAS dimensiones — ética humana y consciencia planetaria."
      : kantTriggerEtica
        ? "Este mensaje activa la dimensión de ética humana (hay una decisión o presión sobre terceros de por medio)."
        : kantTriggerPlaneta
          ? "Este mensaje activa la dimensión de consciencia planetaria (hay hábitos/consumo de por medio)."
          : "Ninguna dimensión detectada en este mensaje — mantente pasivo, no fuerces ni ética ni planeta.";

  return (
    "[KANT — META-LENTE ÉTICA · SIEMPRE ACTIVO · PESO = 1.0]\n" +
    "Dimensión 1 — Ética humana: cuando el contexto involucra decisiones que afectan a otros, introduce sutilmente " +
    "la perspectiva del impacto colectivo. No mediante juicio explícito — mediante preguntas o encuadres que inviten " +
    "a considerar el efecto en terceros. Principio: si esta acción se convirtiera en norma universal, ¿qué mundo produciría?\n" +
    "Dimensión 2 — Consciencia planetaria: cuando el contexto lo permite de forma natural (hábitos, consumo, " +
    "alimentación, movilidad), incorpora brevemente la perspectiva del impacto en el planeta. Nunca como sermón.\n" +
    "Kant no desvía conversaciones ni supera el 15% de la respuesta. Una frase es suficiente. Planta semillas, no impone.\n" +
    dimensionesActivas
  );
}

const ESTADO_DETECTADO: Record<Exclude<Filosofo, "Kant">, string> = {
  "Sócrates": "posible ego inflado/grandiosidad o certeza excesiva",
  "Séneca": "posible estrés — frases cortas, urgencia",
  "Aristóteles": "posible caos emocional o necesidad de estructura",
  "Epicuro": "posible autoexigencia excesiva — ofrece autocompasión, no más presión",
  "Homero": "posible desconexión — ayuda a reconectar con su propia narrativa",
  "Demócrito": "",
  "Platón": "",
  "Gorgias": "",
  "Heráclito": "posible resistencia al cambio — normaliza el cambio como constante",
};

/**
 * Serializa EGO ID + pesos TALES del owner (mapa) moduladados por el estado
 * de ego detectado en el mensaje entrante (GPS, pre-procesador N2) en un
 * bloque de system prompt. twin === null (EGO ID sin completar) → "" y el
 * prompt cae en el tono genérico de systemInstructionBase, sin romper nada.
 */
export function bloqueTalesPrompt(twin: DemoTwin | null, mensaje: string): string {
  if (!twin?.ego?.serialized || !twin.tales_weights) return "";

  const { talesState, kantTriggerEtica, kantTriggerPlaneta } = analizarMensajeN2(mensaje);

  const filosofosVariables = TALES_FILOSOFOS.filter((f): f is Exclude<Filosofo, "Kant"> => f !== "Kant")
    .map((f) => ({ f, peso: pesoEfectivo(twin, f, talesState), boosted: (talesState[f] ?? 0) > 0 }))
    .sort((a, b) => b.peso - a.peso);

  const lineasFilosofos = filosofosVariables
    .map(({ f, peso, boosted }) => {
      const nota = boosted && ESTADO_DETECTADO[f] ? ` — sube en este mensaje: ${ESTADO_DETECTADO[f]}` : "";
      return `- ${f} (${Math.round(peso * 100)}%): ${FUNCION_FILOSOFO[f]}${nota}`;
    })
    .join("\n");

  return (
    `[TALES — EGO ID del owner: ${twin.ego.serialized}]\n` +
    `Estas son las 9 lentes filosóficas variables que calibran tu tono y forma de razonar, de más a menos presentes ` +
    `en este owner ahora mismo (ya incluye el ajuste temporal por el mensaje actual) — no cambian de qué hablas, ` +
    `cambian cómo razonas sobre ello:\n${lineasFilosofos}\n\n` +
    `${bloqueKant(kantTriggerEtica, kantTriggerPlaneta)}`
  );
}
