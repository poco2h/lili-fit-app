import { buscarEnCache } from "@/lib/conversar/cache";
import {
  aplicaGuardrailPrecio,
  esPreguntaDePrecio,
  respuestaBloqueadaPorPrecio,
  type Role,
} from "@/lib/conversar/guardrails";
import { buscarMencionMarca } from "@/lib/conversar/marcas";
import type { Marca } from "@/lib/marcas/types";

export type ConversarInput = {
  mensaje: string;
  role: Role;
  ownerName: string;
  marcas?: Marca[];
  marcaYaMencionada?: boolean;
  sportsContextResumen?: string; // solo Lili Celebs (V10 §7.3)
};

export type ConversarOutput = {
  respuesta: string;
  capa: "n2-guardrail" | "n1-cache" | "n3-gemini" | "n3-fallback";
  marcaMencionada?: string; // id de la marca, si se mencionó en esta respuesta
};

async function llamarGemini(
  mensaje: string,
  ownerName: string,
  sportsContextResumen?: string
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const bloqueSports = sportsContextResumen ? ` Contexto deportivo actual: ${sportsContextResumen}` : "";

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Eres el MindTwin de ${ownerName}, un profesional del bienestar. Responde en español, en 2-3 frases, con tono cercano y profesional. Nunca menciones precios ni tarifas.${bloqueSports} Mensaje del usuario: ${mensaje}`,
                },
              ],
            },
          ],
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
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
  const { mensaje, role, ownerName, marcas, marcaYaMencionada, sportsContextResumen } = input;

  if (role === "follower" && esPreguntaDePrecio(mensaje)) {
    return { respuesta: respuestaBloqueadaPorPrecio(ownerName), capa: "n2-guardrail" };
  }

  const cacheHit = buscarEnCache(mensaje);
  if (cacheHit) {
    const base = aplicaGuardrailPrecio(role, mensaje, cacheHit, ownerName);
    return { ...conMencionMarca(base, mensaje, marcas, marcaYaMencionada), capa: "n1-cache" };
  }

  const generada = await llamarGemini(mensaje, ownerName, sportsContextResumen);
  if (generada) {
    const base = aplicaGuardrailPrecio(role, mensaje, generada, ownerName);
    return { ...conMencionMarca(base, mensaje, marcas, marcaYaMencionada), capa: "n3-gemini" };
  }

  const fallback =
    "Ahora mismo no puedo generar una respuesta completa (falta configurar GEMINI_API_KEY), pero he registrado tu mensaje.";
  return { ...conMencionMarca(fallback, mensaje, marcas, marcaYaMencionada), capa: "n3-fallback" };
}
