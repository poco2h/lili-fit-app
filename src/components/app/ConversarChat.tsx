"use client";

import { useState } from "react";
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

export default function ConversarChat({
  ownerName,
  role,
}: {
  ownerName: string;
  role: "owner" | "follower";
}) {
  const [canal, setCanal] = useState<Canal>("texto");
  const [messages, setMessages] = useState<Msg[]>([
    {
      who: "MindTwin",
      time: now(),
      text: `Hola. Soy el MindTwin de ${ownerName}, una IA. ¿En qué puedo ayudarte hoy?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [marcaYaMencionada, setMarcaYaMencionada] = useState(false);
  const billing = useSessionBilling(CANAL_BILLING[canal]);

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
        body: JSON.stringify({ mensaje, role, ownerName, marcas: leerMarcas(), marcaYaMencionada }),
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
      {/* Barra superior de canales y bolsa de minutos */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 p-3">
        <div className="flex items-center gap-1.5">
          {(role === "owner"
            ? ([["texto", "💬 Texto"]] as const)
            : ([
                ["texto", "💬 Texto"],
                ["voz", "🎙️ Voz"],
                ["video", "🎬 Vídeo RT"],
              ] as const)
          ).map(([key, label]) => (
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
        <VozPanel ownerName={ownerName} />
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
