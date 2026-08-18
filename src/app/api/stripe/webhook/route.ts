import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/billing/stripeClient";
import { recargarBolsaMinutos } from "@/lib/billing/wallet";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Canal } from "@/lib/billing/pricing";

/**
 * Webhook de Stripe — fuente de verdad para confirmar pagos reales, nunca el
 * cliente. Verifica la firma con STRIPE_WEBHOOK_SECRET antes de procesar
 * nada. checkout.session.completed:
 * - kind "minutes" -> abona la Bolsa de Minutos del follower.
 * - kind "owner_license" -> marca owners.stripe_conectado = true.
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe/webhook no configurado." }, { status: 501 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Falta firma de Stripe." }, { status: 400 });
  }

  const rawBody = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json({ error: `Firma inválida: ${String(error)}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      metadata?: Record<string, string>;
      subscription?: string | null;
      customer?: string | null;
    };
    const metadata = session.metadata ?? {};

    if (metadata.kind === "minutes") {
      await recargarBolsaMinutos(
        metadata.followerId,
        metadata.ownerId,
        metadata.canal as Canal,
        Number(metadata.minutos),
        Number(metadata.precioEur),
        "Pago Stripe Checkout"
      );
    } else if (metadata.kind === "owner_license") {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        await supabase
          .from("owners")
          .update({
            stripe_conectado: true,
            stripe_account_id: session.subscription ?? session.customer ?? null,
          })
          .eq("id", metadata.ownerId);
      }
    }
  }

  return NextResponse.json({ received: true });
}
