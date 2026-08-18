import type { Canal } from "./pricing";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { resolveOwnerUuid, resolveFollowerUuid } from "@/lib/demo/identities";

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
 * Fallback en memoria — solo mientras Supabase no está configurado. Con
 * Supabase, se persiste en `session_billing` (ver supabase/schema.sql) para
 * que sobreviva a cold starts/redeploys, igual que lib/billing/wallet.ts.
 */
type GlobalWithSesiones = typeof globalThis & { __mindtwin_billing_sesiones__?: Map<string, SessionBilling> };
const g = globalThis as GlobalWithSesiones;
if (!g.__mindtwin_billing_sesiones__) g.__mindtwin_billing_sesiones__ = new Map<string, SessionBilling>();
const memSesiones = g.__mindtwin_billing_sesiones__;

function mapRow(row: {
  id: string;
  follower_id: string;
  owner_id: string;
  canal: Canal;
  selected_min: number;
  actual_min: number | null;
  seconds_deducted_from_wallet: number;
  unit_rate: number;
  final_price_eur: number | null;
  billing_status: SessionBilling["status"];
  started_at: string;
  ended_at: string | null;
}): SessionBilling {
  return {
    id: row.id,
    // UUID reales de owners/followers — válidos como entrada directa de
    // resolveOwnerUuid/resolveFollowerUuid (ver identities.ts), así que
    // wallet.ts puede seguir operando con ellos sin resolución adicional
    // ni depender de que start-session y end-session compartan proceso.
    followerId: row.follower_id,
    ownerId: row.owner_id,
    canal: row.canal,
    selectedMin: row.selected_min,
    actualMin: row.actual_min,
    elapsedSeconds: row.seconds_deducted_from_wallet,
    unitRate: row.unit_rate,
    finalPriceEur: row.final_price_eur,
    coveredByWallet: row.billing_status === "covered_by_wallet",
    walletSecondsUsed: row.seconds_deducted_from_wallet,
    walletSecondsRemaining: 0,
    status: row.billing_status,
    startedAt: row.started_at,
    endedAt: row.ended_at,
  };
}

export async function crearSesion(s: SessionBilling): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    memSesiones.set(s.id, s);
    return;
  }

  const ownerUuid = await resolveOwnerUuid(s.ownerId);
  const followerUuid = await resolveFollowerUuid(s.followerId, ownerUuid!);

  const { error } = await supabase.from("session_billing").insert({
    id: s.id,
    owner_id: ownerUuid,
    follower_id: followerUuid,
    canal: s.canal,
    selected_min: s.selectedMin,
    actual_min: s.actualMin,
    unit_rate: s.unitRate,
    final_price_eur: s.finalPriceEur,
    billing_status: s.status,
    started_at: s.startedAt,
  });
  if (error) throw new Error(`No se pudo crear la sesión de billing: ${error.message}`);
}

export async function obtenerSesion(id: string): Promise<SessionBilling | undefined> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return memSesiones.get(id);

  const { data, error } = await supabase.from("session_billing").select("*").eq("id", id).maybeSingle();
  if (error || !data) return undefined;
  return mapRow(data);
}

export async function actualizarSesion(
  id: string,
  patch: Partial<SessionBilling>
): Promise<SessionBilling | undefined> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const actual = memSesiones.get(id);
    if (!actual) return undefined;
    const actualizada = { ...actual, ...patch };
    memSesiones.set(id, actualizada);
    return actualizada;
  }

  const dbPatch: Record<string, unknown> = {};
  if (patch.actualMin !== undefined) dbPatch.actual_min = patch.actualMin;
  if (patch.elapsedSeconds !== undefined) dbPatch.seconds_deducted_from_wallet = patch.walletSecondsUsed ?? patch.elapsedSeconds;
  if (patch.finalPriceEur !== undefined) dbPatch.final_price_eur = patch.finalPriceEur;
  if (patch.status !== undefined) dbPatch.billing_status = patch.status;
  if (patch.endedAt !== undefined) dbPatch.ended_at = patch.endedAt;

  const { data, error } = await supabase
    .from("session_billing")
    .update(dbPatch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(`No se pudo actualizar la sesión de billing: ${error.message}`);

  return mapRow(data);
}

export async function listarSesiones(): Promise<SessionBilling[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return Array.from(memSesiones.values());

  const { data, error } = await supabase.from("session_billing").select("*").order("started_at", { ascending: false });
  if (error) throw new Error(`No se pudieron listar las sesiones de billing: ${error.message}`);
  return (data ?? []).map(mapRow);
}
