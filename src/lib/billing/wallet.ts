import type { Canal } from "./pricing";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { resolveOwnerUuid, resolveFollowerUuid } from "@/lib/demo/identities";

export type MinuteWallet = {
  id: string;
  followerId: string;
  ownerId: string;
  canal: Canal;
  balanceSeconds: number; // Saldo disponible en segundos
  totalPurchasedSeconds: number;
  totalConsumedSeconds: number;
  updatedAt: string;
};

export type WalletTransaction = {
  id: string;
  walletId: string;
  sessionId?: string;
  type: "purchase" | "consumption" | "refund" | "adjustment";
  amountSeconds: number; // Positivo para compras/reembolsos, negativo para consumo
  balanceAfterSeconds: number;
  priceEur?: number;
  description: string;
  createdAt: string;
};

/**
 * Fallback en memoria — solo se usa mientras Supabase no está configurado
 * (getSupabaseAdmin() === null). Con Supabase configurado, todo esto se
 * persiste en `follower_minute_wallets` / `minute_wallet_transactions`
 * (tablas reales, ver supabase/schema.sql) para que el saldo sobreviva a
 * cold starts y redeploys en Vercel — no solo dentro de una sesión de
 * pruebas con el mismo proceso caliente.
 */
type GlobalWithWallets = typeof globalThis & {
  __mindtwin_wallets__?: Map<string, MinuteWallet>;
  __mindtwin_wallet_txs__?: Map<string, WalletTransaction[]>;
};
const g = globalThis as GlobalWithWallets;
if (!g.__mindtwin_wallets__) g.__mindtwin_wallets__ = new Map<string, MinuteWallet>();
if (!g.__mindtwin_wallet_txs__) g.__mindtwin_wallet_txs__ = new Map<string, WalletTransaction[]>();
const memWallets = g.__mindtwin_wallets__;
const memTransactions = g.__mindtwin_wallet_txs__;

function getWalletKey(followerId: string, ownerId: string, canal: Canal): string {
  return `${followerId}::${ownerId}::${canal}`;
}

function memObtenerOCrearWallet(followerId: string, ownerId: string, canal: Canal): MinuteWallet {
  const key = getWalletKey(followerId, ownerId, canal);
  let wallet = memWallets.get(key);
  if (!wallet) {
    wallet = {
      id: crypto.randomUUID(),
      followerId,
      ownerId,
      canal,
      balanceSeconds: 0,
      totalPurchasedSeconds: 0,
      totalConsumedSeconds: 0,
      updatedAt: new Date().toISOString(),
    };
    memWallets.set(key, wallet);
  }
  return wallet;
}

function mapRow(row: {
  id: string;
  follower_id: string;
  owner_id: string;
  canal: Canal;
  balance_seconds: number;
  total_purchased_seconds: number;
  total_consumed_seconds: number;
  updated_at: string;
}): MinuteWallet {
  return {
    id: row.id,
    followerId: row.follower_id,
    ownerId: row.owner_id,
    canal: row.canal,
    balanceSeconds: row.balance_seconds,
    totalPurchasedSeconds: row.total_purchased_seconds,
    totalConsumedSeconds: row.total_consumed_seconds,
    updatedAt: row.updated_at,
  };
}

async function dbObtenerOCrearWallet(followerId: string, ownerId: string, canal: Canal): Promise<MinuteWallet> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return memObtenerOCrearWallet(followerId, ownerId, canal);

  const ownerUuid = await resolveOwnerUuid(ownerId);
  const followerUuid = await resolveFollowerUuid(followerId, ownerUuid!);

  const { data: existing } = await supabase
    .from("follower_minute_wallets")
    .select("*")
    .eq("follower_id", followerUuid)
    .eq("owner_id", ownerUuid)
    .eq("canal", canal)
    .maybeSingle();
  if (existing) return mapRow(existing);

  const { data: created, error } = await supabase
    .from("follower_minute_wallets")
    .insert({ follower_id: followerUuid, owner_id: ownerUuid, canal })
    .select("*")
    .single();
  if (error) throw new Error(`No se pudo crear la bolsa de minutos: ${error.message}`);
  return mapRow(created);
}

export async function obtenerOCrearWallet(
  followerId: string = "demo_follower",
  ownerId: string = "demo_owner",
  canal: Canal
): Promise<MinuteWallet> {
  return dbObtenerOCrearWallet(followerId, ownerId, canal);
}

export async function obtenerBalanceMinutos(
  followerId: string = "demo_follower",
  ownerId: string = "demo_owner",
  canal: Canal
): Promise<{
  balanceSeconds: number;
  balanceMinutesExact: number;
  balanceMinutesDisplay: number;
  hasAvailableMinutes: boolean;
}> {
  const wallet = await obtenerOCrearWallet(followerId, ownerId, canal);
  const balanceSeconds = Math.max(0, wallet.balanceSeconds);
  const balanceMinutesExact = Math.round((balanceSeconds / 60) * 100) / 100;
  const balanceMinutesDisplay = Math.floor(balanceSeconds / 60);

  return {
    balanceSeconds,
    balanceMinutesExact,
    balanceMinutesDisplay,
    hasAvailableMinutes: balanceSeconds > 0,
  };
}

