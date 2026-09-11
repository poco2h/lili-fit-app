import { getSupabaseAdmin } from "@/lib/supabase/server";
import { llamarGemini } from "@/lib/conversar/gemini";

/**
 * Genera el system prompt del MindTwin (Pantalla 3 "Generando...") para
 * cualquier vertical del Generador (fit/speak/wakeup/celeb).
 *
 * Antes esta función le pedía a Gemini que redactara un prompt distinto
 * para cada alta — nunca una copia de nada, ni siquiera entre dos
 * profesionales del mismo vertical. Ahora usa `vertical_templates`: UN
 * prompt de referencia por vertical (editable en Supabase sin redeploy),
 * con placeholders {{nombre}}/{{especialidad}} — el resultado es el texto
 * de la plantilla, literal, solo con esos dos datos sustituidos. Todos los
 * profesionales de un mismo vertical parten así del mismo modelo real.
 */
export async function generarSystemPromptMindTwin(params: {
  nombre: string;
  especialidad: string;
  vertical: string;
}): Promise<{ systemPrompt: string; mindscore: number } | { error: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { error: "Supabase no configurado — no se puede leer la plantilla del vertical." };

  const { data: plantilla } = await supabase
    .from("vertical_templates")
    .select("system_prompt_template")
    .eq("vertical", params.vertical)
    .maybeSingle();

  const completitud = [params.nombre, params.especialidad, params.vertical].filter(Boolean).length;
  const mindscore = Math.min(100, 60 + completitud * 10);

  if (plantilla?.system_prompt_template) {
    const systemPrompt = plantilla.system_prompt_template
      .replaceAll("{{nombre}}", params.nombre)
      .replaceAll("{{especialidad}}", params.especialidad);
    return { systemPrompt, mindscore };
  }

  // Fallback: vertical sin plantilla todavía en vertical_templates — no
  // bloquea el alta, genera uno con IA como se hacía antes de este cambio.
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
    return { error: "No se pudo generar el system prompt (falta la plantilla del vertical y falló el fallback por IA)." };
  }
  return { systemPrompt: resultado.texto.trim(), mindscore };
}
