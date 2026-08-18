import { NextRequest, NextResponse } from "next/server";
import { type Canal } from "@/lib/billing/pricing";
import {
  obtenerBalanceMinutos,
  recargarBolsaMinutos,
  obtenerOCrearWallet,
  obtenerTransaccionesBolsa,
} from "@/lib/billing/wallet";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const followerId = searchParams.get("followerId") ?? "demo_follower";
  const ownerId = searchParams.get("ownerId") ?? "demo_owner";
  const canal = (searchParams.get("canal") as Canal) ?? "texto";

  const balance = await obtenerBalanceMinutos(followerId, ownerId, canal);
  const wallet = await obtenerOCrearWallet(followerId, ownerId, canal);
  const transacciones = await obtenerTransaccionesBolsa(wallet.id);

  return NextResponse.json({
    ...balance,
    wallet,
    transacciones: transacciones.slice(-10).reverse(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const followerId = body?.followerId ?? "demo_follower";
    const ownerId = body?.ownerId ?? "demo_owner";
    const canal = (body?.canal as Canal) ?? "texto";
    const minutos = Number(body?.minutos ?? 20);
    const precioEur = Number(body?.precioEur ?? 0);
    const descripcion = body?.descripcion ?? "Recarga de bolsa de minutos";

    const resultado = await recargarBolsaMinutos(
      followerId,
      ownerId,
      canal,
      minutos,
      precioEur,
      descripcion
    );

    const balance = await obtenerBalanceMinutos(followerId, ownerId, canal);

    return NextResponse.json({
      success: true,
      ...balance,
      transaction: resultado.transaction,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error procesando recarga", details: String(error) },
      { status: 500 }
    );
  }
}
