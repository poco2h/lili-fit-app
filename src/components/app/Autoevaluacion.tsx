"use client";

import { useState } from "react";
import { useVoiceInput } from "@/lib/voice/useVoiceInput";

type Habito = { id: string; nombre: string; color: string; rating: number };

const HABITOS_INICIALES: Habito[] = [
  { id: "sueno", nombre: "Calidad del sueño", color: "#34d399", rating: 4 },
  { id: "meditacion", nombre: "Meditación", color: "#fbbf24", rating: 2 },
  { id: "lectura", nombre: "Lectura 20 min", color: "#60a5fa", rating: 4 },
];

const NIVELES_ENERGIA = ["Muy bajo", "Bajo", "Normal", "Alto", "Muy alto"];
const EMOCIONES: Array<{ nombre: string; color: string }> = [
  { nombre: "Calma", color: "#fb923c" },
  { nombre: "Alegría", color: "#34d399" },
  { nombre: "Ansiedad", color: "#a78bfa" },
  { nombre: "Ira", color: "#f87171" },
  { nombre: "Apatía", color: "#94a3b8" },
];
const NEURO_RECETA = ["No", "Sí, alguna", "Sí, varias"];

function Estrellas({ valor, onChange }: { valor: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n)} className="text-lg leading-none">
          <span className={n <= valor ? "text-amber-400" : "text-white/15"}>★</span>
        </button>
      ))}
    </div>
  );
}

function fechaHoy() {
  return new Date().toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }).toUpperCase();
}

export default function Autoevaluacion() {
  const [habitos, setHabitos] = useState(HABITOS_INICIALES);
  const [energia, setEnergia] = useState("Normal");
  const [emocion, setEmocion] = useState("Alegría");
  const [neuroReceta, setNeuroReceta] = useState("Sí, alguna");
  const [nota, setNota] = useState("");
  const voz = useVoiceInput((texto) => setNota((n) => (n ? `${n} ${texto}` : texto)));

  function actualizarRating(id: string, rating: number) {
    setHabitos((h) => h.map((x) => (x.id === id ? { ...x, rating } : x)));
  }

  return (
    <div className="space-y-5">
      <div className="mt-glass flex items-center justify-between p-3 text-xs">
        <span className="text-white/60">
          🎤 ¿Prefieres responder por voz? Tu MindTwin te hace las preguntas y escucha tus respuestas.
        </span>
        <button onClick={voz.alternar} className="ml-3 flex-shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-black">
          {voz.escuchando ? "Escuchando..." : "Activar voz →"}
        </button>
      </div>
      {!voz.soportado && (
        <p className="text-xs text-amber-400">Tu navegador no soporta reconocimiento de voz.</p>
      )}

      <div className="mt-glass space-y-5 p-5">
        <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1abc9c]">
          Autoevaluación semanal · {fechaHoy()}
        </span>

        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-white/40">Valoración por hábito</p>
          <div className="space-y-3">
            {habitos.map((h) => (
              <div key={h.id} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full" style={{ background: h.color }} />
                  {h.nombre}
                </span>
                <Estrellas valor={h.rating} onChange={(v) => actualizarRating(h.id, v)} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white/40">Estado general</p>
          <p className="mb-2 text-sm text-white/70">Nivel de energía esta semana</p>
          <div className="grid grid-cols-5 gap-2">
            {NIVELES_ENERGIA.map((n) => (
              <button
                key={n}
                onClick={() => setEnergia(n)}
                className={
                  "rounded-full px-2 py-2 text-[11px] font-semibold " +
                  (energia === n ? "bg-white text-black" : "bg-white/5 text-white/50")
                }
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm text-white/70">Emoción predominante</p>
          <div className="flex flex-wrap gap-2">
            {EMOCIONES.map((e) => (
              <button
                key={e.nombre}
                onClick={() => setEmocion(e.nombre)}
                className={
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold " +
                  (emocion === e.nombre ? "bg-white text-black" : "bg-white/5 text-white/50")
                }
              >
                <span className="h-2 w-2 rounded-full" style={{ background: e.color }} />
                {e.nombre}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm text-white/70">¿Usaste alguna neuro-receta?</p>
          <div className="grid grid-cols-3 gap-2">
            {NEURO_RECETA.map((n) => (
              <button
                key={n}
                onClick={() => setNeuroReceta(n)}
                className={
                  "rounded-full px-3 py-2 text-xs font-semibold " +
                  (neuroReceta === n ? "bg-white text-black" : "bg-white/5 text-white/50")
                }
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm text-white/70">Nota para tu MindTwin</p>
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            rows={2}
            placeholder="¿Qué quieres que tu MindTwin recuerde de esta semana?"
            className="w-full resize-none rounded-xl bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none"
          />
        </div>

        <button className="w-full rounded-full bg-white py-3 text-sm font-bold text-black">
          Guardar autoevaluación →
        </button>
      </div>
    </div>
  );
}
