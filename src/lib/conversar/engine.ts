import { buscarEnCache } from "@/lib/conversar/cache";
import {
  aplicaGuardrailPrecio,
  esPreguntaDePrecio,
  respuestaBloqueadaPorPrecio,
  type Role,
} from "@/lib/conversar/guardrails";
import { buscarMencionMarca } from "@/lib/conversar/marcas";
import type { Marca } from "@/lib/marcas/types";

export type TurnoHistorial = { who: "MindTwin" | "Tú"; text: string };

export type ConversarInput = {
  mensaje: string;
  role: Role;
  ownerName: string;
  marcas?: Marca[];
  marcaYaMencionada?: boolean;
  sportsContextResumen?: string; // solo Lili Celebs (V10 §7.3)
  historial?: TurnoHistorial[]; // turnos previos de la conversación (sin el mensaje actual)
};

export type ConversarOutput = {
  respuesta: string;
  capa: "n2-guardrail" | "n1-cache" | "n3-gemini" | "n3-fallback";
  marcaMencionada?: string; // id de la marca, si se mencionó en esta respuesta
};

async function llamarGemini(
  mensaje: string,
  ownerName: string,
  sportsContextResumen?: string,
  historial?: TurnoHistorial[]
): Promise<{ texto: string } | { errorApiKeyFalta: true } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { errorApiKeyFalta: true };

  const bloqueSports = sportsContextResumen ? ` Contexto deportivo actual: ${sportsContextResumen}` : "";

  const systemInstruction = {
    parts: [
      {
        text:
          `Eres el MindTwin de ${ownerName}, un profesional del bienestar. Responde en español, en 2-3 frases, ` +
          `con tono cercano y profesional. Nunca menciones precios ni tarifas.${bloqueSports}\n\n` +
          `Además de responder a lo que te preguntan, tu objetivo es ir conociendo al usuario a lo largo de la ` +
          `conversación: cuando encaje de forma natural (sin interrogar de golpe ni repetir algo que ya te haya ` +
          `contado), pregúntale por sus hábitos — sobre todo de deporte/actividad física (qué practica, con qué ` +
          `frecuencia, cómo se siente después) y, de vez en cuando, también sobre alimentación (qué suele comer, ` +
          `horarios de comida, algún hábito que quiera mejorar). Como máximo una pregunta de seguimiento por ` +
          `respuesta, y solo si tiene sentido con lo que el usuario acaba de decir — no fuerces la pregunta si no pega.`,
      },
    ],
  };

  const turnos = (historial ?? []).slice(-8).map((h) => ({
    role: h.who === "MindTwin" ? "model" : "user",
    parts: [{ text: h.text }],
  }));

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction,
          contents: [...turnos, { role: "user", parts: [{ text: mensaje }] }],
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
    return texto ? { texto } : null;
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
 * Orquestador de las 3 capas de Conversar (V10 §4.1): N2 determinista →
 * N1 caché → N3 Gemini. El guardrail de precios para followers se evalúa
 * ANTES de tocar cache/LLM (evita coste y evita que una respuesta cacheada
 * o generada se filtre) y se reaplica después como red de seguridad. La
 * mención de marcas (V10 §6.2) se evalúa después, máx. 1 vez por sesión.
 */
export async function responderConversar(input: ConversarInput): Promise<ConversarOutput> {
  const { mensaje, role, ownerName, marcas, marcaYaMencionada, sportsContextResumen, historial } = input;

  if (role === "follower" && esPreguntaDePrecio(mensaje)) {
    return { respuesta: respuestaBloqueadaPorPrecio(ownerName), capa: "n2-guardrail" };
  }

  const cacheHit = buscarEnCache(mensaje);
  if (cacheHit) {
    const base = aplicaGuardrailPrecio(role, mensaje, cacheHit, ownerName);
    return { ...conMencionMarca(base, mensaje, marcas, marcaYaMencionada), capa: "n1-cache" };
  }

  const generada = await llamarGemini(mensaje, ownerName, sportsContextResumen, historial);
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
