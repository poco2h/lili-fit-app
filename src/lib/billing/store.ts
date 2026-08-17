import type { Canal } from "./pricing";

export type SessionBilling = {
  id: string;
  followerId: string;
  ownerId: string;
  canal: Canal;
  selectedMin: number;
  actualMin: number | null;
  elapsedSeconds: number;
  unitRate: number;
  finalPriceEur: number | null;
  coveredByWallet: boolean;
  walletSecondsUsed: number;
  walletSecondsRemaining: number;
  status: "pending" | "charged" | "covered_by_wallet" | "refunded" | "failed";
  startedAt: string;
  endedAt: string | null;
};

/**
 * Store en memoria de sesiones de billing activo.
 */
const sesiones = new Map<string, SessionBilling>();

export function crearSesion(s: SessionBilling) {
  sesiones.set(s.id, s);
}

export function obtenerSesion(id: string): SessionBilling | undefined {
  return sesiones.get(id);
}

export function actualizarSesion(id: string, patch: Partial<SessionBilling>) {
  const actual = sesiones.get(id);
  if (!actual) return undefined;
  const actualizada = { ...actual, ...patch };
  sesiones.set(id, actualizada);
  return actualizada;
}

export function listarSesiones(): SessionBilling[] {
  return Array.from(sesiones.values());
}
