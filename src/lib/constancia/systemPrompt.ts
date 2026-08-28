import type { DemoTwin, ConstanciaState, ConstanciaVertical } from "@/lib/demo/localTwin";
import type { Filosofo } from "@/lib/ego/talesWeights";
import { bloqueTalesPromptConEstado } from "@/lib/conversar/tales";
import { analizarMensajeConstancia } from "@/lib/constancia/preprocessorConstancia";
import { analizarMensajeN2 } from "@/lib/conversar/preprocessorN2";
import { resumenPsychotwin } from "@/lib/conversar/psychotwin";
import { diasSinCheckin, rachaActual, rachaMaxima, brechaAutoevaluacion, patronAbandono, ultimoCheckin } from "@/lib/constancia/calc";

/**
 * MÓDULO CONSTANCIA — construcción del system prompt (MINDTWINS_CONSTANCIA_PROMPT_v1,
 * entregado 2026-08-28, §11 da la plantilla exacta). El resto de piezas
 * (calc.ts, preprocessorConstancia.ts, psychotwin.ts) ya existían de una
 * sesión anterior — esto es lo que faltaba para unirlas en un prompt real.
 *
 * Simplificación deliberada frente al doc: en esta app /app/* no existe una
 * relación real owner↔follower con dos EGO ID distintos (Mis Hábitos ya
 * opera así en el resto de pestañas — Microbiota/Deportes usan siempre el
 * `twin` de la sesión activa, sea owner o follower demo). Por eso aquí
 * "owner_psychotwin" se calcula sobre el EGO ID del propio `twin` que abre
 * el módulo — el gemelo habla en primera persona sobre SU constancia, no
 * sobre la de un tercero. owner_historia_clave no existe en el modelo de
 * datos — se omite siempre, tal como pide el doc si el dato no existe
 * ("si no existe, no inventes").
 *
 * gut_adherencia_estimada (§1) requiere el "bucle diario alimentario" —
 * ese módulo es un placeholder sin datos reales todavía (ver MisFuentes),
 * así que siempre llega null y el gemelo lo ignora, como indica el propio
 * doc §12 para datos no disponibles.
 */

const VERTICAL_LABEL: Record<ConstanciaVertical, string> = {
  deporte: "deporte",
  idiomas: "idiomas",
  adicciones: "adicciones",
  nutricion: "nutrición",
  coaching: "coaching / hábitos generales",
  otro: "hábito personal",
};

function talesDominantes(pesos: Record<Filosofo, number> | undefined): Filosofo[] {
  if (!pesos) return [];
  return (Object.entries(pesos) as [Filosofo, number][])
    .filter(([f]) => f !== "Kant")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([f]) => f);
}

function gutIdSummary(twin: DemoTwin, vertical: ConstanciaVertical): string | null {
  if (vertical !== "deporte" && vertical !== "nutricion") return null;
  const { gut } = twin;
  if (gut.gut_baseline_score == null && gut.bacterias_deficientes.length === 0) return null;
  const partes: string[] = [];
  if (gut.gut_baseline_score != null) partes.push(`score base ${gut.gut_baseline_score}/1000`);
  if (gut.bacterias_deficientes.length) partes.push(`bacterias deficientes: ${gut.bacterias_deficientes.join(", ")}`);
  if (gut.gatillos.length) partes.push(`gatillos activos: ${gut.gatillos.join(", ")}`);
  return partes.join(" · ") || null;
}

/** §5 — el micro-compromiso se calibra según RFQ (foco promoción/prevención) y apego (ECR-4). */
function guiaMicroCompromiso(twin: DemoTwin): string {
  const foco =
    twin.ego.rfq === "promocion"
      ? 'Foco promoción: apela al logro — "¿Qué quieres conseguir esta semana?".'
      : 'Foco prevención: apela a no perder lo ganado — "¿Qué mínimo quieres mantener para no retroceder?".';
  const apego =
    twin.ego.apego === "ansioso"
      ? 'Apego ansioso: ofrece estructura y fecha de seguimiento — "¿te parece bien que la próxima vez hablemos de cómo fue?".'
      : twin.ego.apego === "evitativo"
        ? 'Apego evitativo: no ofrezcas seguimiento, deja espacio — "tú sabes cuándo necesitas volver".'
        : "";
  return [foco, apego].filter(Boolean).join(" ");
}

/** Frases de riesgo — detección determinista, sin LLM (§10). Deliberadamente conservadora: prioriza falsos positivos sobre pasar por alto una señal real. */
const SENALES_CRISIS = [
  "quiero morir", "no quiero vivir", "acabar con todo", "hacerme daño",
  "no vale la pena seguir", "quitarme la vida", "suicid",
];

export function detectarCrisis(mensaje: string): boolean {
  const texto = mensaje.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return SENALES_CRISIS.some((s) => texto.includes(s));
}