export async function recargarBolsaMinutos(
  followerId: string = "demo_follower",
  ownerId: string = "demo_owner",
  canal: Canal,
  minutos: number,
  precioEur: number,
  descripcion: string = "Compra de paquete de minutos"
): Promise<{ wallet: MinuteWallet; transaction: WalletTransaction }> {
  const addedSeconds = Math.max(0, minutos * 60);
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const wallet = memObtenerOCrearWallet(followerId, ownerId, canal);
    wallet.balanceSeconds += addedSeconds;
    wallet.totalPurchasedSeconds += addedSeconds;
    wallet.updatedAt = new Date().toISOString();

    const tx: WalletTransaction = {
      id: crypto.randomUUID(),
      walletId: wallet.id,
      type: "purchase",
      amountSeconds: addedSeconds,
      balanceAfterSeconds: wallet.balanceSeconds,
      priceEur: precioEur,
      description: `${descripcion} (${minutos} min - ${canal})`,
      createdAt: new Date().toISOString(),
    };
    const currentTxs = memTransactions.get(wallet.id) || [];
    currentTxs.push(tx);
    memTransactions.set(wallet.id, currentTxs);
    return { wallet: { ...wallet }, transaction: tx };
  }

  const wallet = await dbObtenerOCrearWallet(followerId, ownerId, canal);
  const nuevoBalance = wallet.balanceSeconds + addedSeconds;

  const { data: updated, error } = await supabase
    .from("follower_minute_wallets")
    .update({
      balance_seconds: nuevoBalance,
      total_purchased_seconds: wallet.totalPurchasedSeconds + addedSeconds,
      updated_at: new Date().toISOString(),
    })
    .eq("id", wallet.id)
    .select("*")
    .single();
  if (error) throw new Error(`No se pudo recargar la bolsa de minutos: ${error.message}`);

  const { data: txRow, error: txError } = await supabase
    .from("minute_wallet_transactions")
    .insert({
      wallet_id: wallet.id,
      type: "purchase",
      amount_seconds: addedSeconds,
      balance_after_seconds: nuevoBalance,
      price_eur: precioEur,
      description: `${descripcion} (${minutos} min - ${canal})`,
    })
    .select("*")
    .single();
  if (txError) throw new Error(`No se pudo registrar la transacción: ${txError.message}`);

  return {
    wallet: mapRow(updated),
    transaction: {
      id: txRow.id,
      walletId: txRow.wallet_id,
      sessionId: txRow.session_id ?? undefined,
      type: txRow.type,
      amountSeconds: txRow.amount_seconds,
      balanceAfterSeconds: txRow.balance_after_seconds,
      priceEur: txRow.price_eur ?? undefined,
      description: txRow.description,
      createdAt: txRow.created_at,
    },
  };
}

export async function consumirSegundosBolsa(
  followerId: string = "demo_follower",
  ownerId: string = "demo_owner",
  canal: Canal,
  segundosAConsumir: number,
  sessionId?: string
): Promise<{
  wallet: MinuteWallet;
  consumedSeconds: number;
  remainingSeconds: number;
  exhausted: boolean;
}> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const wallet = memObtenerOCrearWallet(followerId, ownerId, canal);
    const secondsToDeduct = Math.min(wallet.balanceSeconds, Math.max(0, segundosAConsumir));
    wallet.balanceSeconds -= secondsToDeduct;
    wallet.totalConsumedSeconds += secondsToDeduct;
    wallet.updatedAt = new Date().toISOString();

    const tx: WalletTransaction = {
      id: crypto.randomUUID(),
      walletId: wallet.id,
      sessionId,
      type: "consumption",
      amountSeconds: -secondsToDeduct,
      balanceAfterSeconds: wallet.balanceSeconds,
      description: `Consumo de sesión (${Math.round(secondsToDeduct / 60)} min)`,
      createdAt: new Date().toISOString(),
    };
    const currentTxs = memTransactions.get(wallet.id) || [];
    currentTxs.push(tx);
    memTransactions.set(wallet.id, currentTxs);

    return {
      wallet: { ...wallet },
      consumedSeconds: secondsToDeduct,
      remainingSeconds: wallet.balanceSeconds,
      exhausted: wallet.balanceSeconds <= 0,
    };
  }

  const wallet = await dbObtenerOCrearWallet(followerId, ownerId, canal);
  const secondsToDeduct = Math.min(wallet.balanceSeconds, Math.max(0, segundosAConsumir));
  const nuevoBalance = wallet.balanceSeconds - secondsToDeduct;

  const { data: updated, error } = await supabase
    .from("follower_minute_wallets")
    .update({
      balance_seconds: nuevoBalance,
      total_consumed_seconds: wallet.totalConsumedSeconds + secondsToDeduct,
      updated_at: new Date().toISOString(),
    })
    .eq("id", wallet.id)
    .select("*")
    .single();
  if (error) throw new Error(`No se pudo descontar de la bolsa de minutos: ${error.message}`);

  const { error: txError } = await supabase.from("minute_wallet_transactions").insert({
    wallet_id: wallet.id,
    session_id: sessionId ?? null,
    type: "consumption",
    amount_seconds: -secondsToDeduct,
    balance_after_seconds: nuevoBalance,
    description: `Consumo de sesión (${Math.round(secondsToDeduct / 60)} min)`,
  });
  if (txError) throw new Error(`No se pudo registrar la transacción: ${txError.message}`);

  return {
    wallet: mapRow(updated),
    consumedSeconds: secondsToDeduct,
    remainingSeconds: nuevoBalance,
    exhausted: nuevoBalance <= 0,
  };
}

export async function obtenerTransaccionesBolsa(walletId: string): Promise<WalletTransaction[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return memTransactions.get(walletId) || [];

  const { data, error } = await supabase
    .from("minute_wallet_transactions")
    .select("*")
    .eq("wallet_id", walletId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`No se pudieron leer las transacciones: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    walletId: row.wallet_id,
    sessionId: row.session_id ?? undefined,
    type: row.type,
    amountSeconds: row.amount_seconds,
    balanceAfterSeconds: row.balance_after_seconds,
    priceEur: row.price_eur ?? undefined,
    description: row.description,
    createdAt: row.created_at,
  }));
}
