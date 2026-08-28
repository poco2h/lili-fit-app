/**
 * Tavus CVI — videollamada en tiempo real (V1/V2, regla fija V10 §12: nunca
 * Higgsfield aquí). API real: POST https://tavusapi.com/v2/conversations con
 * header x-api-key. face_id es el nombre actual de lo que el esquema de
 * MindTwin llama tavus_replica_id (Tavus renombró "replica" -> "face" y
 * "persona" -> "PAL"). Sin face_id propio entrenado, se usa una stock face
 * (biblioteca de 100+ caras pre-grabadas, sin entrenamiento) para que la
 * videollamada funcione desde ya — el owner puede sustituirla más adelante
 * por su propio face_id clonado.
 */
const STOCK_FACE_ID_FALLBACK = "r90bbd427f71"; // "Anna", stock face de Tavus

export type TavusConversationResult =
  | { ok: true; conversationId: string; conversationUrl: string }
  | { ok: false; error: string };

export function tavusApiKey(): string | null {
  return process.env.TAVUS_API_KEY || null;
}

export async function crearConversacionTavus(params: {
  ownerName: string;
  faceId?: string | null;
  conversationalContext?: string;
}): Promise<TavusConversationResult> {
  const apiKey = tavusApiKey();
  if (!apiKey) return { ok: false, error: "Falta configurar TAVUS_API_KEY." };

  try {
    const res = await fetch("https://tavusapi.com/v2/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({
        face_id: params.faceId || STOCK_FACE_ID_FALLBACK,
        conversation_name: `MindTwin — ${params.ownerName}`,
        conversational_context: params.conversationalContext,
        properties: { max_call_duration: 1800, participant_absent_timeout: 300 },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `Tavus /v2/conversations falló (${res.status}): ${body.slice(0, 300)}` };
    }
    const data = (await res.json()) as { conversation_id?: string; conversation_url?: string };
    if (!data.conversation_id || !data.conversation_url) {
      return { ok: false, error: "Tavus no devolvió conversation_id/conversation_url." };
    }
    return { ok: true, conversationId: data.conversation_id, conversationUrl: data.conversation_url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error desconocido" };
  }
}

export async function finalizarConversacionTavus(conversationId: string): Promise<void> {
  const apiKey = tavusApiKey();
  if (!apiKey) return;
  await fetch(`https://tavusapi.com/v2/conversations/${encodeURIComponent(conversationId)}/end`, {
    method: "POST",
    headers: { "x-api-key": apiKey },
  }).catch(() => {});
}
