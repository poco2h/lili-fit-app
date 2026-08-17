"use client";

import { useMemo, useState } from "react";

const RATES: Record<string, number> = {
  "💬 Texto (desde 2,83 €)": 2.83,
  "🎙️ Voz (desde 6,17 €)": 6.17,
  "🎥 Videoconferencia (desde 13,87 €)": 13.87,
};

export default function IncomeCalculator() {
  const [clientes, setClientes] = useState(50);
  const [sesiones, setSesiones] = useState(4);
  const [canal, setCanal] = useState(Object.keys(RATES)[1]);

  const total = useMemo(
    () => Math.round(clientes * sesiones * RATES[canal]),
    [clientes, sesiones, canal]
  );

  return (
    <div className="mt-10 rounded-2xl border border-black/10 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-black/50">
        Calculadora de ingresos
      </p>
      <div className="mt-4 grid gap-6 md:grid-cols-4 md:items-end">
        <label className="text-sm">
          <span className="block text-black/60">Nº de clientes</span>
          <input
            type="range"
            min={1}
            max={200}
            value={clientes}
            onChange={(e) => setClientes(Number(e.target.value))}
            className="mt-2 w-full"
          />
          <span className="mt-1 block font-semibold">{clientes}</span>
        </label>
        <label className="text-sm">
          <span className="block text-black/60">Sesiones / cliente / mes</span>
          <input
            type="range"
            min={1}
            max={12}
            value={sesiones}
            onChange={(e) => setSesiones(Number(e.target.value))}
            className="mt-2 w-full"
          />
          <span className="mt-1 block font-semibold">{sesiones}</span>
        </label>
        <label className="text-sm">
          <span className="block text-black/60">Canal</span>
          <select
            value={canal}
            onChange={(e) => setCanal(e.target.value)}
            className="mt-2 w-full rounded-lg border border-black/15 px-3 py-2"
          >
            {Object.keys(RATES).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <div className="text-sm">
          <span className="block text-black/60">Ingresos estimados / mes</span>
          <span className="mt-2 block text-2xl font-serif text-[#1abc9c]">{total} €</span>
        </div>
      </div>
      <p className="mt-4 text-xs text-black/50">
        {clientes} clientes × {sesiones} sesiones {canal.split(" (")[0]} × {RATES[canal]} €
      </p>
    </div>
  );
}
