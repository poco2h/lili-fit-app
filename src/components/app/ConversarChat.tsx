"use client";

import { useEffect, useState } from "react";
import VideollamadaPanel from "./VideollamadaPanel";
import VozPanel from "./VozPanel";
import { leerMarcas } from "@/lib/demo/marcas";
import { useSessionBilling } from "@/lib/billing/useSessionBilling";
import type { Canal as CanalBilling } from "@/lib/billing/pricing";

type Msg = { who: "MindTwin" | "Tú"; text: string; time: string };
type Canal = "texto" | "voz" | "video";

const CANAL_BILLING: Record<Canal, CanalBilling> = {
  texto: "texto",
  voz: "voz",
  video: "video_rt",
};

function formatoMMSS(totalSeg: number) {
  const m = Math.floor(totalSeg / 60);
  const s = totalSeg % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function now() {
  return new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function saludoOnboardingOwner(ownerName: string) {
  return (
    `Hola, ${ownerName}. Soy tu MindTwin.\n\n` +
    "Para conocerte bien voy a hacerte unas preguntas, repartidas en 4 sesiones de unos 20 minutos cada una:\n" +
    "• Sesión 1: Personalidad · Eneagrama · Apego\n" +
    "• Sesión 2: Foco regulatorio · Inteligencia emocional · Microbiota (inicio)\n" +
    "• Sesión 3: Fortalezas de carácter · Microbiota (resto) · Voz y avatar\n" +
    "• Sesión 4: Tus datos deportivos y objetivos\n\n" +
    "Responde con sinceridad — solo tú verás esto. Si te cansas, dímelo y seguimos cuando quieras.\n\n" +
    "¿Empezamos con la Sesión 1?"
  );
}

function saludoOnboardingFollower(ownerName: string) {
  return (
    `Soy el MindTwin de ${ownerName}, una IA entrenada con su perfil.\n\n` +
    "Antes de nada, voy a conocerte un poco mejor para poder darte respuestas hechas a tu medida. Son unas preguntas " +
    "repartidas en 3 sesiones de unos 20 minutos cada una:\n" +
    "• Sesión 1: Personalidad · Eneagrama · Apego\n" +
    "• Sesión 2: Foco regulatorio · Inteligencia emocional\n" +
    "• Sesión 3: Fortalezas de carácter · Tu voz\n\n" +
    "Responde con sinceridad — solo tú verás esto. Si te cansas, dímelo y seguimos cuando quieras.\n\n" +
    "¿Empezamos con la Sesión 1?"
  );
}

function saludoInicial(role: "owner" | "follower", ownerName: string, onboardingCompleto: boolean) {
  if (role === "follower") {
    return onboardingCompleto
      ? `Soy el MindTwin de ${ownerName}, una IA entrenada con su perfil. ¿En qué puedo ayudarte hoy?`
      : saludoOnboardingFollower(ownerName);
  }
  return onboardingCompleto ? `Hola. Soy tu MindTwin. ¿En qué trabajamos hoy?` : saludoOnboardingOwner(ownerName);
}

const NUMERO_SESION: Record<string, string> = { S1: "1", S2: "2", S3: "3", S4: "4" };

export default function ConversarChat({
  ownerName,
  role,
  ownerId,
  followerId,
  canalInicial,
  onboardingCompleto = true,
  sesionActual,
}: {
  ownerName: string;
  role: "owner" | "follower";
  ownerId?: string;
  followerId?: string;
  canalInicial?: Canal;
  onboardingCompleto?: boolean;
  sesionActual?: "S1" | "S2" | "S3" | "S4";
}) {
  const [canal, setCanal] = useState<Canal>(canalInicial ?? "texto");
  const [messages, setMessages] = useState<Msg[]>([
    { who: "MindTwin", time: now(), text: saludoInicial(role, ownerName, onboardingCompleto) },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [marcaYaMencionada, setMarcaYaMencionada] = useState(false);
  const billing = useSessionBilling(CANAL_BILLING[canal]);

  // El saludo inicial se fija al montar, antes de que la sesión real del
  // owner (nombre, progreso de onboarding) se resuelva de forma asíncrona
  // (useOwnerSession/useTwin) — se corrige aquí en cuanto llega, solo si el
  // usuario no ha escrito nada todavía (no pisar una conversación ya empezada).
  useEffect(() => {
    setMessages((m) => (m.length === 1 && m[0].who === "MindTwin" ? [{ ...m[0], text: saludoInicial(role, ownerName, onboardingCompleto) }] : m));
  }, [ownerName, role, onboardingCompleto]);

  async function enviarTexto(mensaje: string) {
    if (!mensaje.trim() || sending) return;
    // Si no está activa, arranca la sesión (utilizando saldo de la bolsa o paquete de 20 min)
    if (!billing.activa) {
      await billing.asegurarSesion(20);
    }
    setInput("");
    setMessages((m) => [...m, { who: "Tú", text: mensaje, time: now() }]);
    setSending(true);

    try {
      const res = await fetch("/api/conversar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensaje,
          role,
          ownerName,
          ownerId,
          followerId,
          marcas: leerMarcas(),
          marcaYaMencionada,
          historial: messages.map(({ who, text }) => ({ who, text })),
        }),
      });
      const data = await res.json();
      const respuesta = data.respuesta ?? "No he podido responder.";
      setMessages((m) => [...m, { who: "MindTwin", text: respuesta, time: now() }]);
      if (data.marcaMencionada) setMarcaYaMencionada(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-glass flex flex-1 flex-col overflow-hidden">
      {!onboardingCompleto && sesionActual && (
        <div className="flex items-center gap-2 border-b border-white/10 px-4 pt-3 pb-1 text-sm font-bold text-white/90">
          💬 Sesión {NUMERO_SESION[sesionActual] ?? sesionActual}
        </div>
      )}
      {/* Barra superior de canales y bolsa de minutos */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 p-3">
        <div className="flex items-center gap-1.5">
          {([
            ["texto", "💬 Texto"],
            ["voz", "🎙️ Voz"],
            ["video", "🎬 Vídeo RT"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setCanal(key)}
              className={
                "rounded-full px-3 py-1.5 text-xs font-bold transition " +
                (canal === key ? "bg-white text-black" : "bg-white/5 text-white/40 hover:bg-white/10")
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* Estado de la bolsa / sesión activa */}
        <div className="flex items-center gap-3">
          {billing.activa ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1abc9c] animate-pulse">
                ● {formatoMMSS(billing.elapsedSec)}
              </span>
              <button
                onClick={() => billing.finalizar()}
                className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-black hover:bg-white/90 transition"
              >
                Finalizar sesión
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] text-white/70">
                Bolsa: <strong className="text-[#1abc9c]">{billing.walletBalanceMin} min</strong> disponibles
              </span>
            </div>
          )}
        </div>
      </div>

      {billing.resultado && (
        <div className="bg-[#1abc9c]/10 border-b border-[#1abc9c]/20 px-4 py-2 text-xs flex items-center justify-between text-white/80">
          <span>
            Última sesión: {billing.resultado.actualMinDecimal ?? billing.resultado.actualMin} min consumidos · Te quedan {billing.resultado.walletBalanceMinutesExact ?? 0} min en tu bolsa
          </span>
          <button
            onClick={() => billing.asegurarSesion(20)}
            className="text-[#1abc9c] font-bold hover:underline"
          >
            Continuar conversando →
          </button>
        </div>
      )}

      {canal === "video" ? (
        <VideollamadaPanel ownerName={ownerName} />
      ) : canal === "voz" ? (
        <VozPanel ownerName={ownerName} ownerId={ownerId} role={role} />
      ) : (
        <>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => {
              const isTwin = m.who === "MindTwin";
              return (
                <div key={i} className={isTwin ? "flex flex-col items-start" : "flex flex-col items-end"}>
                  <span className={"mb-1 text-[10px] font-extrabold " + (isTwin ? "text-[#1abc9c]" : "text-white")}>
                    {m.who} <span className="ml-1 font-normal text-white/30">{m.time}</span>
                  </span>
                  <div
                    className={
                      "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed " +
                      (isTwin ? "rounded-bl-sm bg-[#1abc9c]/[0.07] text-white/90" : "rounded-br-sm bg-white/[0.11] text-white")
                    }
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
            {sending && <div className="text-xs text-white/40">MindTwin está escribiendo…</div>}
          </div>
          <div className="flex items-center gap-2 border-t border-white/10 p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  enviarTexto(input);
                }
              }}
              rows={1}
              placeholder="Escribe un mensaje..."
              className="flex-1 resize-none rounded-xl bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none"
            />
            <button
              onClick={() => enviarTexto(input)}
              disabled={sending}
              className="rounded-[11px] bg-white px-4 py-2.5 text-sm font-bold text-black disabled:opacity-50 hover:bg-white/90 transition"
            >
              →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
