"use client";

import { useEffect, useState } from "react";
import { useTwin } from "@/lib/session/useTwin";

type FollowerResumen = {
  id: string;
  label: string;
  createdAt: string;
  sesionActual: string;
  mindscore: number | null;
};

export default function MisFollowers() {
  const { ownerId } = useTwin();
  const [followers, setFollowers] = useState<FollowerResumen[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ownerId) return;
    let activo = true;
    fetch(`/api/followers/listar?ownerId=${encodeURIComponent(ownerId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!activo) return;
        if (d.error) setError(d.error);
        else setFollowers(d.followers ?? []);
      })
      .catch(() => activo && setError("No se pudo cargar tus followers."));
    return () => {
      activo = false;
    };
  }, [ownerId]);

  if (!ownerId) {
    return <p className="text-sm text-white/40">Inicia sesión como profesional para ver tus followers.</p>;
  }
  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }
  if (!followers) {
    return <p className="text-sm text-white/40">Cargando…</p>;
  }
  if (followers.length === 0) {
    return (
      <p className="text-sm text-white/40">
        Todavía no tienes followers. En cuanto alguien empiece a conversar con tu MindTwin, aparecerá aquí.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mt-glass p-4 text-center">
        <p className="text-2xl font-bold text-white">{followers.length}</p>
        <p className="text-[10px] uppercase tracking-wide text-white/40">Followers totales</p>
      </div>

      <div className="mt-glass overflow-x-auto p-4">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-white/40">
              <th className="py-2 pr-3 font-normal">Follower</th>
              <th className="px-2 py-2 font-normal">Alta</th>
              <th className="px-2 py-2 font-normal">Sesión</th>
              <th className="px-2 py-2 text-right font-normal">Mindscore</th>
            </tr>
          </thead>
          <tbody>
            {followers.map((f) => (
              <tr key={f.id} className="border-b border-white/5">
                <td className="py-2.5 pr-3 font-semibold text-white">{f.label}</td>
                <td className="px-2 py-2.5 text-white/60">
                  {new Date(f.createdAt).toLocaleDateString("es-ES")}
                </td>
                <td className="px-2 py-2.5 text-white/80">{f.sesionActual}</td>
                <td className="px-2 py-2.5 text-right font-semibold text-[#1abc9c]">
                  {f.mindscore != null ? `${f.mindscore}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
