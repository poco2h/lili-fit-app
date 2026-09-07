import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/billing/stripeClient";
import { recargarBolsaMinutos } from "@/lib/billing/wallet";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Canal } from "@/lib/billing/pricing";
import { generarSystemPromptMindTwin } from "@/lib/mindtwin/generatePrompt";
import { resolveFollowerByEmail } from "@/lib/demo/identities";

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
      customer_details?: { email?: string | null } | null;
      customer_email?: string | null;
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
          .update({ stripe_conectado: true })
          .eq("id", metadata.ownerId);

        // MindTwin Generator (verticales speak/business/coach/custom, no Lili
        // Fit): tras confirmar el pago, genera el system prompt y activa el
        // MindTwin (Pantalla 3 "Generando..." hace polling de mindtwin_status).
        const { data: owner } = await supabase
          .from("owners")
          .select("id, name, especialidad, vertical, mindtwin_status")
          .eq("id", metadata.ownerId)
          .maybeSingle();

        if (owner && owner.mindtwin_status === "pending") {
          await supabase.from("owners").update({ mindtwin_status: "generating" }).eq("id", owner.id);

          const generado = await generarSystemPromptMindTwin({
            nombre: owner.name,
            especialidad: owner.especialidad,
            vertical: owner.vertical,
          });

          if ("error" in generado) {
            await supabase
              .from("owners")
              .update({ mindtwin_status: "error", mindtwin_error: generado.error })
              .eq("id", owner.id);
          } else {
            await supabase
              .from("owners")
              .update({
                mindtwin_status: "active",
                system_prompt: generado.systemPrompt,
                mindscore: generado.mindscore,
              })
              .eq("id", owner.id);
          }
        }
      }
    } else if (metadata.kind === "pack_purchase") {
      const supabase = getSupabaseAdmin();
      const email = (session.customer_details?.email ?? session.customer_email ?? "").trim();
      if (supabase && email && metadata.ownerId && metadata.packId) {
        const { data: pack } = await supabase
          .from("packs")
          .select("id, name, hours, price_cents")
          .eq("id", metadata.packId)
          .maybeSingle();

        if (pack) {
          const followerUuid = await resolveFollowerByEmail(email, metadata.ownerId);
          if (followerUuid) {
            const seconds = Math.round(Number(pack.hours) * 3600);
            await recargarBolsaMinutos(
              followerUuid,
              metadata.ownerId,
              "texto",
              seconds / 60,
              pack.price_cents / 100,
              `Pack: ${pack.name}`
            );
            await supabase.from("pack_purchases").insert({
              owner_id: metadata.ownerId,
              follower_id: followerUuid,
              pack_id: pack.id,
              follower_email: email,
              stripe_session_id: (event.data.object as { id?: string }).id ?? null,
              amount_cents: pack.price_cents,
              seconds_granted: seconds,
              status: "completed",
            });
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
