import type { LikertItem, Respuestas } from "@/lib/ego/types";
import { SESIONES } from "@/lib/ego/items";
import { calcularEgoId } from "@/lib/ego/scoring";
import { calcularTalesWeights } from "@/lib/ego/talesWeights";
import { PREGUNTAS_BASELINE, calcularGutBaseline, type PreguntaBaseline, type RespuestasBaseline } from "@/lib/gut/baseline";
import {
  ONBOARDING_PROGRESS_INICIAL,
  SOURCES_VACIO,
  SPORTS_PROFILE_VACIO,
  type DemoTwin,
  type SportsProfile,
} from "@/lib/demo/localTwin";

/**
 * Sesiones conversacionales de Mis Conversaciones (V10 §5). El banco de
 * ítems (BFI-20/Eneagrama/ECR-4/RFQ-6/TEIQue-SF/VIA-24) y su scoring son
 * los mismos deterministas de src/lib/ego — aquí solo se agrupan por
 * dimensión para preguntarse en pocas preguntas conversacionales (una por
 * grupo, no un cuestionario ítem a ítem) y se interpreta la respuesta
 * natural del usuario para asignarle un valor Likert 1-5 por ítem.
 */

export type PasoLikert = { tipo: "likert"; items: LikertItem[] };
export type PasoGut = { tipo: "gut"; pregunta: PreguntaBaseline };
export type PasoSports = { tipo: "sports"; campos: Array<keyof SportsProfile>; pregunta: string };
export type Paso = PasoLikert | PasoGut | PasoSports;

/** Agrupa ítems por dimensión compartida; si cada ítem tiene dimensión única (VIA-24), agrupa en bloques de 4. */
function agruparPorDimension(items: LikertItem[]): LikertItem[][] {
  const porDimension = new Map<string, LikertItem[]>();
  for (const item of items) {
    const grupo = porDimension.get(item.dimension) ?? [];
    grupo.push(item);
    porDimension.set(item.dimension, grupo);
  }
  const grupos = [...porDimension.values()];
  const dimensionesUnicas = grupos.every((g) => g.length === 1);
  if (!dimensionesUnicas) return grupos;

  // Cada ítem tiene su propia dimensión (VIA-24) — trocear en bloques de 4.
  const bloques: LikertItem[][] = [];
  for (let i = 0; i < items.length; i += 4) bloques.push(items.slice(i, i + 4));
  return bloques;
}

const CAMPOS_SPORTS: Array<{ campos: Array<keyof SportsProfile>; pregunta: string }> = [
  { campos: ["deporte"], pregunta: "Qué deporte o tipo de actividad física principal quiere trabajar (fútbol, running, natación, gym, cycling, yoga, etc.)" },
  { campos: ["nivel"], pregunta: "Su nivel actual: principiante, intermedio, avanzado o élite" },
  { campos: ["objetivo"], pregunta: "Su objetivo deportivo: pérdida de peso, hipertrofia, resistencia, rendimiento competitivo, recuperación o bienestar general" },
  { campos: ["frecuenciaActual", "frecuenciaObjetivo"], pregunta: "Cuántos días a la semana entrena ahora (y duración media de cada sesión), y cuánto le gustaría entrenar" },
  { campos: ["lesiones"], pregunta: "Si tiene lesiones relevantes y en qué zona, o si no tiene ninguna" },
  { campos: ["edad", "altura", "peso", "pesoObjetivo", "grasaEstimada"], pregunta: "Su edad, altura (cm), peso actual (kg), peso objetivo (kg) si lo tiene, y % de grasa estimado si lo conoce" },
  { campos: ["restricciones"], pregunta: "Restricciones médicas, articulares, de tiempo disponible o de equipamiento" },
];