export function respuestaCrisis(habitoVertical: ConstanciaVertical): string {
  const recurso =
    habitoVertical === "adicciones"
      ? "un profesional de salud mental o un grupo de apoyo especializado"
      : "un profesional de salud mental";
  return (
    "Lo que cuentas pesa mucho, y quiero que sepas que te escucho. Esto ya no es algo que podamos resolver aquí, " +
    `en tu constancia con el hábito — merece hablarlo con ${recurso}. Si en algún momento sientes que el riesgo es ` +
    "inmediato, por favor contacta con el 024 (línea de atención a la conducta suicida) o el 112. Cuando quieras, aquí sigo."
  );
}

export type ContextoConstancia = {
  habitoVertical: ConstanciaVertical;
  habitoEspecifico: string;
  esPrimeraVez: boolean;
};

export function construirContextoConstancia(state: ConstanciaState): {
  diasSinCheckin: number | null;
  rachaActual: number;
  rachaMaxima: number;
  patronAbandono: string | null;
  brechaAutoevaluacion: boolean;
} {
  return {
    diasSinCheckin: diasSinCheckin(state),
    rachaActual: rachaActual(state),
    rachaMaxima: rachaMaxima(state),
    patronAbandono: patronAbandono(state.episodiosAbandono),
    brechaAutoevaluacion: brechaAutoevaluacion(state),
  };
}

export function systemPromptConstancia(twin: DemoTwin, ctx: ContextoConstancia, mensaje: string): string {
  const state = twin.constancia ?? { checkins: [], microCompromisos: [], episodiosAbandono: [], mensajes: [] };
  const datos = construirContextoConstancia(state);
  const esPrimeraVez = ultimoCheckin(state) === null;

  const psychotwin = resumenPsychotwin(twin.ego, talesDominantes(twin.tales_weights));
  const gutSummary = gutIdSummary(twin, ctx.habitoVertical);

  const talesState = analizarMensajeConstancia(mensaje);
  const { kantTriggerEtica, kantTriggerPlaneta } = analizarMensajeN2(mensaje);
  const bloqueTales = bloqueTalesPromptConEstado(twin, talesState, kantTriggerEtica, kantTriggerPlaneta);

  const lineasPerfil = [
    twin.ego.serialized ? `EGO ID: ${twin.ego.serialized}` : null,
    gutSummary ? `GUT ID relevante: ${gutSummary}` : null,
    `Días sin check-in: ${datos.diasSinCheckin ?? "sin historial (primera vez)"}`,
    `Racha actual: ${datos.rachaActual} días (récord: ${datos.rachaMaxima})`,
    datos.patronAbandono ? `Patrón de abandono detectado: ${datos.patronAbandono}` : null,
    datos.brechaAutoevaluacion
      ? "Brecha autoevaluación: sí — se puso una nota alta pero lleva 14+ días sin aparecer. Nómbralo con delicadeza, nunca como acusación."
      : null,
  ].filter(Boolean).join("\n");

  const flujo = esPrimeraVez
    ? `[FLUJO — primera vez, sin historial]\nNo hagas diagnóstico, no tienes datos. Abre EXACTAMENTE con una versión adaptada a tu tono de: "¿Cómo te puedo ayudar con tu constancia?" y espera respuesta — no añadas nada más en tu primer mensaje. A partir de ahí: máx. 2 preguntas calibradas por TALES, espejo sin juicio, y cierre con un micro-compromiso opcional (no obligatorio en primera sesión).`
    : `[FLUJO — con historial]\nAbre desde lo específico usando los datos de arriba (días sin check-in, racha, patrón de abandono, brecha), nunca desde lo genérico. Si dias_sin_checkin >= 14, ancla la apertura en tu propia historia si la tienes. Micro-compromiso OBLIGATORIO al cierre: una sola cosa concreta (qué + cuándo + dónde), nunca un plan de 5 puntos. ${guiaMicroCompromiso(twin)}`;

  return (
    `[IDENTIDAD]\nEres el MindTwin. Hablas en primera persona, nunca como asistente genérico. Tu tono es: ${psychotwin}.\n\n` +
    `[MÓDULO ACTIVO]\nMódulo: CONSTANCIA. Hábito: ${ctx.habitoEspecifico} (${VERTICAL_LABEL[ctx.habitoVertical]}).\n\n` +
    `[PERFIL]\n${lineasPerfil}\n\n` +
    `${flujo}\n\n` +
    `${bloqueTales}\n\n` +
    "[RESTRICCIONES]\n" +
    "- No más de 2 preguntas seguidas.\n" +
    "- No menciones TALES, los filósofos, ni ningún \"consejo\" o \"framework\" por nombre — son invisibles.\n" +
    "- No hagas trabajo de ego profundo (miedos nucleares, sesiones largas de introspección) — si el follower lo pide, redirige con calidez a su sesión principal de Conversar.\n" +
    '- No uses "¿cómo te sientes?" como primera pregunta — es genérico, suena a chatbot.\n' +
    "- No uses el historial como argumento de presión o reproche.\n" +
    "- No celebres excesivamente los logros (suena falso).\n" +
    "- Si la racha se rompió, normaliza el ajuste — nunca lo trates como fracaso.\n" +
    "- Responde en español, 2-4 frases, cercano y natural — nunca en formato lista salvo que el follower pida un plan explícito.\n" +
    "- Nunca reveles que eres una IA salvo que te lo pregunten directamente."
  );
}
