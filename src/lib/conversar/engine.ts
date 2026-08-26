import { buscarEnCache } from "@/lib/conversar/cache";
import {
  aplicaGuardrailPrecio,
  esPreguntaDePrecio,
  respuestaBloqueadaPorPrecio,
  type Role,
} from "@/lib/conversar/guardrails";
import { buscarMencionMarca } from "@/lib/conversar/marcas";
import type { Marca } from "@/lib/marcas/types";
import {
  aplicarExtraccion,
  avanzarProgreso,
  esquemaExtraccion,
  estadoTurno,
  instruccionOnboarding,
  twinVacio,
  type ContextoOnboarding,
} from "@/lib/conversar/onboarding";
import { leerTwinServer, guardarTwinServer } from "@/lib/session/twinProfileServer";
import { resolveFollowerUuid } from "@/lib/demo/identities";
import { bloqueTalesPrompt } from "@/lib/conversar/tales";
import { bloqueContextoFollower } from "@/lib/conversar/followerContext";

export type TurnoHistorial = { who: "MindTwin" | "Tú"; text: string };

export type ConversarInput = {
  mensaje: string;
  role: Role;
  ownerName: string;
  ownerId?: string;
  followerId?: string;
  marcas?: Marca[];
  marcaYaMencionada?: boolean;
  sportsContextResumen?: string; // solo Lili Celebs (V10 §7.3)
  historial?: TurnoHistorial[]; // turnos previos de la conversación (sin el mensaje actual)
};

export type ConversarOutput = {
  respuesta: string;
  capa: "n2-guardrail" | "n1-cache" | "n3-gemini" | "n3-onboarding" | "n3-fallback";
  marcaMencionada?: string; // id de la marca, si se mencionó en esta respuesta
};

const REDIRECCION_TEMA = (ownerName: string) =>
  `Si el usuario intenta hablar de temas totalmente ajenos a tu especialidad como profesional del bienestar (actualidad, ` +
  `política, resultados deportivos de terceros, etc.), redirígelo con amabilidad de vuelta a tu área, en el estilo de: ` +
  `"Mi especialidad es [tu área]. ¿Quieres que hablemos de [tema relevante]?". No lo hagas si lo que pregunta sí tiene ` +
  `relación, aunque sea indirecta, con bienestar, entrenamiento, nutrición o cómo se siente.`;

function systemInstructionBase(ownerName: string, sportsContextResumen?: string, talesBloque?: string): string {
  const bloqueSports = sportsContextResumen ? ` Contexto deportivo actual: ${sportsContextResumen}` : "";
  const bloqueTales = talesBloque ? `\n\n${talesBloque}` : "";
  return (
    `Eres el MindTwin de ${ownerName}, un profesional del bienestar. Responde en español, en 2-3 frases, ` +
    `con tono cercano y profesional. Nunca menciones precios ni tarifas.${bloqueSports}${bloqueTales}\n\n${REDIRECCION_TEMA(ownerName)}`
  );
}

type RespuestaGemini = { texto: string; extraccion?: Record<string, number | string> };

