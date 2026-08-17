import type { GutData } from "./types";

/**
 * GUT ID — el test clínico completo (28 preguntas · 7 dimensiones · 16
 * bacterias) es propiedad y responsabilidad exclusiva del sistema N1 de
 * Javi (GUT_ID_v2/ZOE). MindTwin NO lo reimplementa: lee `gut_data` cuando
 * el owner conecta su cuenta N1 desde Mis Fuentes (ver
 * src/lib/integrations/n1.ts, todavía stub sin endpoint real).
 *
 * Cuando NO hay conexión N1, V10 §3 prevé una captura baseline mucho más
 * ligera (~15 preguntas en Conversar S2-S3) para tener un `gut_data`
 * inicial. Eso es lo que cubre este módulo — no sustituye al test N1.
 */
export type PreguntaBaseline = { id: string; texto: string; tipo: "escala" | "si_no" };

export const PREGUNTAS_BASELINE: PreguntaBaseline[] = [
  { id: "digestion_general", texto: "¿Cómo describirías tu digestión en general?", tipo: "escala" },
  { id: "hinchazon", texto: "¿Sientes hinchazón después de comer con frecuencia?", tipo: "si_no" },
  { id: "energia_post_comida", texto: "¿Notas bajones de energía después de comer?", tipo: "si_no" },
  { id: "regularidad", texto: "¿Tu tránsito intestinal es regular?", tipo: "escala" },
  { id: "lacteos", texto: "¿Los lácteos te sientan mal?", tipo: "si_no" },
  { id: "gluten", texto: "¿Notas molestias con el gluten?", tipo: "si_no" },
  { id: "azucar", texto: "¿Tienes antojos frecuentes de azúcar?", tipo: "si_no" },
  { id: "estres_digestivo", texto: "¿El estrés te afecta claramente a la digestión?", tipo: "si_no" },
  { id: "sueno", texto: "¿Duermes de forma reparadora la mayoría de noches?", tipo: "escala" },
  { id: "antibioticos", texto: "¿Has tomado antibióticos en el último año?", tipo: "si_no" },
];

export type RespuestasBaseline = Record<string, number>; // escala 1-5, o 1/0 para sí_no

/**
 * Scoring determinista del baseline conversacional — sin LLM. No sustituye
 * al perfil clínico N1; solo da un `gut_baseline_score` orientativo.
 */
export function calcularGutBaseline(respuestas: RespuestasBaseline): GutData {
  const escalas = ["digestion_general", "regularidad", "sueno"].map((id) => respuestas[id] ?? 3);
  const mediaEscalas = escalas.reduce((a, b) => a + b, 0) / escalas.length;

  const alertas: string[] = [
    "hinchazon", "energia_post_comida", "lacteos", "gluten", "azucar", "estres_digestivo", "antibioticos",
  ].filter((id) => respuestas[id] === 1);

  const penalizacion = alertas.length * 5;
  const gut_baseline_score = Math.max(0, Math.min(100, Math.round(((mediaEscalas - 1) / 4) * 100 - penalizacion)));

  return {
    source: "conversational",
    gut_baseline_score,
    bacterias_dominantes: [],
    bacterias_deficientes: [],
    gatillos: alertas,
    sintomas: alertas,
    n1_connected: false,
    n1_user_id: null,
    last_updated: new Date().toISOString(),
  };
}
