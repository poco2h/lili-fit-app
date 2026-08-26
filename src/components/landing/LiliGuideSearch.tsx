"use client";

import { useEffect, useRef, useState } from "react";

type RespuestaKey = "funciona" | "ego" | "gut" | "precio" | "default";

const RESPUESTAS: Record<RespuestaKey, string> = {
  funciona:
    "Tu entrenador o nutricionista construye su MindTwin en 3 sesiones de 20 min (EGO ID, GUT ID, voz clonada y avatar). Tú te das de alta, generas tu propio perfil EGO ID en otra conversación de 20 min, y a partir de ahí hablas con su gemelo cerebral cuando quieras — texto, voz o videollamada, 24/7.",
  ego: "Tu EGO ID es el perfil psicológico que el sistema construye contigo conversando de forma natural: Big Five, Eneagrama y estilo de apego. Gracias a él, las respuestas de tu MindTwin no son genéricas — están adaptadas a cómo eres tú, qué te motiva y cómo te comunicas.",
  gut: "Tu GUT ID es tu perfil de microbioma: qué bacterias dominan, cuáles te faltan y qué síntomas digestivos son frecuentes. Se actualiza con tus autoevaluaciones semanales en Mis Hábitos y personaliza tus recomendaciones de nutrición y entrenamiento.",
  precio: "Los precios los fija cada profesional. Pagas solo las sesiones que uses — sin permanencia, sin suscripción fija. Puedes ver la tarifa exacta de cada entrenador o nutricionista en su perfil antes de contratar.",
  default:
    "Con Mindtwins · Lili Fit accedes al gemelo cerebral de tu entrenador o nutricionista: texto, voz real o videollamada, cuando lo necesites. El sistema usa tu EGO ID y tu GUT ID para personalizar cada sesión. ¿Quieres saber más sobre algo en concreto?",
};

const CHIPS: Array<{ label: string; key: RespuestaKey }> = [
  { label: "¿Cómo funciona?", key: "funciona" },
  { label: "¿Qué es el EGO ID?", key: "ego" },
  { label: "¿Qué es el GUT ID?", key: "gut" },
  { label: "¿Cuánto cuesta?", key: "precio" },
];

function detectarClave(texto: string): RespuestaKey {
  const q = texto.toLowerCase();
  if (q.includes("precio") || q.includes("cuesta") || q.includes("coste") || q.includes("tarifa")) return "precio";
  if (q.includes("gut") || q.includes("microbio") || q.includes("digest")) return "gut";
  if (q.includes("ego") || q.includes("perfil") || q.includes("psicol") || q.includes("person")) return "ego";
  if (q.includes("funciona") || q.includes("cómo") || q.includes("como") || q.includes("empez")) return "funciona";
  return "default";
}

export default function LiliGuideSearch({ marca = "Lili Fit" }: { marca?: string }) {
  const [valor, setValor] = useState("");
  const [visible, setVisible] = useState(false);
  const [pensando, setPensando] = useState(false);
  const [respuesta, setRespuesta] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function escribirRespuesta(texto: string) {
    if (timerRef.current) clearInterval(timerRef.current);
    setRespuesta("");
    let i = 0;
    timerRef.current = setInterval(() => {
      if (i >= texto.length) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return;
      }
      const ch = texto[i];
      i++;
      setRespuesta((r) => r + ch);
    }, 18);
  }

  function procesar(texto: string) {
    if (!texto.trim()) return;
    setVisible(true);
    setPensando(true);
    setTimeout(() => {
      setPensando(false);
      escribirRespuesta(RESPUESTAS[detectarClave(texto)]);
    }, 900);
  }

  return (
    <div className="border-y border-white/15 bg-black px-6 py-14 text-white md:px-16">
      <div className="mx-auto max-w-5xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">Lili · Tu guía personal</p>
        <p className="mt-2 text-lg font-normal">¿Tienes alguna pregunta sobre {marca}?</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            procesar(valor);
          }}
          className="mt-7 flex items-stretch gap-5 border-l border-white/40"
        >
          <div className="flex w-[52px] flex-shrink-0 items-center justify-center text-3xl">🐜</div>
          <div className="flex flex-1 items-center gap-2.5 px-2">
            <svg width="18" height="18" viewBox="0 0 24 24" stroke="#fff" fill="none" strokeWidth="1.8" opacity="0.7">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="¿Cómo funciona? ¿Qué es el EGO ID? ¿Qué es el GUT ID? ¿Cuánto cuesta?"
              className="w-full bg-transparent font-serif text-[15px] font-light text-white placeholder:text-white/40 focus:outline-none"
            />
          </div>
          <div className="flex items-center border-l border-white/40 pl-5">
            <button
              type="submit"
              aria-label="Buscar"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white transition-opacity hover:opacity-70"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </form>

        <div className="mt-5 flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => {
                setValor(c.label);
                procesar(c.label);
              }}
              className="rounded-full border border-white/25 bg-white/5 px-3.5 py-1.5 text-[11px] tracking-wide text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              {c.label}
            </button>
          ))}
        </div>

        {visible && (
          <div className="mt-8 border-t border-white/15 pt-8">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">Lili responde</p>
            <div className="max-w-2xl text-sm font-light leading-relaxed text-white">
              {pensando ? <span className="italic text-white/50">Lili está pensando…</span> : respuesta}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
