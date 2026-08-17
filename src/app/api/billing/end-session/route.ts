import { NextRequest, NextResponse } from "next/server";
import { calcularPrecioBase } from "@/lib/billing/pricing";
import { actualizarSesion, obtenerSesion } from "@/lib/billing/store";
import { consumirSegundosBolsa, obtenerBalanceMinutos } from "@/lib/billing/wallet";

/**
 * Endpoint end-session:
 * 1. Calcula los minutos REALES exactos consumidos por el timer.
 * 2. Descuenta los segundos consumidos de la Bolsa de Minutos del usuario.
 * 3. Los minutos NO consumidos permanecen en la bolsa para permitir reentradas sin pagar más.
 * 4. Calcula el coste real de la sesión y el ahorro frente a la duración seleccionada.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = String(body?.sessionBillingId ?? "");
    let elapsedSeconds = Number(body?.elapsedSeconds ?? 0);
    const elapsedMin = Number(body?.elapsedMin ?? 0);

    if (elapsedSeconds <= 0 && elapsedMin > 0) {
      elapsedSeconds = Math.round(elapsedMin * 60);
    }

    const sesion = obtenerSesion(id);
    if (!sesion) {
      return NextResponse.json({ error: "session_billing no encontrada" }, { status: 404 });
    }

    // Minutos reales consumidos (con precisión decimal y redondeo a minuto)
    const actualMinDecimal = Math.max(0.1, Math.round((elapsedSeconds / 60) * 10) / 10);
    const actualMinBilling = Math.max(1, Math.ceil(elapsedSeconds / 60));
    const finalPriceEur = calcularPrecioBase(sesion.canal, actualMinBilling);

    // Descontar segundos consumidos de la bolsa
    const walletResult = consumirSegundosBolsa(
      sesion.followerId,
      sesion.ownerId,
      sesion.canal,
      elapsedSeconds,
      id
    );

    const balanceActual = obtenerBalanceMinutos(sesion.followerId, sesion.ownerId, sesion.canal);

    const actualizada = actualizarSesion(id, {
      actualMin: actualMinBilling,
      elapsedSeconds,
      finalPriceEur,
      walletSecondsUsed: walletResult.consumedSeconds,
      walletSecondsRemaining: walletResult.remainingSeconds,
      status: "covered_by_wallet",
      endedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ...actualizada,
      actualMinDecimal,
      walletBalanceSeconds: balanceActual.balanceSeconds,
      walletBalanceMinutesExact: balanceActual.balanceMinutesExact,
      walletBalanceMinutesDisplay: balanceActual.balanceMinutesDisplay,
      canReenterDirectly: balanceActual.hasAvailableMinutes,
      message: balanceActual.hasAvailableMinutes
        ? `Sesión finalizada. Te quedan ${balanceActual.balanceMinutesExact} minutos en tu bolsa para volver a entrar sin pagar.`
        : "Sesión finalizada. Has consumido los minutos de tu bolsa.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error finalizando sesión de billing", details: String(error) },
      { status: 500 }
    );
  }
}
