"use client";

import { use, useEffect, useState } from "react";
import { Starfield } from "@/components/starfield/Starfield";

type Pack = { id: string; name: string; description: string | null; hours: number; price_cents: number };
type Datos = {
  ownerId: string;
  name: string;
  especialidad: string;
  vertical: string;
  mindscore: number;
  packs: Pack[];
};

const VERTICAL_LABEL: Record<string, string> = {
  fit: "Lili Fit",
  speak: "Lili Speak",
  business: "Lili Business",
  coach: "Lili Coach",
  custom: "Lili Custom",
};

export default function ComprarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [comprando, setComprando] = useState(false);

  useEffect(() => {
    fetch(`/api/profesionales/slug?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else {
          setDatos(d);
          if (d.packs?.length) setSeleccionado(d.packs[Math.min(1, d.packs.length - 1)].id);
        }
      })
      .catch(() => setError("No se pudo cargar este MindTwin."));
  }, [slug]);

  async function comprar() {
    if (!datos || !seleccionado) return;
    setComprando(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "pack_purchase", ownerId: datos.ownerId, packId: seleccionado }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error ?? "No se pudo iniciar el pago.");
    } finally {
      setComprando(false);
    }
  }

  if (error) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-black text-white">
        <Starfield />
        <div className="relative z-10 mx-auto flex min-h-screen max-w-lg items-center justify-center px-6 text-center">
          <p className="text-[#f0c9c9]">{error}</p>
        </div>
      </div>
    );
  }

  if (!datos) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-black text-white">
        <Starfield />
        <div className="relative z-10 mx-auto flex min-h-screen max-w-lg items-center justify-center px-6 text-center text-white/40">
          Cargando…
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <Starfield />
      <div className="relative z-10 mx-auto grid max-w-4xl gap-10 px-6 py-14 md:grid-cols-2">
        <div>
          <span className="rounded-full bg-[#1abc9c]/15 px-3 py-1 text-xs font-semibold text-[#1abc9c]">
            {VERTICAL_LABEL[datos.vertical] ?? datos.vertical}
          </span>
          <h1 className="mt-4 font-serif text-3xl">
            Practica con la IA de {datos.name.split(" ")[0]}, cuando quieras
          </h1>
          <p className="mt-3 text-white/60">
            Accede al MindTwin de {datos.name} — una IA entrenada con su metodología real ({datos.especialidad}).
            Practica a cualquier hora, con el mismo criterio que aplicaría en una sesión real.
          </p>
          <p className="mt-4 text-xs text-white/40">MINDSCORE {datos.mindscore}% · Calibrado con la metodología de {datos.name}</p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-white">Elige tu pack de horas</p>
          {datos.packs.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setSeleccionado(p.id)}
              className={
                "w-full rounded-xl border p-4 text-left transition " +
                (seleccionado === p.id ? "border-[#1abc9c] bg-[#1abc9c]/10" : "border-white/15 bg-white/5 hover:border-white/30")
              }
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white">{p.name}</p>
                {i === 1 && <span className="rounded-full bg-[#1abc9c]/20 px-2 py-0.5 text-[10px] font-bold text-[#1abc9c]">RECOMENDADO</span>}
              </div>
              {p.description && <p className="mt-1 text-xs text-white/50">{p.description}</p>}
              <p className="mt-2 text-lg font-bold text-white">
                {(p.price_cents / 100).toFixed(0)}€{" "}
                <span className="text-xs font-normal text-white/40">
                  · {(p.price_cents / 100 / p.hours).toFixed(2)}€/hora
                </span>
              </p>
            </button>
          ))}
          {datos.packs.length === 0 && <p className="text-sm text-white/40">Este profesional todavía no ha publicado packs.</p>}

          <button
            onClick={comprar}
            disabled={!seleccionado || comprando}
            className="mt-4 w-full rounded-lg bg-[#1abc9c] px-4 py-3 font-semibold text-black disabled:opacity-50"
          >
            {comprando ? "Redirigiendo a pago…" : "Comprar pack seleccionado →"}
          </button>
          <p className="text-center text-xs text-white/40">Pago seguro con Stripe · MindTwin activo al instante</p>
        </div>
      </div>
    </div>
  );
}