function pasosDeSesion(sesion: "S1" | "S2" | "S3" | "S4"): Paso[] {
  if (sesion === "S1") {
    return agruparPorDimension(SESIONES.S1).map((items) => ({ tipo: "likert", items }));
  }
  if (sesion === "S2") {
    const likert = agruparPorDimension(SESIONES.S2).map((items): Paso => ({ tipo: "likert", items }));
    const gut = PREGUNTAS_BASELINE.slice(0, 5).map((pregunta): Paso => ({ tipo: "gut", pregunta }));
    return [...likert, ...gut];
  }
  if (sesion === "S3") {
    const likert = agruparPorDimension(SESIONES.S3).map((items): Paso => ({ tipo: "likert", items }));
    const gut = PREGUNTAS_BASELINE.slice(5).map((pregunta): Paso => ({ tipo: "gut", pregunta }));
    return [...likert, ...gut];
  }
  // S4 — datos deportivos/antropométricos, conversación libre sin tests.
  return CAMPOS_SPORTS.map((c) => ({ tipo: "sports", campos: c.campos, pregunta: c.pregunta }));
}

export type EstadoTurno = {
  sesion: "S1" | "S2" | "S3" | "S4";
  pasoActual: Paso | null; // lo que se va a puntuar con la respuesta que acaba de llegar (null si es el primer turno)
  pasoSiguiente: Paso | null; // lo que hay que preguntar a continuación (null si la sesión termina aquí)
};

/** Determina qué toca hacer en este turno según el progreso guardado. Devuelve null si el onboarding ya está completo. */
export function estadoTurno(twin: DemoTwin | null): EstadoTurno | null {
  const sesion = (twin?.sesion_actual ?? "S1") as DemoTwin["sesion_actual"];
  if (sesion === "completo") return null;

  const progreso = twin?.onboarding_progress ?? ONBOARDING_PROGRESS_INICIAL;
  const pasos = pasosDeSesion(sesion);

  if (!progreso.iniciado) {
    return { sesion, pasoActual: null, pasoSiguiente: pasos[0] ?? null };
  }
  return {
    sesion,
    pasoActual: pasos[progreso.pasoIdx] ?? null,
    pasoSiguiente: pasos[progreso.pasoIdx + 1] ?? null,
  };
}

function describirPaso(paso: Paso): string {
  if (paso.tipo === "likert") return paso.items.map((i) => `- ${i.texto}`).join("\n");
  if (paso.tipo === "gut") return `- ${paso.pregunta.texto} (${paso.pregunta.tipo === "si_no" ? "responde sí/no" : "pídele que lo describa"})`;
  return `- ${paso.pregunta}`;
}

/** Texto de sistema que describe la tarea de este turno — se combina con el prompt general del rol en engine.ts. */
export function instruccionOnboarding(sesion: string, pasoActual: Paso | null, pasoSiguiente: Paso | null): string {
  const partes: string[] = [
    `Estás en mitad de la Sesión ${sesion.replace("S", "")} de construcción del perfil del usuario (Mis Conversaciones). ` +
      `Esto NUNCA debe sonar a cuestionario ni mencionar tests, ítems, Likert ni "sesión ${sesion}" explícitamente — es una charla natural y cálida.`,
  ];

  if (pasoActual) {
    partes.push(
      `El usuario acaba de responder a esto que le preguntaste (no lo repitas, ya lo tienes):\n${describirPaso(pasoActual)}\n` +
        `Interpreta su respuesta y decide qué tan de acuerdo está con cada afirmación, del 1 (nada) al 5 (totalmente).`
    );
  }

  if (pasoSiguiente) {
    partes.push(
      `Ahora, de forma breve y conversacional (1-2 frases, nunca listando afirmaciones), pregúntale algo que te dé pistas sobre esto:\n${describirPaso(pasoSiguiente)}`
    );
  } else {
    partes.push(
      `Esta era la última pregunta de la sesión actual. Agradece cálidamente y dile que habéis terminado esta parte por hoy — sin dar detalles técnicos.`
    );
  }

  return partes.join("\n\n");
}