async function llamarGemini(
  systemInstructionText: string,
  mensaje: string,
  historial: TurnoHistorial[] | undefined,
  responseSchema: Record<string, unknown> | null
): Promise<RespuestaGemini | { errorApiKeyFalta: true } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { errorApiKeyFalta: true };

  const turnos = (historial ?? []).slice(-8).map((h) => ({
    role: h.who === "MindTwin" ? "model" : "user",
    parts: [{ text: h.text }],
  }));

  const generationConfig = responseSchema
    ? {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: { respuesta: { type: "STRING" }, extraccion: responseSchema },
          required: ["respuesta", "extraccion"],
        },
      }
    : undefined;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstructionText }] },
          contents: [...turnos, { role: "user", parts: [{ text: mensaje }] }],
          ...(generationConfig ? { generationConfig } : {}),
        }),
        signal: AbortSignal.timeout(15000),
      }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[Conversar] Gemini falló (${res.status}): ${body.slice(0, 300)}`);
      return null;
    }
    const data = await res.json();
    const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!texto) return null;

    if (!responseSchema) return { texto };
    try {
      const parsed = JSON.parse(texto);
      return { texto: parsed.respuesta ?? texto, extraccion: parsed.extraccion };
    } catch {
      return { texto };
    }
  } catch (e) {
    console.error("[Conversar] Gemini fetch error:", e);
    return null;
  }
}

function conMencionMarca(
  respuestaBase: string,
  mensaje: string,
  marcas: Marca[] | undefined,
  yaMencionada: boolean | undefined
): { respuesta: string; marcaMencionada?: string } {
  const mencion = buscarMencionMarca(mensaje, marcas ?? [], !!yaMencionada);
  if (!mencion) return { respuesta: respuestaBase };
  return { respuesta: respuestaBase + mencion.texto, marcaMencionada: mencion.marca.id };
}

/**
 * Turno de onboarding conversacional (V10 §5.1 R1 para Owner; landing PASO
 * 03 para Follower): mientras la persona no haya terminado sus sesiones
 * (S1-S4 Owner, S1-S3 Follower), cada mensaje suyo alimenta la sesión activa
 * en vez de un chat libre — se le pregunta, en una sola frase natural por
 * grupo de rasgos, y la respuesta se traduce a los mismos ítems Likert 1-5
 * que ya usa el flujo determinista de /app/onboarding (src/lib/ego, sin
 * cambios en el scoring). Bloquea implícitamente el chat libre: mientras
 * esta función decida seguir en onboarding, nunca se llega al chat genérico.
 *
 * followerUuid presente = turno del Follower (su propia fila en
 * twin_profiles); ausente = turno del Owner.
 */
async function turnoOnboarding(
  input: ConversarInput,
  contexto: ContextoOnboarding,
  followerUuid?: string
): Promise<ConversarOutput | null> {
  const { mensaje, ownerName, ownerId, historial } = input;
  if (!ownerId) return null;

  const twin = await leerTwinServer(ownerId, followerUuid);
  const turno = estadoTurno(twin, contexto);
  if (!turno) return null; // onboarding ya completo — cae al chat libre

  const instruccion = instruccionOnboarding(turno.sesion, turno.pasoActual, turno.pasoSiguiente);
  const systemInstructionText = `${systemInstructionBase(ownerName)}\n\n${instruccion}`;
  const schema = esquemaExtraccion(turno.pasoActual);

  const generada = await llamarGemini(systemInstructionText, mensaje, historial, schema);

  if (!generada || "errorApiKeyFalta" in generada) {
    const mensajeError =
      generada && "errorApiKeyFalta" in generada
        ? "Ahora mismo no puedo generar una respuesta completa (falta configurar GEMINI_API_KEY), pero he registrado tu mensaje."
        : "Ahora mismo no puedo generar una respuesta completa (fallo temporal al conectar con el modelo), pero he registrado tu mensaje.";
    return { respuesta: mensajeError, capa: "n3-fallback" };
  }

  let twinActualizado = twin ?? twinVacio();
  if (turno.pasoActual && generada.extraccion) {
    twinActualizado = aplicarExtraccion(twinActualizado, turno.pasoActual, generada.extraccion);
  }
  twinActualizado = avanzarProgreso(twinActualizado, turno.sesion, contexto);

  await guardarTwinServer(ownerId, twinActualizado, followerUuid);

  return { respuesta: generada.texto, capa: "n3-onboarding" };
}

/**
 * Orquestador de las 3 capas de Conversar (V10 §4.1): N2 determinista →
 * N1 caché → N3 Gemini. El guardrail de precios para followers se evalúa
 * ANTES de tocar cache/LLM (evita coste y evita que una respuesta cacheada
 * o generada se filtre) y se reaplica después como red de seguridad. La
 * mención de marcas (V10 §6.2) se evalúa después, máx. 1 vez por sesión.
 * Antes de cualquiera de las 3 capas, si el Owner todavía no ha terminado
 * sus sesiones iniciales (V10 §5.1 R1), el turno se desvía al onboarding
 * conversacional — el caché no aplica ahí porque cada turno depende del
 * progreso guardado, no solo del texto del mensaje.
 */
export async function responderConversar(input: ConversarInput): Promise<ConversarOutput> {
  const { mensaje, role, ownerName, ownerId, followerId, marcas, marcaYaMencionada, sportsContextResumen, historial } = input;

  if (role === "owner" && ownerId) {
    const resultado = await turnoOnboarding(input, "owner");
    if (resultado) return { ...conMencionMarca(resultado.respuesta, mensaje, marcas, marcaYaMencionada), capa: resultado.capa };
  }

  let followerUuid: string | null = null;
  if (role === "follower" && ownerId && followerId) {
    followerUuid = await resolveFollowerUuid(followerId, ownerId);
    if (followerUuid) {
      const resultado = await turnoOnboarding(input, "follower", followerUuid);
      if (resultado) return { ...conMencionMarca(resultado.respuesta, mensaje, marcas, marcaYaMencionada), capa: resultado.capa };
    }
  }

  if (role === "follower" && esPreguntaDePrecio(mensaje)) {
    return { respuesta: respuestaBloqueadaPorPrecio(ownerName), capa: "n2-guardrail" };
  }

  const cacheHit = buscarEnCache(mensaje);
  if (cacheHit) {
    const base = aplicaGuardrailPrecio(role, mensaje, cacheHit, ownerName);
    return { ...conMencionMarca(base, mensaje, marcas, marcaYaMencionada), capa: "n1-cache" };
  }

  const twinOwner = ownerId ? await leerTwinServer(ownerId) : null;
  const twinFollower = followerUuid ? await leerTwinServer(ownerId!, followerUuid) : null;
  const talesBloque = [bloqueTalesPrompt(twinOwner, mensaje), bloqueContextoFollower(twinFollower)].filter(Boolean).join("\n\n");
  const generada = await llamarGemini(systemInstructionBase(ownerName, sportsContextResumen, talesBloque), mensaje, historial, null);
  if (generada && "texto" in generada) {
    const base = aplicaGuardrailPrecio(role, mensaje, generada.texto, ownerName);
    return { ...conMencionMarca(base, mensaje, marcas, marcaYaMencionada), capa: "n3-gemini" };
  }

  const fallback =
    generada && "errorApiKeyFalta" in generada
      ? "Ahora mismo no puedo generar una respuesta completa (falta configurar GEMINI_API_KEY), pero he registrado tu mensaje."
      : "Ahora mismo no puedo generar una respuesta completa (fallo temporal al conectar con el modelo), pero he registrado tu mensaje.";
  return { ...conMencionMarca(fallback, mensaje, marcas, marcaYaMencionada), capa: "n3-fallback" };
}
