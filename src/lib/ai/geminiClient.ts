import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT =
  "Eres el gemelo digital del profesional fitness de este usuario. " +
  "Respondes en español, de forma directa, motivadora y personalizada. " +
  "Máximo 2-3 frases por respuesta para mantener la conversación fluida. " +
  "Si recibes imagen de la cámara, úsala para contextualizar tu respuesta " +
  "(postura, entorno, equipamiento visible, estado físico aparente).";

/**
 * Arma el system prompt del Visual Coach a partir de la config de deporte
 * del entrenador (twin_profiles.sports_profile) — reemplaza al SYSTEM_PROMPT
 * genérico cuando la conversación es una sesión de análisis de técnica.
 */
export function buildSportSystemPrompt(sport: string, knowledgeBase: string): string {
  return (
    `Eres el gemelo digital de un entrenador de ${sport || "fitness"}. ` +
    "Respondes en español, de forma directa, motivadora y muy breve (1-2 frases) " +
    "porque el alumno te está escuchando en vivo mientras entrena. " +
    "Recibirás el ángulo de sus articulaciones (calculado a partir de su postura real) " +
    "y, si corresponde, una imagen de la cámara. Corrige la técnica cuando un ángulo " +
    "se sale del rango saludable, y refuerza cuando la ejecución es correcta. " +
    (knowledgeBase ? `Reglas de técnica específicas de este entrenador: ${knowledgeBase}` : "")
  ).trim();
}

/**
 * Cliente Gemini Flash 2.5 para el análisis en tiempo real de Visual Coach
 * (visión + texto en una sola llamada). Solo se usa server-side —
 * GEMINI_API_KEY no es NEXT_PUBLIC, así que este módulo se invoca desde
 * /api/ai/gemini-stream, nunca directo desde el navegador.
 */
export async function* streamResponse(
  transcript: string,
  frameBase64?: string,
  systemPromptOverride?: string
): AsyncIterable<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Falta configurar GEMINI_API_KEY.");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemPromptOverride || SYSTEM_PROMPT,
  });

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: transcript },
  ];
  if (frameBase64) {
    parts.push({ inlineData: { mimeType: "image/jpeg", data: frameBase64 } });
  }

  const result = await model.generateContentStream({ contents: [{ role: "user", parts }] });
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}
