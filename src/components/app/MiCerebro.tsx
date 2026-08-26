"use client";

import { useState } from "react";
import { useTwin } from "@/lib/session/useTwin";
import { badgeGutId } from "@/lib/gut/types";
import { ENEAGRAMA_TRIADA } from "@/lib/ego/eneagramaInfo";
import { VIA_FORTALEZAS } from "@/lib/ego/types";
import { descripcionRasgo } from "@/lib/ego/bigFiveDescripciones";
import { TALES_INFO, enTuCaso } from "@/lib/ego/talesInsights";

function Barra({ label, valor, desc }: { label: string; valor: number; desc?: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-white/60">{label}</span>
        <span className="font-bold text-[#1abc9c]">{valor}/100</span>
      </div>
      <div className="h-1.5 rounded bg-white/[0.06]">
        <div className="h-full rounded bg-gradient-to-r from-[#1abc9c] to-[#0ed4b5]" style={{ width: `${valor}%` }} />
      </div>
      {desc && <p className="mt-1 text-[11px] text-white/45">{desc}</p>}
    </div>
  );
}

/** Barra degradada por intensidad (V10 "barra de peso por filósofo") — hue va de gris/frío a verde-turquesa vivo según el %. */
function BarraTales({ pct }: { pct: number }) {
  const from = pct > 60 ? "#1abc9c" : pct > 35 ? "#818cf8" : "#64748b";
  const to = pct > 60 ? "#5eead4" : pct > 35 ? "#a78bfa" : "#94a3b8";
  return (
    <div className="h-2 rounded-full bg-white/[0.06]">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${from}, ${to})` }} />
    </div>
  );
}

export default function MiCerebro() {
  const { twin } = useTwin();
  const [tab, setTab] = useState<"quien-soy" | "tales">("quien-soy");

  if (!twin) {
    return (
      <div className="mt-glass p-6 text-sm text-white/60">
        Todavía no has completado tu EGO ID.{" "}
        <a href="/app/onboarding" className="text-[#1abc9c] underline">
          Empezar ahora →
        </a>
      </div>
    );
  }

  const triada = ENEAGRAMA_TRIADA[twin.ego.eneagrama.tipo];
  const viaCrecimiento = VIA_FORTALEZAS.filter((v) => !twin.ego.via_top5.includes(v)).slice(-5);
  const lentesOrdenadas = twin.tales_weights
    ? Object.entries(twin.tales_weights).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab("quien-soy")}
          className={"rounded-full px-4 py-2 text-sm font-semibold " + (tab === "quien-soy" ? "bg-white text-black" : "bg-white/10 text-white/70")}
        >
          Quién soy
        </button>
        <button
          onClick={() => setTab("tales")}
          className={"rounded-full px-4 py-2 text-sm font-semibold " + (tab === "tales" ? "bg-white text-black" : "bg-white/10 text-white/70")}
        >
          Cómo me interpreta la IA
        </button>
      </div>

      {tab === "quien-soy" ? (
        <div className="space-y-4">
          <div className="mt-glass p-5">
            <p className="text-xs uppercase tracking-wide text-white/40">Tu carácter — Eneagrama</p>
            <p className="mt-1 text-lg font-bold text-[#1abc9c]">
              T{twin.ego.eneagrama.tipo}w{twin.ego.eneagrama.ala} · El {triada?.nombre}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
              <div><span className="text-white/40">Tu miedo</span><p className="mt-0.5 text-white/80">{triada?.miedo}</p></div>
              <div><span className="text-white/40">Tu emoción</span><p className="mt-0.5 text-white/80">{triada?.emocion}</p></div>
              <div><span className="text-white/40">Tu virtud</span><p className="mt-0.5 text-white/80">{triada?.virtud}</p></div>
            </div>
          </div>

          <div className="mt-glass space-y-4 p-5">
            <p className="text-xs uppercase tracking-wide text-white/40">Tu personalidad — Cinco Grandes Rasgos</p>
            <Barra label="Mente abierta" valor={twin.ego.big_five.O} desc={descripcionRasgo("O", twin.ego.big_five.O)} />
            <Barra label="Disciplina" valor={twin.ego.big_five.C} desc={descripcionRasgo("C", twin.ego.big_five.C)} />
            <Barra label="Energía social" valor={twin.ego.big_five.E} desc={descripcionRasgo("E", twin.ego.big_five.E)} />
            <Barra label="Calidez y empatía" valor={twin.ego.big_five.A} desc={descripcionRasgo("A", twin.ego.big_five.A)} />
            <Barra label="Intensidad emocional" valor={twin.ego.big_five.N} desc={descripcionRasgo("N", twin.ego.big_five.N)} />
          </div>

          <div className="mt-glass p-4">
            <p className="text-[10px] uppercase tracking-wide text-white/40">Tu vínculo — Estilo de apego</p>
            <p className="mt-1 font-bold capitalize text-[#1abc9c]">Apego {twin.ego.apego}</p>
            <p className="mt-1 text-[11px] text-white/45">Cómo te relacionas emocionalmente — tu twin lo tiene en cuenta en cada respuesta.</p>
          </div>

          <div className="mt-glass p-4">
            <p className="text-[10px] uppercase tracking-wide text-white/40">Tu motor interior — Qué te impulsa</p>
            <p className="mt-1 font-bold text-[#1abc9c]">{twin.ego.rfq === "promocion" ? "Motor de aspiración" : "Motor de prevención"}</p>
            <p className="mt-1 text-[11px] text-white/45">
              {twin.ego.rfq === "promocion"
                ? "Te mueves hacia lo que deseas lograr. Tu twin te habla desde la aspiración, no desde la precaución."
                : "Te mueves evitando errores y riesgos. Tu twin prioriza la seguridad y el detalle."}
            </p>
          </div>

          <div className="mt-glass p-4">
            <p className="text-[10px] uppercase tracking-wide text-white/40">Tu inteligencia emocional</p>
            <p className="mt-1 text-2xl font-bold text-[#1abc9c]">{twin.ego.teique.ie_global}/100</p>
          </div>

          <div className="mt-glass p-4">
            <p className="mb-2 text-[10px] uppercase tracking-wide text-white/40">Tus fortalezas de carácter · VIA — Top 5</p>
            <div className="flex flex-wrap gap-2">
              {twin.ego.via_top5.map((v) => (
                <span key={v} className="rounded-full bg-[#1abc9c]/10 px-3 py-1 text-xs text-[#1abc9c]">✦ {v}</span>
              ))}
            </div>
            <p className="mb-2 mt-3 text-[10px] uppercase tracking-wide text-white/40">Áreas de crecimiento</p>
            <div className="flex flex-wrap gap-2">
              {viaCrecimiento.map((v) => (
                <span key={v} className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/50">△ {v}</span>
              ))}
            </div>
          </div>

          <div className="mt-glass p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-wide text-white/40">Tu microbiota — GUT ID</p>
              <span className={"rounded-full px-2 py-0.5 text-[9px] font-bold " + (badgeGutId(twin.gut) === "actualizado" ? "bg-[#1abc9c]/20 text-[#1abc9c]" : "bg-amber-500/20 text-amber-400")}>
                {badgeGutId(twin.gut)}
              </span>
            </div>
            <p className="mt-1 text-2xl font-bold text-[#1abc9c]">{twin.gut.gut_baseline_score ?? "—"}/1000</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="mt-glass p-4">
            <p className="text-xs text-white/50">
              Diez lentes filosóficas, siempre activas a la vez. Más peso = más presente en cómo responde tu twin.
              Kant es la única fija — nunca se desactiva.
            </p>
          </div>

          <div className="space-y-3">
            {lentesOrdenadas.map(([filosofo, peso]) => {
              const info = TALES_INFO[filosofo as keyof typeof TALES_INFO];
              const pct = Math.round(peso * 100);
              const fijo = filosofo === "Kant" || filosofo === "Gorgias" || filosofo === "Homero";
              return (
                <div key={filosofo} className="mt-glass p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{info.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold">{info.titulo}</p>
                      <p className="text-[11px] text-white/40">{info.subtitulo}</p>
                    </div>
                    <span className="text-lg font-extrabold text-[#1abc9c]">
                      {pct}%{fijo && filosofo !== "Kant" ? " mín." : ""}
                    </span>
                  </div>
                  <div className="mt-2">
                    <BarraTales pct={pct} />
                  </div>
                  <p className="mt-2 text-[12px] text-white/60">{info.descripcion}</p>
                  <p className="mt-2 rounded-lg bg-white/[0.04] p-2 text-[11px] text-white/50">
                    <span className="font-bold text-[#1abc9c]">EN TU CASO · </span>
                    {enTuCaso(filosofo as keyof typeof TALES_INFO, twin.ego)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
