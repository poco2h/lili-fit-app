"use client";

import { useState } from "react";

/**
 * Videollamada Follower (V1) — Tavus CVI, WebRTC (V10 §12). Regla fija:
 * V1/V2 = Tavus, sin excepciones (nunca Higgsfield aquí). Llama a
 * /api/tavus/conversar, que devuelve un conversation_url (Daily.co) y se
 * embebe directo en un iframe — así lo documenta Tavus, sin SDK adicional.
 */
export default function VideollamadaPanel({ ownerName, ownerId }: { ownerName: string; ownerId?: string }) {
  const [estado, setEstado] = useState<"idle" | "conectando" | "activa" | "error">("idle");
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [faceEsStock, setFaceEsStock] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function iniciarVideollamada() {
    setEstado("conectando");
    setError(null);
    try {
      const res = await fetch("/api/tavus/conversar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId, ownerName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      setConversationUrl(data.conversationUrl);
      setFaceEsStock(!!data.faceEsStock);
      setEstado("activa");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      setEstado("error");
    }
  }

  if (estado === "activa" && conversationUrl) {
    return (
      <div className="flex flex-1 flex-col items-center gap-2 p-4">
        {faceEsStock && (
          <p className="max-w-sm text-center text-[11px] text-white/40">
            Este profesional aún no ha clonado su cara en Tavus — estás hablando con un avatar de muestra.
          </p>
        )}
        <iframe
          title="Videollamada MindTwin"
          src={conversationUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="w-full flex-1 rounded-xl border border-white/10"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#1abc9c]/10 text-3xl">
        🎬
      </div>
      <p className="text-sm text-white/70">
        Videollamada en tiempo real con el avatar de {ownerName} (Tavus CVI).
      </p>
      <button
        onClick={iniciarVideollamada}
        disabled={estado === "conectando"}
        className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black disabled:opacity-50"
      >
        {estado === "conectando" ? "Conectando..." : "Iniciar videollamada"}
      </button>
      {estado === "error" && error && (
        <p className="max-w-sm rounded-lg bg-red-500/10 p-3 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
