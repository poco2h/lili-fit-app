"use client";

import { useState } from "react";
import Link from "next/link";
import { contratarOwner, type ActionResult } from "@/lib/actions/onboarding";

export default function ContratarForm() {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, setPending] = useState(false);
  const [stripeConectado, setStripeConectado] = useState(false);
  const [conectandoStripe, setConectandoStripe] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  async function conectarStripe() {
    setConectandoStripe(true);
    setStripeError(null);
    const res = await fetch("/api/billing/checkout", { method: "POST" });
    setConectandoStripe(false);
    if (res.status === 501) {
      setStripeConectado(false);
      setStripeError("Falta configurar STRIPE_SECRET_KEY para este proyecto — de momento no se puede conectar Stripe de verdad.");
      return;
    }
    setStripeConectado(true);
  }

  return (
    <form
      className="mt-8 grid gap-4"
      action={async (formData) => {
        formData.set("stripeConectado", String(stripeConectado));
        setPending(true);
        const res = await contratarOwner(formData);
        setResult(res);
        setPending(false);
      }}
    >
      <label className="text-sm">
        <span className="block text-[rgb(99,99,99)]">Nombre completo</span>
        <input name="nombre" required className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2" />
      </label>
      <label className="text-sm">
        <span className="block text-[rgb(99,99,99)]">Email</span>
        <input name="email" type="email" required className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2" />
      </label>
      <label className="text-sm">
        <span className="block text-[rgb(99,99,99)]">Especialidad</span>
        <input name="especialidad" required placeholder="Nutricionista, entrenador, coach..." className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2" />
      </label>
      <label className="text-sm">
        <span className="block text-[rgb(99,99,99)]">
          Precio que cobrarás a tus clientes por sesión de texto de 20&nbsp;min (€)
        </span>
        <input name="precioFollower" type="number" min={0} step="0.01" required className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2" />
      </label>

      <div className="mt-2 border-t border-black/10 pt-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(99,99,99)]">
          Datos de facturación
        </p>
      </div>
      <label className="text-sm">
        <span className="block text-[rgb(99,99,99)]">NIF / CIF</span>
        <input name="nif" required className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2" />
      </label>
      <label className="text-sm">
        <span className="block text-[rgb(99,99,99)]">Dirección de facturación</span>
        <input name="direccionFacturacion" required className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2" />
      </label>

      <div className="flex items-center justify-between rounded-lg border border-black/10 p-3">
        <div>
          <p className="text-sm font-medium">Stripe Connect</p>
          <p className="text-xs text-[rgb(99,99,99)]">Necesario para facturar tu licencia mensual.</p>
        </div>
        <button
          type="button"
          onClick={conectarStripe}
          disabled={conectandoStripe || stripeConectado}
          className={
            "rounded-full px-4 py-2 text-xs font-bold " +
            (stripeConectado ? "bg-[#1abc9c] text-black" : "bg-black text-white disabled:opacity-50")
          }
        >
          {stripeConectado ? "Conectado ✓" : conectandoStripe ? "Conectando..." : "Conectar Stripe"}
        </button>
      </div>
      {stripeError && <p className="text-xs text-amber-600">{stripeError}</p>}

      <button
        disabled={pending}
        className="mt-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-[#1abc9c] disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Contratar →"}
      </button>

      {result?.ok && (
        <div className="rounded-lg bg-[#1abc9c]/10 p-3 text-sm text-[#0e6b57]">
          <p>
            ¡Alta recibida! Te llegará un email con tu magic link de acceso.
            {result.simulated && " (simulado — Supabase/Resend todavía no están conectados)"}
          </p>
          <Link href="/login" className="mt-1 inline-block font-semibold underline">
            Ir a login →
          </Link>
        </div>
      )}
      {result && !result.ok && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{result.error}</p>
      )}
    </form>
  );
}
