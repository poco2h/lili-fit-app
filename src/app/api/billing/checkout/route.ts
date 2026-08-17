import { NextRequest, NextResponse } from "next/server";

/**
 * Stripe Checkout — pago de sesión (Lili Fit) o suscripción fan (Lili
 * Celebs, vía Stripe Connect con el split de src/lib/billing/stripeConnect.ts).
 * No se usa ninguna clave real aquí: STRIPE_SECRET_KEY se lee solo del
 * entorno de despliegue, nunca hardcodeada — deliberadamente sin
 * implementar la llamada real hasta que el proyecto tenga sus propias
 * claves de Stripe (no las de Lili Fit).
 */
export async function POST(_req: NextRequest) {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY no configurada para este proyecto todavía." },
      { status: 501 }
    );
  }
  return NextResponse.json({ error: "Integración Stripe pendiente de implementar." }, { status: 501 });
}
