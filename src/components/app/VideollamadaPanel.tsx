"use client";

import { useState } from "react";

/**
 * Videollamada Follower (V1) — Tavus CVI, WebRTC (V10 §12). Regla fija:
 * V1/V2 = Tavus, sin excepciones (nunca Higgsfield aquí). TAVUS_API_KEY
 * está pendiente (estado de Juan, 11 ago 2026) — placeholder honesto del
 * punto de embed hasta que exista la réplica (tavus_replica_id).
 */
export default function VideollamadaPanel({ ownerName }: { ownerName: string }) {
  const [conectando, setConectando] = useState(false);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#1abc9c]/10 text-3xl">
        🎬
      </div>
      <p className="text-sm text-white/70">
        Videollamada en tiempo real con el avatar de {ownerName} (Tavus CVI).
      </p>
      <button
        onClick={() => setConectando(true)}
        disabled={conectando}
        className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black disabled:opacity-50"
      >
        {conectando ? "Conectando..." : "Iniciar videollamada"}
      </button>
      {conectando && (
        <p className="max-w-sm rounded-lg bg-amber-500/10 p-3 text-xs text-amber-400">
          Falta configurar TAVUS_API_KEY y generar la réplica del profesional
          (tavus_replica_id) — en cuanto estén, este botón abre la sesión WebRTC real.
        </p>
      )}
    </div>
  );
}
