"use client";

import { useEffect, useState } from "react";
import { useTwin } from "@/lib/session/useTwin";

type Alumno = {
  id: string;
  email: string;
  displayName: string | null;
  pack: string | null;
  balanceSeconds: number;
  estado: "activo" | "bolsa_baja" | "pendiente";
};

type Pack = {
  id: string;
  name: string;
  description: string | null;
  hours: number;
  price_cents: number;
  is_active: boolean;
};

const ESTADO_BADGE: Record<Alumno["estado"], string> = {
  activo: "bg-[#1abc9c]/15 text-[#1abc9c]",
  bolsa_baja: "bg-[#c87e7e]/15 text-[#f0c9c9]",
  pendiente: "bg-white/10 text-white/50",
};

const ESTADO_LABEL: Record<Alumno["estado"], string> = {
  activo: "Activo",
  bolsa_baja: "Bolsa baja",
  pendiente: "Pendiente",
};

function formatBolsa(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0 && m === 0) return "0min";
  return `${h > 0 ? `${h}h ` : ""}${m}min`;
}

export default function MisAlumnos() {
  const { ownerId } = useTwin();
  const [alumnos, setAlumnos] = useState<Alumno[] | null>(null);
  const [metricas, setMetricas] = useState<{ activos: number; bolsaBaja: number; ingresosMesEur: number } | null>(null);
  const [packs, setPacks] = useState<Pack[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);

  const [nuevo, setNuevo] = useState({ name: "", hours: "", priceEur: "", description: "" });
  const [creando, setCreando] = useState(false);
  const [errorPack, setErrorPack] = useState<string | null>(null);

  async function cargar() {
    if (!ownerId) return;
    const [resAlumnos, resPacks, resEstado] = await Promise.all([
      fetch(`/api/profesionales/alumnos-resumen?ownerId=${encodeURIComponent(ownerId)}`).then((r) => r.json()),
      fetch(`/api/profesionales/packs?ownerId=${encodeURIComponent(ownerId)}`).then((r) => r.json()),
      fetch(`/api/profesionales/generador/estado?ownerId=${encodeURIComponent(ownerId)}`).then((r) => r.json()),
    ]);
    if (resAlumnos.error) setError(resAlumnos.error);
    else {
      setAlumnos(resAlumnos.alumnos ?? []);
      setMetricas(resAlumnos.metricas ?? null);
    }
    if (!resPacks.error) setPacks(resPacks.packs ?? []);
    if (!resEstado.error) setSlug(resEstado.slug ?? null);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId]);

  async function crearPack(e: React.FormEvent) {
    e.preventDefault();
    if (!ownerId) return;
    setCreando(true);
    setErrorPack(null);
    try {
      const res = await fetch("/api/profesionales/packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId,
          name: nuevo.name,
          description: nuevo.description || undefined,
          hours: Number(nuevo.hours),
          priceEur: Number(nuevo.priceEur),
        }),
      });
      const data = await res.json();
      if (data.error) {
        setErrorPack(data.error);
        return;
      }
      setNuevo({ name: "", hours: "", priceEur: "", description: "" });
      await cargar();
    } finally {
      setCreando(false);
    }
  }

  if (!ownerId) return <p className="text-sm text-white/40">Inicia sesión como profesional para ver tus alumnos.</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;

  const compartible = slug ? `${typeof window !== "undefined" ? window.location.origin : ""}/mt/${slug}/comprar` : null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="mt-glass p-4">
          <p className="text-sm text-white/60">
            {metricas ? `${metricas.activos} activos · ${metricas.bolsaBaja} bolsa baja · ` : ""}
            Ingresos este mes:{" "}
            <span className="font-semibold text-[#1abc9c]">{metricas ? `€${metricas.ingresosMesEur.toFixed(2)}` : "—"}</span>
          </p>
        </div>

        <div className="mt-glass overflow-x-auto p-4">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/40">
                <th className="py-2 pr-3 font-normal">Alumno</th>
                <th className="px-2 py-2 font-normal">Pack</th>
                <th className="px-2 py-2 font-normal">Bolsa</th>
                <th className="px-2 py-2 font-normal">Estado</th>
              </tr>
            </thead>
            <tbody>
              {(alumnos ?? []).map((a) => (
                <tr key={a.id} className="border-b border-white/5">
                  <td className="py-2.5 pr-3">
                    <p className="font-semibold text-white">{a.displayName ?? a.email}</p>
                    <p className="text-xs text-white/40">{a.email}</p>
                  </td>
                  <td className="px-2 py-2.5 text-white/70">{a.pack ?? "—"}</td>
                  <td className="px-2 py-2.5 text-white/70">{formatBolsa(a.balanceSeconds)}</td>
                  <td className="px-2 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ESTADO_BADGE[a.estado]}`}>
                      {ESTADO_LABEL[a.estado]}
                    </span>
                  </td>
                </tr>
              ))}
              {alumnos && alumnos.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-white/40">
                    Todavía no tienes alumnos — comparte tu link de compra.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {compartible && (
          <div className="mt-glass p-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-white/40">Link compartible</p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={compartible}
                className="flex-1 truncate rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/70"
              />
              <button
                onClick={() => navigator.clipboard.writeText(compartible)}
                className="rounded-lg bg-[#1abc9c]/15 px-3 py-2 text-xs font-semibold text-[#1abc9c] hover:bg-[#1abc9c]/25"
              >
                Copiar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="mt-glass p-4">
          <p className="mb-3 text-sm font-semibold text-white">Mis Packs de Horas</p>
          <div className="space-y-2">
            {(packs ?? []).map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-white">{p.name}</p>
                  <p className="text-xs text-white/40">
                    {p.hours}h · {(p.price_cents / 100).toFixed(2)}€ · {(p.price_cents / 100 / p.hours).toFixed(2)}€/hora
                  </p>
                </div>
                <span className={p.is_active ? "text-xs text-[#1abc9c]" : "text-xs text-white/30"}>
                  {p.is_active ? "Activo" : "Oculto"}
                </span>
              </div>
            ))}
            {packs && packs.length === 0 && <p className="text-sm text-white/40">Todavía no tienes packs — crea el primero abajo.</p>}
          </div>
        </div>

        <form onSubmit={crearPack} className="mt-glass space-y-3 p-4">
          <p className="text-sm font-semibold text-white">+ Nuevo pack</p>
          <input
            required
            placeholder="Nombre (Pack Conversación...)"
            value={nuevo.name}
            onChange={(e) => setNuevo((n) => ({ ...n, name: e.target.value }))}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#1abc9c]"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              type="number"
              min="0.5"
              step="0.5"
              placeholder="Horas"
              value={nuevo.hours}
              onChange={(e) => setNuevo((n) => ({ ...n, hours: e.target.value }))}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#1abc9c]"
            />
            <input
              required
              type="number"
              min="1"
              step="0.01"
              placeholder="Precio €"
              value={nuevo.priceEur}
              onChange={(e) => setNuevo((n) => ({ ...n, priceEur: e.target.value }))}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#1abc9c]"
            />
          </div>
          <input
            placeholder="Descripción (opcional)"
            value={nuevo.description}
            onChange={(e) => setNuevo((n) => ({ ...n, description: e.target.value }))}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#1abc9c]"
          />
          {errorPack && <p className="text-xs text-red-400">{errorPack}</p>}
          <button
            type="submit"
            disabled={creando}
            className="w-full rounded-lg bg-[#1abc9c] px-3 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {creando ? "Creando…" : "Crear pack"}
          </button>
        </form>
      </div>
    </div>
  );
}
