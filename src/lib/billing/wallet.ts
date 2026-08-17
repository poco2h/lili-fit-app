import type { Canal } from "./pricing";

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
 * Almacén en memoria persistente por proceso (y sincronizable con BBDD Supabase).
 */
const wallets = new Map<string, MinuteWallet>();
const transactions = new Map<string, WalletTransaction[]>();

function getWalletKey(followerId: string, ownerId: string, canal: Canal): string {
  return `${followerId}::${ownerId}::${canal}`;
}

export function obtenerOCrearWallet(
  followerId: string = "demo_follower",
  ownerId: string = "demo_owner",
  canal: Canal
): MinuteWallet {
  const key = getWalletKey(followerId, ownerId, canal);
  let wallet = wallets.get(key);
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
    wallets.set(key, wallet);
  }
  return wallet;
}

export function obtenerBalanceMinutos(
  followerId: string = "demo_follower",
  ownerId: string = "demo_owner",
  canal: Canal
): {
  balanceSeconds: number;
  balanceMinutesExact: number;
  balanceMinutesDisplay: number;
  hasAvailableMinutes: boolean;
} {
  const wallet = obtenerOCrearWallet(followerId, ownerId, canal);
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

export function recargarBolsaMinutos(
  followerId: string = "demo_follower",
  ownerId: string = "demo_owner",
  canal: Canal,
  minutos: number,
  precioEur: number,
  descripcion: string = "Compra de paquete de minutos"
): { wallet: MinuteWallet; transaction: WalletTransaction } {
  const wallet = obtenerOCrearWallet(followerId, ownerId, canal);
  const addedSeconds = Math.max(0, minutos * 60);

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

  const currentTxs = transactions.get(wallet.id) || [];
  currentTxs.push(tx);
  transactions.set(wallet.id, currentTxs);

  return { wallet: { ...wallet }, transaction: tx };
}

export function consumirSegundosBolsa(
  followerId: string = "demo_follower",
  ownerId: string = "demo_owner",
  canal: Canal,
  segundosAConsumir: number,
  sessionId?: string
): {
  wallet: MinuteWallet;
  consumedSeconds: number;
  remainingSeconds: number;
  exhausted: boolean;
} {
  const wallet = obtenerOCrearWallet(followerId, ownerId, canal);
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

  const currentTxs = transactions.get(wallet.id) || [];
  currentTxs.push(tx);
  transactions.set(wallet.id, currentTxs);

  return {
    wallet: { ...wallet },
    consumedSeconds: secondsToDeduct,
    remainingSeconds: wallet.balanceSeconds,
    exhausted: wallet.balanceSeconds <= 0,
  };
}

export function obtenerTransaccionesBolsa(walletId: string): WalletTransaction[] {
  return transactions.get(walletId) || [];
}
