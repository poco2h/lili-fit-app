"use client";

import { useState } from "react";
import { useVoiceInput } from "@/lib/voice/useVoiceInput";
import { HABITOS_MICROBIOMA, HABITOS_POR_DEPORTE, type Deporte, type HabitoDeporte } from "@/lib/habitos/data";

type Modo = "microbiota" | "deportes";

const ESTADO_DIGESTIVO = ["Muy malo", "Malo", "Normal", "Bueno", "Muy bueno"];
const SINTOMAS = ["Ninguno", "Hinchazón", "Pesadez", "Irregularidad"];
const ENERGIA_POST_COMIDA = ["Baja", "Normal", "Alta"];
const EMOCIONES_MICROBIOTA = ["😟", "😐", "😊", "💪", "🔥"];
const RECETA_SEGUIDA = ["Sí", "No", "Parcialmente"];

const RECUPERACION_MUSCULAR = ["Muy mala", "Mala", "Normal", "Buena"];
const ENERGIA_ENTRENO = ["Baja", "Normal", "Alta", "Muy alta"];
const DOLOR_FISICO = ["Ninguno", "Leve", "Moderado", "Intenso"];
const SUENO_POST_ENTRENO = ["Malo", "Regular", "Bueno", "Excelente"];
const DIGESTIVO_ENTRENO = ["Sin molestias", "Leve pesadez", "Afectó rendimiento"];
const PLAN_MINDTWIN = ["Sí, completo", "Parcialmente", "No"];

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

function Opciones<T extends string>({ opciones, valor, onChange, cols }: { opciones: T[]; valor: T; onChange: (v: T) => void; cols?: number }) {
  return (
    <div className={"grid gap-2"} style={{ gridTemplateColumns: `repeat(${cols ?? opciones.length}, minmax(0, 1fr))` }}>
      {opciones.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={"rounded-full px-2 py-2 text-[11px] font-semibold " + (valor === o ? "bg-white text-black" : "bg-white/5 text-white/50")}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export default function Autoevaluacion({ modo, deporte }: { modo: Modo; deporte?: Deporte }) {
  const habitos: HabitoDeporte[] = modo === "microbiota" ? HABITOS_MICROBIOMA : deporte ? HABITOS_POR_DEPORTE[deporte] : [];
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const [estadoDigestivo, setEstadoDigestivo] = useState(ESTADO_DIGESTIVO[2]);
  const [sintomas, setSintomas] = useState(SINTOMAS[0]);
  const [energiaPostComida, setEnergiaPostComida] = useState(ENERGIA_POST_COMIDA[1]);
  const [emocion, setEmocion] = useState(EMOCIONES_MICROBIOTA[2]);
  const [recetaSeguida, setRecetaSeguida] = useState(RECETA_SEGUIDA[0]);

  const [recuperacion, setRecuperacion] = useState(RECUPERACION_MUSCULAR[2]);
  const [energiaEntreno, setEnergiaEntreno] = useState(ENERGIA_ENTRENO[1]);
  const [dolor, setDolor] = useState(DOLOR_FISICO[0]);
  const [suenoPostEntreno, setSuenoPostEntreno] = useState(SUENO_POST_ENTRENO[2]);
  const [digestivoEntreno, setDigestivoEntreno] = useState(DIGESTIVO_ENTRENO[0]);
  const [planMindtwin, setPlanMindtwin] = useState(PLAN_MINDTWIN[0]);

  const voz = useVoiceInput(() => {});

  function rating(nombre: string) {
    return ratings[nombre] ?? 5;
  }
  function setRating(nombre: string, v: number) {
    setRatings((r) => ({ ...r, [nombre]: v }));
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-white/40">Valoración por hábito</p>
        <div className="space-y-3">
          {habitos.map((h) => (
            <div key={h.nombre} className="flex items-center justify-between">
              <span className="text-sm">{h.emoji} {h.nombre}</span>
              <Estrellas valor={rating(h.nombre)} onChange={(v) => setRating(h.nombre, v)} />
            </div>
          ))}
        </div>
      </div>

      {modo === "microbiota" ? (
        <>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white/40">Estado digestivo</p>
            <Opciones opciones={ESTADO_DIGESTIVO} valor={estadoDigestivo} onChange={setEstadoDigestivo} />
          </div>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white/40">Síntomas</p>
            <Opciones opciones={SINTOMAS} valor={sintomas} onChange={setSintomas} />
          </div>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white/40">Energía post-comida</p>
            <Opciones opciones={ENERGIA_POST_COMIDA} valor={energiaPostComida} onChange={setEnergiaPostComida} />
          </div>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white/40">Emoción predominante</p>
            <Opciones opciones={EMOCIONES_MICROBIOTA} valor={emocion} onChange={setEmocion} />
          </div>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white/40">¿Seguiste alguna receta recomendada?</p>
            <Opciones opciones={RECETA_SEGUIDA} valor={recetaSeguida} onChange={setRecetaSeguida} />
          </div>
        </>
      ) : (
        <>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white/40">Recuperación muscular</p>
            <Opciones opciones={RECUPERACION_MUSCULAR} valor={recuperacion} onChange={setRecuperacion} />
          </div>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white/40">Energía en entreno</p>
            <Opciones opciones={ENERGIA_ENTRENO} valor={energiaEntreno} onChange={setEnergiaEntreno} />
          </div>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white/40">Dolor / molestia física</p>
            <Opciones opciones={DOLOR_FISICO} valor={dolor} onChange={setDolor} />
          </div>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white/40">Sueño post-entreno</p>
            <Opciones opciones={SUENO_POST_ENTRENO} valor={suenoPostEntreno} onChange={setSuenoPostEntreno} />
          </div>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white/40">Estado digestivo durante entreno</p>
            <Opciones opciones={DIGESTIVO_ENTRENO} valor={digestivoEntreno} onChange={setDigestivoEntreno} />
          </div>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white/40">¿Usaste algún plan del MindTwin?</p>
            <Opciones opciones={PLAN_MINDTWIN} valor={planMindtwin} onChange={setPlanMindtwin} />
          </div>
        </>
      )}

      <div className="mt-glass flex items-center justify-between p-3 text-xs">
        <span className="text-white/60">
          🎙️ {modo === "microbiota" ? "Pulsa para evaluación con tu MindTwin" : "Evaluación deportiva con tu MindTwin"}
        </span>
        <button onClick={voz.alternar} className="ml-3 flex-shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-black">
          {voz.escuchando ? "Escuchando..." : "Activar voz →"}
        </button>
      </div>
      {!voz.soportado && (
        <p className="text-xs text-amber-400">Tu navegador no soporta reconocimiento de voz.</p>
      )}

      <button className="w-full rounded-full bg-white py-3 text-sm font-bold text-black">
        {modo === "microbiota" ? "Guardar autoevaluación →" : "Guardar evaluación deportiva →"} MindTwin registra
      </button>
    </div>
  );
}
