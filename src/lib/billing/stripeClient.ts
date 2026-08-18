import Stripe from "stripe";

let cached: Stripe | null = null;

/**
 * Cliente Stripe server-side. Devuelve null si STRIPE_SECRET_KEY no está
 * configurada — igual que getSupabaseAdmin(), las rutas deben degradar con
 * gracia (501 explícito) en vez de reventar.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!cached) cached = new Stripe(key);
  return cached;
}
