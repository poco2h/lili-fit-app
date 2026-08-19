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

      {sub === "estadisticas" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="mt-glass p-4">
              <p className="text-2xl font-bold text-[#1abc9c]">{modulo === "microbiota" ? (twin?.gut.gut_baseline_score ? Math.round(twin.gut.gut_baseline_score / 10) : 78) : 78}%</p>
              <p className="text-xs text-white/40">Adherencia general</p>
              <p className="mt-1 text-[10px] text-[#1abc9c]">↑ +6% vs sem ant.</p>
            </div>
            <div className="mt-glass p-4">
              <p className="text-2xl font-bold text-[#1abc9c]">4</p>
              <p className="text-xs text-white/40">Racha semanas</p>
              <p className="mt-1 text-[10px] text-[#1abc9c]">↑ récord personal</p>
            </div>
            <div className="mt-glass p-4">
              <p className="text-2xl font-bold text-[#1abc9c]">{habitosActivos.length}/{habitosActivos.length}</p>
              <p className="text-xs text-white/40">Hábitos activos</p>
              <p className="mt-1 text-[10px] text-white/40">sin cambio</p>
            </div>
          </div>

          <div className="mt-glass p-5">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-white/40">Adherencia por hábito · últimas 4 semanas</p>
            <div className="space-y-3">
              {habitosActivos.map((h, i) => {
                const pct = 60 + ((i * 13) % 35);
                return (
                  <div key={h.nombre}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-white/70">{h.emoji} {h.nombre}</span>
                      <span className="font-bold text-[#1abc9c]">{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded bg-white/[0.06]">
                      <div className="h-full rounded bg-gradient-to-r from-[#1abc9c] to-[#0ed4b5]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-glass p-5">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[#1abc9c]">🤖 MindTwin · Análisis semanal</p>
            <p className="text-sm text-white/70">
              {twin ? "Tu" : "Cuando completes tu EGO ID y GUT ID, tu"} adherencia a {habitosActivos[0]?.nombre.toLowerCase()} va bien encaminada
              esta semana. {habitosActivos[1]?.nombre} sigue siendo tu punto débil — intenta priorizarlo los próximos días.
              {gatillos.length > 0 && ` Tus gatillos activos (${gatillos.join(", ")}) están condicionando el resto de la semana.`}
            </p>
          </div>
        </div>
      )}

      {sub === "alertas" && (
        <div className="space-y-3">
          {gatillos.length === 0 ? (
            <div className="mt-glass p-4 text-sm">
              <span className="mr-2">✅</span>
              <span className="font-semibold">Sin gatillos activos esta semana</span>
              <p className="mt-1 text-xs text-white/50">Tu MindTwin avisará aquí en cuanto detecte un patrón (síntomas, falta de adherencia...).</p>
            </div>
          ) : (
            gatillos.map((g) => (
              <div key={g} className="mt-glass p-4 text-sm">
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  <span className="font-semibold">Gatillo activo: {g}</span>
                </div>
                <p className="mt-1 text-xs text-white/50">
                  Tu MindTwin ha detectado este patrón en tus últimas autoevaluaciones — revísalo con tu profesional si persiste.
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-wide text-white/30">Detectado esta semana</p>
              </div>
            ))
          )}
          <div className="mt-glass p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-white/40">Definir hábitos activos (máx. 4)</p>
            <div className="flex flex-wrap gap-2">
              {habitosActivos.map((h) => (
                <span key={h.nombre} className="rounded-full bg-white/10 px-3 py-1.5 text-xs">
                  {h.emoji} {h.nombre} <span className="ml-1 text-white/40">×</span>
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <button className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/60">✏️ Texto</button>
              <button className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/60">🎙️ Voz</button>
            </div>
          </div>
        </div>
      )}

      {sub === "recetas" && modulo === "microbiota" && (
        <div className="space-y-3">
          <p className="text-xs text-white/40">
            Recetas ordenadas por cuántos nutrientes cubren para tus bacterias deficientes ({bacteriasDeficientes.join(", ") || "sin datos"}).
          </p>
          <div className="grid gap-3">
            {recetasRecomendadas.map((r, i) => (
              <div key={r.id} className="mt-glass p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{r.nombre}</p>
                  <span className="rounded-full bg-[#1abc9c]/10 px-2 py-0.5 text-[10px] font-bold text-[#1abc9c]">
                    {Math.max(70, 98 - i * 6)}% match
                  </span>
                </div>
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
            <div key={r.id} className="mt-glass p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{r.nombre}</p>
                <span className="rounded-full bg-[#1abc9c]/10 px-3 py-1 text-xs text-[#1abc9c]">{r.tag}</span>
              </div>
              <p className="text-xs text-white/50">{r.ciudad}</p>
              <p className="mt-2 text-xs text-white/40">🤖 MindTwin recomendado · Google Places</p>
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
            <p className="text-xs text-white/40">Ejercicio + receta + restaurante recomendado para cada día, por franja horaria.</p>
            <button onClick={enviarAgenda} disabled={enviando} className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black disabled:opacity-50">
              {enviando ? "Enviando..." : "Enviar a mi profesional →"}
            </button>
          </div>
          {enviado && <p className="text-xs text-[#1abc9c]">{enviado}</p>}
          <div className="grid gap-3">
            {agenda.map((item, i) => {
              const horaMomento = { mañana: "08:00", tarde: "17:00", noche: "21:00" }[item.momento];
              return (
                <div key={i} className="mt-glass p-4 text-sm">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-bold text-white/80">{item.dia.toUpperCase()}</span>
                    <span className="text-[10px] uppercase text-[#1abc9c]">{item.tipo}</span>
                  </div>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-start gap-2">
                      <span>🏋️</span>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-white/40">{horaMomento} · {item.momento}</p>
                        <p className="text-white/70">{item.ejercicio}</p>
                      </div>
                    </div>
                    {item.receta && (
                      <div className="flex items-start gap-2">
                        <span>🍽️</span>
                        <p className="text-white/60">{item.receta.nombre}</p>
                      </div>
                    )}
                    {item.restaurante && (
                      <div className="flex items-start gap-2">
                        <span>📍</span>
                        <p className="text-white/60">Si sales fuera: {item.restaurante.nombre} ({item.restaurante.ciudad})</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