/** Esquema JSON que Gemini debe rellenar en este turno (además de la respuesta conversacional en texto). */
export function esquemaExtraccion(pasoActual: Paso | null): Record<string, unknown> | null {
  if (!pasoActual) return null;
  if (pasoActual.tipo === "likert") {
    const properties: Record<string, unknown> = {};
    for (const item of pasoActual.items) properties[item.id] = { type: "INTEGER", description: "1 a 5" };
    return { type: "OBJECT", properties, required: pasoActual.items.map((i) => i.id) };
  }
  if (pasoActual.tipo === "gut") {
    const esEscala = pasoActual.pregunta.tipo === "escala";
    return {
      type: "OBJECT",
      properties: { [pasoActual.pregunta.id]: { type: "INTEGER", description: esEscala ? "1 a 5" : "1 si es sí/afirmativo, 0 si es no" } },
      required: [pasoActual.pregunta.id],
    };
  }
  // sports
  const properties: Record<string, unknown> = {};
  for (const campo of pasoActual.campos) properties[campo] = { type: "STRING" };
  return { type: "OBJECT", properties, required: pasoActual.campos };
}

/** DemoTwin vacío de partida — usado tanto al crear el perfil por primera vez como de red de seguridad si algo falla a mitad de turno. */
export function twinVacio(): DemoTwin {
  const egoNeutro = calcularEgoId({});
  return {
    ego: egoNeutro,
    tales_weights: calcularTalesWeights(egoNeutro),
    gut: calcularGutBaseline({}),
    tales_data: calcularTalesWeights(egoNeutro),
    sources: SOURCES_VACIO,
    sesion_actual: "S1",
    direcciones: { domicilioPersonal: "", domicilioProfesional: "" },
  };
}

/** Aplica los valores extraídos por Gemini al DemoTwin (o crea uno nuevo si no existía) y avanza el puntero de progreso. */
export function aplicarExtraccion(
  twinActual: DemoTwin | null,
  pasoActual: Paso,
  extraccion: Record<string, number | string>
): DemoTwin {
  const base: DemoTwin = twinActual ?? twinVacio();

  let respuestas: Respuestas = { ...(base.respuestas_raw ?? {}) };
  let gutRespuestas: RespuestasBaseline = { ...(base.gut_respuestas_raw ?? {}) };
  let sportsProfile: SportsProfile = { ...(base.sports_profile ?? SPORTS_PROFILE_VACIO) };

  if (pasoActual.tipo === "likert") {
    for (const item of pasoActual.items) {
      const valor = Number(extraccion[item.id]);
      respuestas[item.id] = Number.isFinite(valor) ? Math.min(5, Math.max(1, valor)) : 3;
    }
  } else if (pasoActual.tipo === "gut") {
    const valor = Number(extraccion[pasoActual.pregunta.id]);
    gutRespuestas[pasoActual.pregunta.id] = Number.isFinite(valor) ? valor : 3;
  } else {
    for (const campo of pasoActual.campos) {
      const valor = extraccion[campo];
      if (typeof valor === "string" && valor.trim()) sportsProfile[campo] = valor.trim();
    }
  }

  const ego = calcularEgoId(respuestas);
  const gut = calcularGutBaseline(gutRespuestas);

  return {
    ...base,
    respuestas_raw: respuestas,
    gut_respuestas_raw: gutRespuestas,
    sports_profile: sportsProfile,
    ego,
    tales_weights: calcularTalesWeights(ego),
    tales_data: calcularTalesWeights(ego),
    gut,
  };
}

/** Avanza el puntero de progreso; si la sesión actual se termina, pasa a la siguiente (o a "completo" tras S4). */
export function avanzarProgreso(twin: DemoTwin, sesionDelTurno: "S1" | "S2" | "S3" | "S4"): DemoTwin {
  const progreso = twin.onboarding_progress ?? ONBOARDING_PROGRESS_INICIAL;
  const pasos = pasosDeSesion(sesionDelTurno);
  const nuevoIdx = progreso.iniciado ? progreso.pasoIdx + 1 : 0;

  if (nuevoIdx < pasos.length) {
    return { ...twin, onboarding_progress: { iniciado: true, pasoIdx: nuevoIdx } };
  }

  const siguienteSesion: DemoTwin["sesion_actual"] =
    sesionDelTurno === "S1" ? "S2" : sesionDelTurno === "S2" ? "S3" : sesionDelTurno === "S3" ? "S4" : "completo";

  return { ...twin, sesion_actual: siguienteSesion, onboarding_progress: ONBOARDING_PROGRESS_INICIAL };
}
