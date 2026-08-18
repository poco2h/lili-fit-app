"use client";

import { useEffect, useMemo, useState } from "react";
import { SESIONES } from "@/lib/ego/items";
import { calcularEgoId } from "@/lib/ego/scoring";
import { calcularTalesWeights } from "@/lib/ego/talesWeights";
import { PREGUNTAS_BASELINE, calcularGutBaseline, type RespuestasBaseline } from "@/lib/gut/baseline";
import type { Respuestas } from "@/lib/ego/types";
import { guardarDemoTwin, SOURCES_VACIO, type Direcciones } from "@/lib/demo/localTwin";

const ORDEN: Array<"S1" | "S2" | "S3"> = ["S1", "S2", "S3"];
const ETIQUETAS: Record<"S1" | "S2" | "S3", string> = {
  S1: "Sesión 1 · EGO ID I (~20 min)",
  S2: "Sesión 2 · EGO ID II (~20 min)",
  S3: "Sesión 3 · Fortalezas + microbioma (~20 min)",
};

type Fase = "sesion" | "gut" | "direcciones" | "completo";

export default function OnboardingFlow({ ownerName }: { ownerName: string }) {
  const [sesionIdx, setSesionIdx] = useState(0);
  const [itemIdx, setItemIdx] = useState(0);
  const [respuestas, setRespuestas] = useState<Respuestas>({});
  const [gutRespuestas, setGutRespuestas] = useState<RespuestasBaseline>({});
  const [gutIdx, setGutIdx] = useState(0);
  const [direcciones, setDirecciones] = useState<Direcciones>({ domicilioPersonal: "", domicilioProfesional: "" });
  const [fase, setFase] = useState<Fase>("sesion");

  const sesion = ORDEN[sesionIdx];
  const items = SESIONES[sesion];
  const item = items[itemIdx];

  const resultado = useMemo(() => {
    if (fase !== "completo") return null;
    const ego = calcularEgoId(respuestas);
    const tales = calcularTalesWeights(ego);
    const gut = calcularGutBaseline(gutRespuestas);
    return { ego, tales, gut };
  }, [fase, respuestas, gutRespuestas]);

  useEffect(() => {
    if (resultado) {
      guardarDemoTwin({
        ego: resultado.ego,
        tales_weights: resultado.tales,
        gut: resultado.gut,
        tales_data: resultado.tales, // demo: tales_data arranca igual al peso inicial
        sources: SOURCES_VACIO,
        sesion_actual: "completo",
        direcciones,
      });
    }
  }, [resultado, direcciones]);

  function responder(valor: number) {
    setRespuestas((r) => ({ ...r, [item.id]: valor }));
    if (itemIdx + 1 < items.length) {
      setItemIdx(itemIdx + 1);
    } else if (sesionIdx + 1 < ORDEN.length) {
      setSesionIdx(sesionIdx + 1);
      setItemIdx(0);
    } else {
      setFase("gut");
    }
  }

  function responderGut(valor: number) {
    const pregunta = PREGUNTAS_BASELINE[gutIdx];
    setGutRespuestas((r) => ({ ...r, [pregunta.id]: valor }));
    if (gutIdx + 1 < PREGUNTAS_BASELINE.length) {
      setGutIdx(gutIdx + 1);
    } else {
      setFase("direcciones");
    }
  }

  if (fase === "completo" && resultado) {
    return (
      <div className="mt-glass space-y-4 p-6">
        <h2 className="text-lg font-bold text-[#1abc9c]">MindTwin activado ✓</h2>
        <p className="text-sm text-white/70">
          Perfil EGO ID calculado — 100% determinista, sin LLM. Formato compacto:
        </p>
        <p className="rounded-lg bg-white/5 p-3 font-mono text-xs text-white/80">
          {resultado.ego.serialized}
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {Object.entries(resultado.tales).map(([f, w]) => (
            <div key={f} className="flex justify-between rounded bg-white/5 px-3 py-1.5">
              <span>{f}</span>
              <span className="text-[#1abc9c]">{Math.round(w * 100)}%</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-white/70">
          GUT ID baseline: <span className="text-[#1abc9c]">{resultado.gut.gut_baseline_score}/1000</span>
          {resultado.gut.gatillos.length > 0 && (
            <> · gatillos detectados: {resultado.gut.gatillos.join(", ")}</>
          )}
        </p>
        <p className="text-xs text-white/40">
          Ir a Mi Cerebro para ver la visualización completa (Capa 1 + Capa 2 TALES 3D).
        </p>
      </div>
    );
  }

  if (fase === "direcciones") {
    return (
      <div className="mt-glass space-y-4 p-6">
        <p className="text-xs uppercase tracking-wide text-[#1abc9c]">Último paso · Tus domicilios</p>
        <p className="text-sm text-white/70">
          Los usamos para que tu agenda de Mis Hábitos pueda recomendarte restaurantes cerca de casa o de tu
          consulta cuando salgas a comer fuera.
        </p>
        <label className="block text-sm">
          <span className="mb-1 block text-white/60">Domicilio personal</span>
          <input
            value={direcciones.domicilioPersonal}
            onChange={(e) => setDirecciones((d) => ({ ...d, domicilioPersonal: e.target.value }))}
            placeholder="Calle, ciudad"
            className="w-full rounded-lg bg-white/5 px-3 py-2.5 text-sm placeholder:text-white/30 focus:outline-none"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-white/60">Domicilio profesional (consulta / centro de trabajo)</span>
          <input
            value={direcciones.domicilioProfesional}
            onChange={(e) => setDirecciones((d) => ({ ...d, domicilioProfesional: e.target.value }))}
            placeholder="Calle, ciudad"
            className="w-full rounded-lg bg-white/5 px-3 py-2.5 text-sm placeholder:text-white/30 focus:outline-none"
          />
        </label>
        <button
          onClick={() => setFase("completo")}
          className="w-full rounded-full bg-white py-3 text-sm font-bold text-black"
        >
          Activar mi MindTwin →
        </button>
        <button
          onClick={() => setFase("completo")}
          className="w-full text-center text-xs text-white/40 underline"
        >
          Omitir por ahora
        </button>
      </div>
    );
  }

  if (fase === "gut") {
    const pregunta = PREGUNTAS_BASELINE[gutIdx];
    return (
      <div className="mt-glass space-y-4 p-6">
        <p className="text-xs uppercase tracking-wide text-[#1abc9c]">
          GUT ID · pregunta {gutIdx + 1}/{PREGUNTAS_BASELINE.length}
        </p>
        <p className="text-base">{pregunta.texto}</p>
        {pregunta.tipo === "si_no" ? (
          <div className="flex gap-3">
            <button onClick={() => responderGut(1)} className="rounded-full bg-white/10 px-5 py-2 text-sm hover:bg-white hover:text-black">Sí</button>
            <button onClick={() => responderGut(0)} className="rounded-full bg-white/10 px-5 py-2 text-sm hover:bg-white hover:text-black">No</button>
          </div>
        ) : (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <button key={v} onClick={() => responderGut(v)} className="h-10 w-10 rounded-full bg-white/10 text-sm hover:bg-white hover:text-black">
                {v}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-glass space-y-4 p-6">
      <p className="text-xs uppercase tracking-wide text-[#1abc9c]">
        {ETIQUETAS[sesion]} · ítem {itemIdx + 1}/{items.length}
      </p>
      <div className="flex flex-col items-start">
        <span className="mb-1 text-[10px] font-extrabold text-[#1abc9c]">MindTwin de {ownerName}</span>
        <div className="max-w-[90%] rounded-2xl rounded-bl-sm bg-[#1abc9c]/[0.07] px-4 py-3 text-sm text-white/90">
          {item.texto}
        </div>
      </div>
      <p className="text-xs text-white/40">1 = totalmente en desacuerdo · 5 = totalmente de acuerdo</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((v) => (
          <button key={v} onClick={() => responder(v)} className="h-10 w-10 rounded-full bg-white/10 text-sm hover:bg-white hover:text-black">
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
