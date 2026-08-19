import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/billing/stripeClient";

/**
 * Arranca (o retoma) el onboarding real de Stripe Connect para un profesional
 * que todavía no tiene owner_id (está a mitad del formulario de alta, antes
 * de pulsar "Contratar"). Crea una cuenta Express y devuelve la URL alojada
 * de Stripe a la que redirigir — al volver, /profesionales/contratar recibe
 * ?stripe_account=acct_... en la query.
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "STRIPE_SECRET_KEY no configurada para este proyecto todavía." }, { status: 501 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? req.nextUrl.origin;

  try {
    const body = await req.json().catch(() => ({}));
    let accountId = typeof body?.accountId === "string" ? body.accountId : null;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "ES",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;
    }

    const returnUrl = `${siteUrl}/profesionales/contratar?stripe_account=${accountId}`;
    const refreshUrl = `${siteUrl}/profesionales/contratar?stripe_account=${accountId}&refresh=1`;

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      return_url: returnUrl,
      refresh_url: refreshUrl,
    });

    return NextResponse.json({ url: accountLink.url, accountId });
  } catch (e) {
    return NextResponse.json(
      { error: "No se ha podido iniciar Stripe Connect.", details: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
