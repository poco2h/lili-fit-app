/**
 * N1 — caché semántica (V10 §4.1). Aquí, versión mínima determinista por
 * coincidencia exacta/substring en vez de embeddings pgvector (eso vive en
 * Supabase en producción) — cubre las queries más frecuentes sin tokens.
 */
const CACHE: Array<{ match: RegExp; respuesta: string }> = [
  {
    match: /hola|buenos d[ií]as|buenas tardes/i,
    respuesta: "Hola, ¿en qué puedo ayudarte hoy?",
  },
  {
    match: /c[oó]mo funciona (esto|mindtwin|el twin)/i,
    respuesta:
      "Soy el gemelo cerebral de tu profesional: replico su forma de pensar y comunicar. Puedes escribirme, hablarme o hacer videollamada cuando quieras.",
  },
  {
    match: /eres (una )?ia|eres humano/i,
    respuesta:
      "Sí, soy una IA — el MindTwin de tu profesional. Está entrenado con su psicología real y su voz, pero no soy él.",
  },
];

export function buscarEnCache(mensaje: string): string | null {
  const hit = CACHE.find((c) => c.match.test(mensaje));
  return hit ? hit.respuesta : null;
}
