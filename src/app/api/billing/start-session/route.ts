import { NextRequest, NextResponse } from "next/server";
import { TASA_VARIABLE, PRECIOS_BASE_PAQUETES, type Canal, type PaqueteMinutos } from "@/lib/billing/pricing";
import { crearSesion } from "@/lib/billing/store";
import { obtenerBalanceMinutos, recargarBolsaMinutos } from "@/lib/billing/wallet";

/**
 * Endpoint start-session:
 * 1. Verifica si el usuario ya tiene minutos disponibles en su Bolsa de Minutos.
 * 2. Si tiene saldo (> 0 min), permite entrar DIRECTAMENTE sin comprar más.
 * 3. Si no tiene saldo y contrata un paquete (ej. 40 min), abona los minutos a la bolsa y arranca.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const canal = (body?.canal as Canal) ?? "texto";
    const selectedMin = Number(body?.selectedMin ?? 20);
    const followerId = body?.followerId ?? "demo_follower";
    const ownerId = body?.ownerId ?? "demo_owner";
    const forcePurchase = Boolean(body?.forcePurchase);

    let balance = obtenerBalanceMinutos(followerId, ownerId, canal);
    let coveredByWallet = balance.hasAvailableMinutes && !forcePurchase;

    // Si no tiene minutos en la bolsa o solicita recarga explícita
    if (!coveredByWallet) {
      const validMin = (selectedMin === 40 || selectedMin === 60 ? selectedMin : 20) as PaqueteMinutos;
      const precioPaquete = PRECIOS_BASE_PAQUETES[canal][validMin] ?? 2.83;
      recargarBolsaMinutos(followerId, ownerId, canal, validMin, precioPaquete, `Compra inicial paquete ${validMin}m`);
      balance = obtenerBalanceMinutos(followerId, ownerId, canal);
      coveredByWallet = true;
    }

    const id = crypto.randomUUID();
    crearSesion({
      id,
      followerId,
      ownerId,
      canal,
      selectedMin,
      actualMin: null,
      elapsedSeconds: 0,
      unitRate: TASA_VARIABLE[canal],
      finalPriceEur: null,
      coveredByWallet: true,
      walletSecondsUsed: 0,
      walletSecondsRemaining: balance.balanceSeconds,
      status: "pending",
      startedAt: new Date().toISOString(),
      endedAt: null,
    });

    return NextResponse.json({
      sessionBillingId: id,
      coveredByWallet: true,
      availableSeconds: balance.balanceSeconds,
      availableMinutes: balance.balanceMinutesExact,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error iniciando sesión de billing", details: String(error) },
      { status: 500 }
    );
  }
}
