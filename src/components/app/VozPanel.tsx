"use client";

import { useState } from "react";

/**
 * Llamada de voz Follower — misma estructura que VideollamadaPanel, pero con
 * la voz clonada del profesional (ElevenLabs) en vez de Tavus CVI.
 * ELEVENLABS_API_KEY pendiente — placeholder honesto hasta que exista.
 */
export default function VozPanel({ ownerName }: { ownerName: string }) {
  const [conectando, setConectando] = useState(false);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#1abc9c]/10 text-3xl">
        🎙️
      </div>
      <p className="text-sm text-white/70">
        Llamada de voz en tiempo real con la voz clonada de {ownerName}.
      </p>
      <button
        onClick={() => setConectando(true)}
        disabled={conectando}
        className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black disabled:opacity-50"
      >
        {conectando ? "Conectando..." : "Iniciar llamada de voz"}
      </button>
      {conectando && (
        <p className="max-w-sm rounded-lg bg-amber-500/10 p-3 text-xs text-amber-400">
          Falta configurar ELEVENLABS_API_KEY y clonar la voz del profesional — en cuanto
          estén, este botón abre la llamada de voz real.
        </p>
      )}
    </div>
  );
}
