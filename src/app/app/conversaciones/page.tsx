"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Sesion = {
  id: string;
  canal: "texto" | "voz" | "video_rt";
  actualMin: number | null;
  status: string;
  startedAt: string;
  endedAt: string | null;
};

const CANAL_LABEL: Record<Sesion["canal"], { icon: string; label: string }> = {
  texto: { icon: "💬", label: "Texto" },
  voz: { icon: "🎙️", label: "Voz" },
  video_rt: { icon: "🎬", label: "Vídeo" },
};

function formatoFecha(iso: string) {
  return new Date(iso).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function ConversacionesInner() {
  const searchParams = useSearchParams();
  const ownerId = searchParams.get("ownerId") ?? undefined;
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const qs = ownerId ? `?ownerId=${encodeURIComponent(ownerId)}` : "";
    fetch(`/api/billing/sesiones-follower${qs}`)
      .then((r) => r.json())
      .then((d) => setSesiones(d.sesiones ?? []))
      .finally(() => setCargando(false));
  }, [ownerId]);

  return (
    <div className="mt-app">
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-2 text-xl font-bold">Mis Conversaciones</h1>
        <p className="mb-6 text-sm text-white/50">
          Tu historial de charlas con el MindTwin. Para empezar una nueva, ve a{" "}
          <Link href="/app/conversar?role=follower" className="text-[#1abc9c] underline">
            Mis Canales
          </Link>
          .
        </p>

        {cargando && <p className="text-sm text-white/50">Cargando…</p>}
        {!cargando && sesiones.length === 0 && (
          <p className="mt-glass p-4 text-sm text-white/60">Todavía no tienes conversaciones registradas.</p>
        )}

        <div className="space-y-2">
          {sesiones.map((s) => (
            <div key={s.id} className="mt-glass flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">{CANAL_LABEL[s.canal]?.icon ?? "💬"}</span>
                <div>
                  <p className="text-sm font-semibold">{CANAL_LABEL[s.canal]?.label ?? s.canal}</p>
                  <p className="text-xs text-white/50">{formatoFecha(s.startedAt)}</p>
                </div>
              </div>
              <div className="text-right text-xs text-white/50">
                {s.actualMin != null ? `${s.actualMin.toFixed(1)} min` : "—"}
                <br />
                {s.status === "charged" || s.status === "covered_by_wallet" ? "Completada" : s.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ConversacionesPage() {
  return (
    <Suspense>
      <ConversacionesInner />
    </Suspense>
  );
}
