"use client";

/**
 * Identidad ligera del Follower, sin login (no existe todavía un sistema de
 * cuentas para Followers): un id aleatorio persistido en localStorage, uno
 * por cada profesional distinto que visite desde este navegador. Se resuelve
 * a un follower real en Supabase vía resolveFollowerUuid (mismo patrón ya
 * usado por la facturación, src/lib/demo/identities.ts) — así su progreso de
 * sesiones sobrevive a recargar la página o volver otro día.
 */
export function obtenerFollowerLocalId(ownerId: string): string {
  if (typeof window === "undefined" || !ownerId) return "";
  const key = `mindtwin_follower_local_id_${ownerId}`;
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(key, id);
  }
  return id;
}
