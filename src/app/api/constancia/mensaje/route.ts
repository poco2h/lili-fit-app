import { NextRequest, NextResponse } from "next/server";
import type { DemoTwin, ConstanciaVertical, ConstanciaState } from "@/lib/demo/localTwin";
import { CONSTANCIA_VACIA } from "@/lib/demo/localTwin";
import { llamarGemini, type TurnoHistorial } from "@/lib/conversar/gemini";
import { systemPromptConstancia, detectarCrisis, respuestaCrisis } from "@/lib/constancia/systemPrompt";

const VERTICALES: ConstanciaVertical[] = ["deporte", "idiomas", "adicciones", "nutricion", "coaching", "otro"];

const ESQUEMA_MICROCOMPROMISO = {
  type: "OBJECT",
  properties: {
    microCompromiso: {
      type: "STRING",
      description: "Texto del micro-compromiso acordado (qué+cuándo+dónde). Cadena vacía si no se acordó ninguno en este turno.",
    },
  },
  required: ["microCompromiso"],
};

/** Registra el check-in de hoy una sola vez por día (idempotente). */
function conCheckinDeHoy(state: ConstanciaState): ConstanciaState {
  const hoy = new Date().toISOString().slice(0, 10);
  if (state.checkins.some((c) => c.fecha.slice(0, 10) === hoy)) return state;
  return { ...state, checkins: [...state.checkins, { fecha: new Date().toISOString() }] };
}

/**
 * A diferencia del resto de endpoints de Conversar, este NO lee/escribe
 * Supabase directamente — recibe el `twin` tal cual lo tiene el cliente
 * (useTwin()) y devuelve el `constancia` actualizado para que el propio
 * cliente lo persista con su `guardar()` habitual. Así funciona igual tanto
 * si el twin activo es el autoseguimiento del Owner como el demo del
 * Follower (localStorage) — el resto de MisHabitos.tsx ya sigue ese mismo
 * patrón (ninguna otra pestaña llama a Supabase por su cuenta).
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const twin = body?.twin as DemoTwin | undefined;
  const mensaje = String(body?.mensaje ?? "").slice(0, 2000);
  const habitoVertical = VERTICALES.includes(body?.habitoVertical) ? (body.habitoVertical as ConstanciaVertical) : "coaching";
  const habitoEspecifico = String(body?.habitoEspecifico ?? "").slice(0, 200);
  const historial = Array.isArray(body?.historial) ? (body.historial as TurnoHistorial[]) : undefined;

  if (!twin || !mensaje.trim() || !habitoEspecifico.trim()) {
    return NextResponse.json({ error: "Faltan twin, mensaje o habitoEspecifico" }, { status: 400 });
  }

  let state = twin.constancia ?? CONSTANCIA_VACIA;
  if (state.habitoVertical !== habitoVertical || state.habitoEspecifico !== habitoEspecifico) {
    state = { ...state, habitoVertical, habitoEspecifico };
  }

  // §10 — señales de crisis: sale del protocolo normal, registra flag_alerta, no llama al LLM.
  if (detectarCrisis(mensaje)) {
    const conMensaje: ConstanciaState = {
      ...state,
      flagAlerta: true,
      mensajes: [...state.mensajes, { who: "follower", texto: mensaje, fecha: new Date().toISOString() }],
    };
    return NextResponse.json({ respuesta: respuestaCrisis(habitoVertical), flagAlerta: true, constancia: conMensaje });
  }

  state = conCheckinDeHoy(state);

  const systemInstructionText = systemPromptConstancia(
    twin,
    { habitoVertical, habitoEspecifico, esPrimeraVez: state.checkins.length <= 1 },
    mensaje
  );
  const generada = await llamarGemini(systemInstructionText, mensaje, historial, ESQUEMA_MICROCOMPROMISO);

  if (!generada || "errorApiKeyFalta" in generada) {
    return NextResponse.json({
      respuesta:
        generada && "errorApiKeyFalta" in generada
          ? "Ahora mismo no puedo generar una respuesta completa (falta configurar GEMINI_API_KEY)."
          : "Ahora mismo no puedo generar una respuesta completa (fallo temporal al conectar con el modelo).",
      constancia: state,
    });
  }

  const microCompromisoTexto = typeof generada.extraccion?.microCompromiso === "string" ? generada.extraccion.microCompromiso.trim() : "";

  const nuevosMensajes: ConstanciaState["mensajes"] = [
    ...state.mensajes,
    { who: "follower", texto: mensaje, fecha: new Date().toISOString() },
    { who: "gemelo", texto: generada.texto, fecha: new Date().toISOString() },
  ];

  const estadoFinal: ConstanciaState = {
    ...state,
    mensajes: nuevosMensajes,
    ...(microCompromisoTexto
      ? { microCompromisos: [...state.microCompromisos, { texto: microCompromisoTexto, fecha: new Date().toISOString() }] }
      : {}),
  };

  return NextResponse.json({ respuesta: generada.texto, microCompromiso: microCompromisoTexto || null, constancia: estadoFinal });
}
