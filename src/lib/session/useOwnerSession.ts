"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browserClient";

export type OwnerSession = {
  ownerId: string;
  ownerName: string;
  voiceId: string | null;
  avatarUrl: string | null;
};

/**
 * Resuelve el owner real a partir de la sesión de Supabase Auth (el gate de
 * /profesionales/acceso) — mismo mecanismo que /profesionales/voz y
 * /profesionales/avatar. Devuelve null mientras no haya sesión o el email
 * no tenga owner asociado, para que las pantallas de /app/* puedan seguir
 * cayendo en su demo local sin romperse.
 */
export function useOwnerSession() {
  const [owner, setOwner] = useState<OwnerSession | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setCargando(false);
      return;
    }
    let activo = true;
    supabase.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token;
      if (!token) {
        if (activo) setCargando(false);
        return;
      }
      try {
        const res = await fetch("/api/profesionales/voz/resolver-owner", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        if (activo) setOwner(json);
      } finally {
        if (activo) setCargando(false);
      }
    });
    return () => {
      activo = false;
    };
  }, []);

  return { owner, cargando };
}
