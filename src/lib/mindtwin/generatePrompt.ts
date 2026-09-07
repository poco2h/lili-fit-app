import { llamarGemini } from "@/lib/conversar/gemini";

/**
 * Genera el system prompt del MindTwin (Pantalla 3 "Generando...") para
 * verticales genéricos del Generador (idiomas/coach/business/custom) — Lili
 * Fit no pasa por aquí, sigue con su propio flujo de sports_profile.
 */
export async function generarSystemPromptMindTwin(params: {
  nombre: string;
  especialidad: string;
  vertical: string;
}): Promise<{ systemPrompt: string; mindscore: number } | { error: string }> {
  const instruccion =
    `Escribe el system prompt (en español, en primera persona, como hablaría ${params.nombre}) para su MindTwin: ` +
    `una IA que replica su metodología, tono y criterio como profesional de "${params.especialidad}" (vertical: ${params.vertical}). ` +
    `Incluye personalidad, estilo pedagógico/profesional, cómo da feedback o corrige, qué dinámicas propone, y cómo cierra las sesiones. ` +
    `Sé específico, evita frases genéricas. Responde SOLO con el texto del system prompt (sin explicaciones ni comillas), máximo 200 palabras.`;

  const resultado = await llamarGemini(
    "Eres un asistente que redacta prompts de sistema para gemelos digitales (MindTwins) de profesionales.",
    instruccion,
    undefined,
    null
  );
  if (!resultado || "errorApiKeyFalta" in resultado) {
    return { error: "No se pudo generar el system prompt (falta GEMINI_API_KEY o fallo temporal del modelo)." };
  }

  const completitud = [params.nombre, params.especialidad, params.vertical].filter(Boolean).length;
  const mindscore = Math.min(100, 60 + completitud * 10);
  return { systemPrompt: resultado.texto.trim(), mindscore };
}
