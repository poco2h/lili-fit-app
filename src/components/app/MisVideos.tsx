"use client";

import { useEffect, useRef, useState } from "react";
import type { VariantePV, VideoJobResult } from "@/lib/videos/pipeline";
import { useOwnerSession } from "@/lib/session/useOwnerSession";

const VARIANTES: Array<{ key: VariantePV; nombre: string; desc: string; cuando: string }> = [
  { key: "v3", nombre: "V1 · Hablas a cámara", desc: "Tu cara y busto, con la boca sincronizada a lo que dices.", cuando: "Úsalo para Reels o TikToks donde explicas algo mirando a cámara." },
  { key: "v4", nombre: "V2 · Cuerpo en acción", desc: "Tu cuerpo completo en movimiento, sin que hables a cámara.", cuando: "Úsalo para vídeos de ejercicio, técnica deportiva o demostraciones físicas." },
  { key: "combo", nombre: "V1+V2 · Combinado", desc: "Empieza en acción (V2), continúa hablando a cámara (V1) y cierra en acción otra vez.", cuando: "El formato recomendado: capta la atención con movimiento y explica con tu cara." },
  { key: "heygen", nombre: "HeyGen · Máxima calidad", desc: "Tu Digital Twin de HeyGen, entrenado con un vídeo real tuyo de 2 minutos.", cuando: "El más realista, pero necesitas haberlo entrenado antes en heygen.com y guardado tu avatar_id/voice_id." },
];

const PASOS = [
  "Elige abajo qué tipo de vídeo quieres (V1, V2 o el combinado).",
  "Escribe en el cuadro de texto exactamente lo que quieres que diga tu MindTwin.",
  "Pulsa \"Generar vídeo\" — el sistema clona tu voz y anima tu avatar automáticamente, no hace falta grabar nada.",
  "Espera unos segundos. Cuando esté listo, podrás descargarlo y subirlo directamente a Reels o TikTok.",
];

export default function MisVideos() {
  const { owner } = useOwnerSession();
  const [variante, setVariante] = useState<VariantePV>("v3");
  const [guion, setGuion] = useState("");
  const [resultado, setResultado] = useState<VideoJobResult | null>(null);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function iniciarPolling(statusUrl: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/videos/estado?statusUrl=${encodeURIComponent(statusUrl)}`);
      const data: VideoJobResult = await res.json();
      setResultado(data);
      if (data.estado !== "procesando" && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, 3000);
  }

  async function generar() {
    if (!guion.trim() || loading) return;
    setLoading(true);
    setResultado(null);
    try {
      const res = await fetch("/api/videos/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variante, guion, ownerId: owner?.ownerId }),
      });
      const data: VideoJobResult = await res.json();
      setResultado(data);
      if (data.estado === "procesando" && data.statusUrl) {
        iniciarPolling(data.statusUrl);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="mt-glass p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#1abc9c]">¿Primera vez aquí? Sigue estos 4 pasos</p>
        <ol className="space-y-1.5 text-sm text-white/70">
          {PASOS.map((p, i) => (
            <li key={i} className="flex gap-2">
              <span className="flex-shrink-0 font-bold text-[#1abc9c]">{i + 1}.</span>
              <span>{p}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        {VARIANTES.map((v) => (
          <button
            key={v.key}
            onClick={() => setVariante(v.key)}
            className={
              "mt-glass p-4 text-left border-2 transition " +
              (variante === v.key ? "border-[#1abc9c] bg-[#1abc9c]/[0.08]" : "border-transparent")
            }
          >
            <p className="font-semibold">{v.nombre}</p>
            <p className="mt-1 text-xs text-white/60">{v.desc}</p>
            <p className="mt-2 text-[11px] text-[#1abc9c]">{v.cuando}</p>
          </button>
        ))}
      </div>

      <div className="mt-glass p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-white/50">Elige qué quieres generar</p>
        <div className="flex flex-wrap gap-2">
          {VARIANTES.map((v) => (
            <button
              key={v.key}
              onClick={() => setVariante(v.key)}
              className={
                "rounded-full px-4 py-2 text-sm font-bold transition " +
                (variante === v.key ? "bg-[#1abc9c] text-black" : "bg-white/10 text-white/70 hover:bg-white/15")
              }
            >
              {v.nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-glass p-5">
        <label className="text-sm text-white/60">Paso 2 · Guion — qué dirá tu MindTwin</label>
        <textarea
          value={guion}
          onChange={(e) => setGuion(e.target.value)}
          rows={4}
          placeholder="Hoy os cuento cómo recuperar mejor después de una sesión intensa..."
          className="mt-2 w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm placeholder:text-white/30 focus:outline-none"
        />
        <p className="mt-3 text-xs text-white/50">
          Vas a generar: <span className="font-bold text-[#1abc9c]">{VARIANTES.find((v) => v.key === variante)?.nombre}</span>
        </p>
        <button
          onClick={generar}
          disabled={loading || !guion.trim()}
          className="mt-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black disabled:opacity-40"
        >
          {loading ? "Generando..." : `Paso 3 · Generar vídeo (${VARIANTES.find((v) => v.key === variante)?.nombre}) →`}
        </button>

        {resultado && (
          <div
            className={
              "mt-4 rounded-lg p-3 text-sm " +
              (resultado.estado === "completado"
                ? "bg-[#1abc9c]/10 text-[#1abc9c]"
                : resultado.estado === "simulado" || resultado.estado === "procesando"
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-red-500/10 text-red-400")
            }
          >
            {resultado.mensaje}
            {resultado.estado === "completado" && resultado.videoUrl && (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video controls src={resultado.videoUrl} className="mt-3 w-full rounded-lg" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
