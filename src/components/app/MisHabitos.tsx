"use client";

import { useEffect, useState } from "react";
import { leerDemoTwin, type DemoTwin } from "@/lib/demo/localTwin";
import { RESTAURANTES, generarAgendaFallback, DEPORTES, HABITOS_POR_DEPORTE, HABITOS_MICROBIOMA, type Deporte } from "@/lib/habitos/data";
import { recetasParaBacterias, nombresABacteriaIds } from "@/lib/recetas/rankear";
import { enviarAgendaAlProfesional } from "@/lib/actions/agenda";
import Autoevaluacion from "./Autoevaluacion";

const MODULOS = [
  { key: "microbiota", label: "🦠 Microbiota" },
  { key: "deportes", label: "🏃 Deportes" },
] as const;
type Modulo = (typeof MODULOS)[number]["key"];

const SUB_MICROBIOTA = [
  { key: "autoevaluacion", label: "📝 Autoevaluación" },
  { key: "estadisticas", label: "📊 Estadísticas" },
  { key: "alertas", label: "🔔 Alertas" },
  { key: "recetas", label: "🍽️ Recetas" },
  { key: "restaurantes", label: "🗺️ Restaurantes" },
  { key: "agenda", label: "📅 Agenda" },
] as const;

const SUB_DEPORTES = [
  { key: "autoevaluacion", label: "📝 Autoevaluación" },
  { key: "estadisticas", label: "📊 Estadísticas" },
  { key: "alertas", label: "🔔 Alertas" },
  { key: "planes", label: "💪 Planes" },
  { key: "agenda", label: "📅 Agenda" },
] as const;

function fechaHoy() {
  return new Date().toLocaleDateString("es-ES", { day: "numeric", month: "short" }).toUpperCase();
}

