import { getSupabaseAdmin } from "@/lib/supabase/server";
import { buildSportSystemPrompt } from "@/lib/ai/geminiClient";

const API_BASE = "https://api.elevenlabs.io/v1/convai/agents";

/**
 * Prompt del agente conversacional — mismo texto base que Gemini
 * (buildSportSystemPrompt) más dos añadidos específicos de ElevenLabs
 * Agents: cómo tratar el "empujón" de feedback automático (VisualCoachPanel
 * no tiene forma de hacer que el agente diga un texto verbatim sin que
 * pase por su LLM, así que se lo pedimos explícitamente) y el aviso de
 * fiabilidad de MediaPipe pedido en el prompt original.
 */
export function buildAgentSystemPrompt(sport: string, knowledgeBase: string): string {
  return (
    buildSportSystemPrompt(sport, knowledgeBase) +
    "\n\nCuando recibas un mensaje que empiece por 'SYSTEM_FEEDBACK_AUTOMATICO:', NO es algo que haya dicho el alumno " +
    "— es una nota interna con el análisis biomecánico más reciente. Transmítesela al alumno de forma natural, en máximo 2 frases, sin mencionar que es una nota del sistema. " +
    "MediaPipe (el tracking de cámara) pierde precisión en movimientos muy rápidos (boxeo, artes marciales) o con varias personas en pantalla — " +
    "si los ángulos que recibes parecen erráticos o el deporte es de este tipo, avisa al alumno de que la detección puede no ser fiable en vez de corregirle con seguridad."
  );
}

type SyncResult = { synced: boolean; agentId?: string; reason?: string };

/**
 * Crea (o actualiza si ya existe) el agente ElevenLabs Conversational AI del
 * entrenador: voz clonada + system prompt de deporte. Se llama tras guardar
 * la config de deporte en /api/profesionales/deporte — un solo "Guardar"
 * configura deporte y agente a la vez, sin paso manual en elevenlabs.io.
 */
export async function syncAgent(ownerId: string): Promise<SyncResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return { synced: false, reason: "ElevenLabs no configurado (falta ELEVENLABS_API_KEY)" };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { synced: false, reason: "Supabase no configurado" };

  const { data: perfil } = await supabase
    .from("twin_profiles")
    .select("voice_id, sports_profile, elevenlabs_agent_id")
    .eq("owner_id", ownerId)
    .is("follower_id", null)
    .maybeSingle();

  if (!perfil?.voice_id) return { synced: false, reason: "El profesor todavía no ha clonado su voz (/profesionales/voz)" };

  const sportsProfile = perfil.sports_profile ?? {};
  const prompt = buildAgentSystemPrompt(sportsProfile.sport ?? "fitness", sportsProfile.knowledge_base ?? "");

  const body = {
    conversation_config: {
      agent: {
        // temperature: 0 (por defecto de ElevenLabs si no se especifica) hace
        // que el agente sea determinista — con ángulos parecidos tick tras
        // tick, siempre generaba la misma frase casi literal. 0.7 varía la
        // redacción manteniendo la corrección técnica coherente.
        prompt: { prompt, llm: "gemini-2.5-flash", temperature: 0.7 },
        first_message: "¡Hola! Soy tu entrenador virtual. Activa la cámara cuando quieras empezar.",
        language: "es",
      },
      tts: { voice_id: perfil.voice_id, model_id: "eleven_flash_v2_5" },
    },
  };

  const existingAgentId = perfil.elevenlabs_agent_id as string | null;
  const res = await fetch(existingAgentId ? `${API_BASE}/${existingAgentId}` : `${API_BASE}/create`, {
    method: existingAgentId ? "PATCH" : "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return { synced: false, reason: `ElevenLabs devolvió un error (${res.status}) al crear/actualizar el agente` };
  }

  const data = await res.json();
  const agentId: string = data.agent_id ?? existingAgentId;
  if (!agentId) return { synced: false, reason: "ElevenLabs no devolvió agent_id" };

  if (agentId !== existingAgentId) {
    await supabase
      .from("twin_profiles")
      .update({ elevenlabs_agent_id: agentId, updated_at: new Date().toISOString() })
      .eq("owner_id", ownerId)
      .is("follower_id", null);
  }

  return { synced: true, agentId };
}
