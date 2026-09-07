import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/billing/stripeClient";
import type { Canal } from "@/lib/billing/pricing";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Stripe Checkout — dos flujos:
 * 1. kind "minutes": el Follower paga un paquete de minutos (one-off). Al
 *    completarse (checkout.session.completed en el webhook), se abona a la
 *    Bolsa de Minutos — ver api/stripe/webhook/route.ts.
 * 2. kind "owner_license": el Owner paga su licencia mensual (suscripción)
 *    tras haberse dado de alta (necesita un ownerId real ya creado).
 * Sin STRIPE_SECRET_KEY configurada, devuelve 501 explícito — nunca finge
 * un pago.
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY no configurada para este proyecto todavía." },
      { status: 501 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;

  try {
    const body = await req.json();
    const kind =
      body?.kind === "owner_license" ? "owner_license" : body?.kind === "pack_purchase" ? "pack_purchase" : "minutes";

    if (kind === "pack_purchase") {
      const packId = String(body?.packId ?? "");
      const ownerId = String(body?.ownerId ?? "");
      if (!packId || !ownerId) {
        return NextResponse.json({ error: "Falta packId u ownerId." }, { status: 400 });
      }

      const supabase = getSupabaseAdmin();
      if (!supabase) return NextResponse.json({ error: "Supabase no configurado." }, { status: 501 });

      // El precio SIEMPRE se lee del servidor, nunca del cliente — evita que
      // alguien manipule el body y pague menos de lo que cuesta el pack.
      const { data: pack } = await supabase
        .from("packs")
        .select("id, name, hours, price_cents, is_active, owner_id")
        .eq("id", packId)
        .eq("owner_id", ownerId)
        .maybeSingle();

      if (!pack || !pack.is_active) {
        return NextResponse.json({ error: "Pack no disponible." }, { status: 404 });
      }

      const { data: owner } = await supabase.from("owners").select("slug, stripe_account_id").eq("id", ownerId).maybeSingle();
      const slugUrl = owner?.slug ? `/mt/${owner.slug}` : "/app/conversar";

      // Stripe Connect (doc MindTwin Generator §"Flujo de pagos"): el cobro va
      // DIRECTO a la cuenta Connect del profesional, Poco2h se queda solo la
      // comisión de plataforma — nunca se cobra íntegro a la plataforma.
      if (!owner?.stripe_account_id) {
        return NextResponse.json(
          { error: "Este profesional todavía no ha conectado Stripe Connect — no puede vender packs todavía." },
          { status: 400 }
        );
      }
      const feePct = Number(process.env.STRIPE_PLATFORM_FEE_PERCENT ?? 15);

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: { name: `MindTwin · ${pack.name}` },
              unit_amount: pack.price_cents,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          application_fee_amount: Math.round((pack.price_cents * feePct) / 100),
          transfer_data: { destination: owner.stripe_account_id },
        },
        metadata: { kind: "pack_purchase", ownerId, packId: pack.id },
        success_url: `${siteUrl}/login?redirect=${encodeURIComponent(`/app/conversar?ownerId=${ownerId}&role=follower`)}&stripe=success`,
        cancel_url: `${siteUrl}${slugUrl}/comprar?stripe=cancel`,
      });

      return NextResponse.json({ url: session.url });
    }

    if (kind === "minutes") {
      const canal = String(body?.canal ?? "texto") as Canal;
      const minutos = Number(body?.minutos ?? 20);
      const precioEur = Number(body?.precioEur ?? 0);
      const followerId = String(body?.followerId ?? "demo_follower");
      const ownerId = String(body?.ownerId ?? "demo_owner");

      if (precioEur <= 0) {
        return NextResponse.json({ error: "Precio inválido." }, { status: 400 });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: { name: `Mindtwin · ${minutos} min de ${canal}` },
              unit_amount: Math.round(precioEur * 100),
            },
            quantity: 1,
          },
        ],
        metadata: { kind: "minutes", canal, minutos: String(minutos), precioEur: String(precioEur), followerId, ownerId },
        success_url: `${siteUrl}/app/conversar?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/app/conversar?stripe=cancel`,
      });

      return NextResponse.json({ url: session.url });
    }

    // owner_license
    const ownerId = String(body?.ownerId ?? "");
    const email = String(body?.email ?? "");
    const precioMensualEur = Number(process.env.STRIPE_LICENCIA_MENSUAL_EUR ?? 49);

    if (!ownerId) {
      return NextResponse.json({ error: "Falta ownerId — completa el alta antes de pagar la licencia." }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      payment_method_collection: "if_required",
      customer_email: email || undefined,
      allow_promotion_codes: true,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: "Mindtwin · Licencia mensual profesional" },
            unit_amount: Math.round(precioMensualEur * 100),
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      metadata: { kind: "owner_license", ownerId },
      success_url: `${siteUrl}/profesionales/generando?ownerId=${ownerId}`,
      cancel_url: `${siteUrl}/profesionales/contratar?stripe=cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json({ error: "Error creando la sesión de Stripe Checkout", details: String(error) }, { status: 500 });
  }
}
