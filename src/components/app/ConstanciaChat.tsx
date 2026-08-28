"use client";

import { useState } from "react";
import { useTwin } from "@/lib/session/useTwin";
import type { ConstanciaVertical } from "@/lib/demo/localTwin";
import { CONSTANCIA_VACIA } from "@/lib/demo/localTwin";
import { rachaActual, diasSinCheckin } from "@/lib/constancia/calc";

const VERTICALES: Array<{ key: ConstanciaVertical; label: string; emoji: string }> = [
  { key: "deporte", label: "Deporte", emoji: "🏃" },
  { key: "idiomas", label: "Idiomas", emoji: "🗣️" },
  { key: "adicciones", label: "Adicciones", emoji: "🕯️" },
  { key: "nutricion", label: "Nutrición", emoji: "🥗" },
  { key: "coaching", label: "Coaching / hábito general", emoji: "🎯" },
  { key: "otro", label: "Otro", emoji: "✨" },
];

/** §0 del prompt de Constancia — MINDTWINS_CONSTANCIA_PROMPT_v1. Chat dedicado, con el mismo `twin` de useTwin() que el resto de Mis Hábitos. */
export default function ConstanciaChat() {
  const { twin, guardar } = useTwin();
  const [vertical, setVertical] = useState<ConstanciaVertical | null>(twin?.constancia?.habitoVertical ?? null);
  const [habitoTexto, setHabitoTexto] = useState(twin?.constancia?.habitoEspecifico ?? "");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (!twin) {
    return <div className="mt-glass p-6 text-sm text-white/60">Completa primero tu EGO ID + GUT ID.</div>;
  }

  const state = twin.constancia ?? CONSTANCIA_VACIA;
  const habitoConfigurado = !!(state.habitoVertical && state.habitoEspecifico);

  function elegirHabito(v: ConstanciaVertical, especifico: string) {
    if (!twin || !especifico.trim()) return;
    guardar({ ...twin, constancia: { ...state, habitoVertical: v, habitoEspecifico: especifico.trim() } });
  }

  async function enviar() {
    if (!twin || !mensaje.trim() || !state.habitoVertical || !state.habitoEspecifico || enviando) return;
    const texto = mensaje.trim();
    setMensaje("");
    setEnviando(true);
    try {
      const historial = state.mensajes.slice(-8).map((m) => ({ who: m.who === "gemelo" ? "MindTwin" : "Tú", text: m.texto }));
      const res = await fetch("/api/constancia/mensaje", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          twin,
          mensaje: texto,
          habitoVertical: state.habitoVertical,
          habitoEspecifico: state.habitoEspecifico,
          historial,
        }),
      });
      const data = await res.json();
      if (data.constancia) guardar({ ...twin, constancia: data.constancia });
    } finally {
      setEnviando(false);
    }
  }

  if (!habitoConfigurado) {
    return (
      <div className="space-y-4">
        <div className="mt-glass p-5">
          <p className="mb-1 text-sm font-bold">¿Con qué hábito quieres trabajar tu constancia?</p>
          <p className="mb-4 text-xs text-white/40">Tu MindTwin te acompaña específicamente con este hábito — puedes cambiarlo cuando quieras.</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {VERTICALES.map((v) => (
              <button
                key={v.key}
                onClick={() => setVertical(v.key)}
                className={
                  "rounded-full px-3 py-1.5 text-xs font-semibold " +
                  (vertical === v.key ? "bg-[#1abc9c]/20 text-[#1abc9c]" : "bg-white/5 text-white/50 hover:text-white")
                }
              >
                {v.emoji} {v.label}
              </button>
            ))}
          </div>
          {vertical && (
            <>
              <input
                value={habitoTexto}
                onChange={(e) => setHabitoTexto(e.target.value)}
                placeholder="Ej: running 3 días/semana, inglés 30 min/día, sin alcohol..."
                className="mb-3 w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none"
              />
              <button
                onClick={() => elegirHabito(vertical, habitoTexto)}
                disabled={!habitoTexto.trim()}
                className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black disabled:opacity-40"
              >
                Empezar →
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const racha = rachaActual(state);
  const dias = diasSinCheckin(state);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2">
        <p className="text-xs text-white/60">
          🔥 {state.habitoEspecifico} · racha {racha}d{dias != null && dias > 0 ? ` · ${dias}d sin check-in` : ""}
        </p>
        <button
          onClick={() => {
            setVertical(state.habitoVertical ?? null);
            setHabitoTexto("");
            if (!twin) return;
            guardar({ ...twin, constancia: { ...state, habitoVertical: undefined, habitoEspecifico: undefined } });
          }}
          className="text-[10px] text-white/40 hover:text-white/70"
        >
          Cambiar hábito
        </button>
      </div>

      <div className="mt-glass flex max-h-[420px] min-h-[220px] flex-col gap-3 overflow-y-auto p-4">
        {state.mensajes.length === 0 && (
          <p className="text-center text-xs text-white/30">Escribe algo para empezar — tu MindTwin abre la conversación.</p>
        )}
        {state.mensajes.map((m, i) => (
          <div key={i} className={"flex " + (m.who === "follower" ? "justify-end" : "justify-start")}>
            <div
              className={
                "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm " +
                (m.who === "follower" ? "bg-[#1abc9c] text-black" : "bg-white/10 text-white/85")
              }
            >
              {m.texto}
            </div>
          </div>
        ))}
        {enviando && <p className="text-xs text-white/30">Escribiendo…</p>}
      </div>

      {state.flagAlerta && (
        <p className="rounded-lg bg-red-500/10 p-3 text-[11px] text-red-400">
          Se ha registrado una alerta en esta conversación — tu profesional podrá verlo (solo la señal, nunca el contenido).
        </p>
      )}

      <div className="flex items-center gap-2">
        <input
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviar()}
          placeholder="Escribe un mensaje..."
          className="flex-1 rounded-full bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none"
        />
        <button
          onClick={enviar}
          disabled={!mensaje.trim() || enviando}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black disabled:opacity-40"
        >
          →
        </button>
      </div>
    </div>
  );
}
