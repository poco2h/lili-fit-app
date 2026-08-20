"use client";

import { useCallback, useEffect, useState } from "react";
import { leerDemoTwin, guardarDemoTwin, type DemoTwin } from "@/lib/demo/localTwin";
import { useOwnerSession } from "@/lib/session/useOwnerSession";

/**
 * Igual que leerDemoTwin/guardarDemoTwin de src/lib/demo/localTwin.ts, pero
 * por owner real cuando hay sesión (Supabase, vía /api/twin/profile) en vez
 * de localStorage compartido por cualquiera que abra el navegador. Sin
 * sesión, cae en el comportamiento de demo de siempre.
 */
export function useTwin() {
  const { owner, cargando: cargandoOwner } = useOwnerSession();
  const [twin, setTwinState] = useState<DemoTwin | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (cargandoOwner) return;
    if (!owner) {
      setTwinState(leerDemoTwin());
      setCargando(false);
      return;
    }
    let activo = true;
    fetch(`/api/twin/profile?ownerId=${encodeURIComponent(owner.ownerId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (activo) setTwinState(d.twin ?? null);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [owner, cargandoOwner]);

  const guardar = useCallback(
    (nuevo: DemoTwin) => {
      setTwinState(nuevo);
      if (owner) {
        fetch("/api/twin/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ownerId: owner.ownerId, twin: nuevo }),
        });
      } else {
        guardarDemoTwin(nuevo);
      }
    },
    [owner]
  );

  return { twin, guardar, cargando: cargando || cargandoOwner, owner, ownerId: owner?.ownerId };
}