export default function MisHabitos() {
  const [twin, setTwin] = useState<DemoTwin | null>(null);
  const [modulo, setModulo] = useState<Modulo>("microbiota");
  const [sub, setSub] = useState<string>("autoevaluacion");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState<string | null>(null);
  const [deporte, setDeporte] = useState<Deporte>("Boxeo");

  useEffect(() => {
    setTwin(leerDemoTwin());
  }, []);

  const gatillos = twin?.gut.gatillos ?? [];
  const bacteriasDeficientes = twin?.gut.bacterias_deficientes ?? [];
  const agenda = generarAgendaFallback(bacteriasDeficientes, twin?.direcciones?.domicilioPersonal);
  const recetasRecomendadas = recetasParaBacterias(nombresABacteriaIds(bacteriasDeficientes));
  const habitosActivos = modulo === "microbiota" ? HABITOS_MICROBIOMA : HABITOS_POR_DEPORTE[deporte];
  const subTabs = modulo === "microbiota" ? SUB_MICROBIOTA : SUB_DEPORTES;

  async function enviarAgenda() {
    setEnviando(true);
    const res = await enviarAgendaAlProfesional("profesional@example.com", agenda);
    setEnviando(false);
    setEnviado(res.simulado ? "Enviado (simulado — falta RESEND_API_KEY)" : "Agenda enviada a tu profesional ✓");
  }

  function cambiarModulo(m: Modulo) {
    setModulo(m);
    setSub("autoevaluacion");
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {MODULOS.map((m) => (
          <button
            key={m.key}
            onClick={() => cambiarModulo(m.key)}
            className={"rounded-full px-4 py-2 text-sm font-semibold " + (modulo === m.key ? "bg-white text-black" : "bg-white/10 text-white/70")}
          >
            {m.label}
          </button>
        ))}
      </div>

      <p className="text-[10px] uppercase tracking-wide text-white/40">
        Semana del {fechaHoy()} · {modulo === "deportes" && <>{deporte} · </>}Hábitos activos: {habitosActivos.length}
      </p>

      {modulo === "deportes" && (
        <div className="flex flex-wrap gap-2">
          {DEPORTES.map((d) => (
            <button
              key={d}
              onClick={() => setDeporte(d)}
              className={"rounded-full px-3 py-1.5 text-xs font-semibold " + (deporte === d ? "bg-[#1abc9c]/20 text-[#1abc9c]" : "bg-white/5 text-white/50 hover:text-white")}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-3">
        {habitosActivos.map((h) => (
          <div key={h.nombre} className="mt-glass p-4">
            <p className="font-semibold">{h.emoji} {h.nombre}</p>
            <p className="mt-1 text-xs text-white/40">{h.categoria}</p>
            <div className="mt-2 flex gap-1 text-lg text-amber-400">★★★★★</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {subTabs.map((s) => (
          <button
            key={s.key}
            onClick={() => setSub(s.key)}
            className={"rounded-full px-3 py-1.5 text-xs font-semibold " + (sub === s.key ? "bg-[#1abc9c]/20 text-[#1abc9c]" : "text-white/50 hover:text-white")}
          >
            {s.label}
          </button>
        ))}
      </div>

      {sub === "autoevaluacion" && (
        <Autoevaluacion modo={modulo === "microbiota" ? "microbiota" : "deportes"} deporte={modulo === "deportes" ? deporte : undefined} />
      )}

      {sub === "estadisticas" && modulo === "microbiota" && (
        <div className="mt-glass grid grid-cols-3 gap-3 p-5 text-center">
          <div><p className="text-2xl font-bold text-[#1abc9c]">{twin?.gut.gut_baseline_score ?? "—"}</p><p className="text-xs text-white/40">Score GUT ID</p></div>
          <div><p className="text-2xl font-bold text-[#1abc9c]">4</p><p className="text-xs text-white/40">Semanas de racha</p></div>
          <div><p className="text-2xl font-bold text-[#1abc9c]">{gatillos.length}</p><p className="text-xs text-white/40">Gatillos activos</p></div>
        </div>
      )}

      {sub === "estadisticas" && modulo === "deportes" && (
        <div className="mt-glass grid grid-cols-3 gap-3 p-5 text-center">
          <div><p className="text-2xl font-bold text-[#1abc9c]">{habitosActivos.length}</p><p className="text-xs text-white/40">Sesiones/semana</p></div>
          <div><p className="text-2xl font-bold text-[#1abc9c]">72%</p><p className="text-xs text-white/40">Adherencia</p></div>
          <div><p className="text-2xl font-bold text-[#1abc9c]">0</p><p className="text-xs text-white/40">Alertas</p></div>
        </div>
      )}

      {sub === "alertas" && (
        <div className="mt-glass space-y-2 p-5">
          {gatillos.length === 0 ? (
            <p className="text-sm text-white/50">Sin alertas activas.</p>
          ) : (
            gatillos.map((g) => (
              <div key={g} className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-400">⚠ Gatillo activo: {g}</div>
            ))
          )}
        </div>
      )}

      {sub === "recetas" && modulo === "microbiota" && (
        <div className="space-y-3">
          <p className="text-xs text-white/40">
            Recetas ordenadas por cuántos nutrientes cubren para tus bacterias deficientes ({bacteriasDeficientes.join(", ") || "sin datos"}).
          </p>
          <div className="grid gap-3">
            {recetasRecomendadas.map((r) => (
              <div key={r.id} className="mt-glass p-4">
                <p className="font-semibold">{r.nombre}</p>
                <p className="mt-1 text-xs text-white/50">{r.tiempoMin} min · {r.porciones} ración(es)</p>
                <p className="mt-2 text-sm text-white/60">{r.ingredientes.join(", ")}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {sub === "restaurantes" && modulo === "microbiota" && (
        <div className="grid gap-3">
          {RESTAURANTES.map((r) => (
            <div key={r.id} className="mt-glass flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{r.nombre}</p>
                <p className="text-xs text-white/50">{r.ciudad}</p>
              </div>
              <span className="rounded-full bg-[#1abc9c]/10 px-3 py-1 text-xs text-[#1abc9c]">{r.tag}</span>
            </div>
          ))}
        </div>
      )}

      {sub === "planes" && modulo === "deportes" && (
        <div className="space-y-3">
          {habitosActivos.map((h) => (
            <div key={h.nombre} className="mt-glass p-4">
              <p className="font-semibold">{h.emoji} Plan · {h.nombre}</p>
              <p className="mt-1 text-xs text-white/40">{h.categoria}</p>
              <p className="mt-2 text-sm text-white/60">Tu MindTwin ajusta series, cargas y descanso semana a semana según tu autoevaluación.</p>
            </div>
          ))}
        </div>
      )}

      {sub === "agenda" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/40">Ejercicio + receta + restaurante recomendado para cada día.</p>
            <button onClick={enviarAgenda} disabled={enviando} className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black disabled:opacity-50">
              {enviando ? "Enviando..." : "Enviar a mi profesional →"}
            </button>
          </div>
          {enviado && <p className="text-xs text-[#1abc9c]">{enviado}</p>}
          <div className="grid gap-2">
            {agenda.map((item, i) => (
              <div key={i} className="mt-glass p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white/80">{item.dia}</span>
                  <span className="text-[10px] uppercase text-[#1abc9c]">{item.tipo}</span>
                </div>
                <p className="mt-1 text-white/70">🏋️ {item.ejercicio}</p>
                {item.receta && <p className="mt-1 text-white/60">🍽️ {item.receta.nombre}</p>}
                {item.restaurante && (
                  <p className="mt-1 text-white/60">📍 Si sales fuera: {item.restaurante.nombre} ({item.restaurante.ciudad})</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
