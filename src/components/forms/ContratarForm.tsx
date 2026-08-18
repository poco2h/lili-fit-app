"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { contratarOwner, type ActionResult } from "@/lib/actions/onboarding";
import IncomeCalculator from "@/components/landing/IncomeCalculator";

export default function ContratarForm() {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, setPending] = useState(false);
  const [stripeConectado, setStripeConectado] = useState(false);
  const [conectandoStripe, setConectandoStripe] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [claveAcceso, setClaveAcceso] = useState("");
  const [solicitandoClave, setSolicitandoClave] = useState(false);
  const [claveSolicitada, setClaveSolicitada] = useState<string | null>(null);
  const [claveError, setClaveError] = useState<string | null>(null);

  async function solicitarClaveAcceso(nombre: string, email: string, especialidad: string) {
    if (!nombre || !email || !especialidad) {
      setClaveError("Rellena nombre, email y especialidad antes de solicitar la clave.");
      return;
    }
    setSolicitandoClave(true);
    setClaveError(null);
    try {
      const res = await fetch("/api/access-keys/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, especialidad }),
      });
      const data = await res.json();
      if (!res.ok) {
        setClaveError(data?.error ?? "No se ha podido generar la clave de acceso.");
        return;
      }
      setClaveSolicitada(
        data.accessKey
          ? `Clave (modo simulado, sin email real configurado): ${data.accessKey}`
          : "Te hemos enviado la clave por email — revisa tu bandeja."
      );
      if (data.accessKey) setClaveAcceso(data.accessKey);
    } catch {
      setClaveError("Error de red solicitando la clave de acceso.");
    } finally {
      setSolicitandoClave(false);
    }
  }

  const [pagandoLicencia, setPagandoLicencia] = useState(false);
  const [errorLicencia, setErrorLicencia] = useState<string | null>(null);

  async function pagarLicenciaMensual(ownerId: string, email?: string) {
    setPagandoLicencia(true);
    setErrorLicencia(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "owner_license", ownerId, email }),
      });
      const data = await res.json();
      if (res.status === 501) {
        setErrorLicencia("Falta configurar Stripe (STRIPE_SECRET_KEY) para pagos reales todavía.");
        return;
      }
      if (!res.ok || !data.url) {
        setErrorLicencia(data?.error ?? "No se ha podido iniciar el pago de la licencia.");
        return;
      }
      window.location.href = data.url;
    } finally {
      setPagandoLicencia(false);
    }
  }

  const formRef = useRef<HTMLFormElement>(null);

  function solicitarDesdeFormulario() {
    const fd = new FormData(formRef.current ?? undefined);
    solicitarClaveAcceso(
      String(fd.get("nombre") ?? ""),
      String(fd.get("email") ?? ""),
      String(fd.get("especialidad") ?? "")
    );
  }

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
      ref={formRef}
      className="mt-8 grid gap-4"
      action={async (formData) => {
        formData.set("stripeConectado", String(stripeConectado));
        formData.set("claveAcceso", claveAcceso);
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
      <div className="mt-2 border-t border-black/10 pt-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(99,99,99)]">
          Precio licencia Mylili: 99&nbsp;€/mes
        </p>
        <p className="mt-1 text-xs text-[rgb(99,99,99)]">
          Precio MindTwin: por motivos de confidencialidad de tus tarifas finales, te
          pasaremos una calculadora de los precios que pueden pagar tus clientes (sin costes
          para ti) una vez dado de alta.
        </p>
      </div>

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
          <p className="text-xs text-[rgb(99,99,99)]">
            Necesario para facturar tu licencia mensual de 99&nbsp;€ de Mylili y para que
            recibas los pagos de tu MindTwin.
          </p>
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
      <p className="text-xs text-[rgb(99,99,99)]">
        * Stripe descuenta su comisión de procesamiento de cada cobro antes de transferirte el
        resto — la verás detallada en tu panel de Stripe Connect.
      </p>
      {stripeError && <p className="text-xs text-amber-600">{stripeError}</p>}

      <div className="mt-2 border-t border-black/10 pt-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(99,99,99)]">
          Clave de acceso profesional
        </p>
        <p className="mt-1 text-xs text-[rgb(99,99,99)]">
          Obligatoria (§1.2). Validamos tu credencial y te enviamos una clave de un solo uso.
          La clave es ilimitada — no caduca.
        </p>
      </div>
      <label className="text-sm">
        <span className="block text-[rgb(99,99,99)]">Clave de acceso</span>
        <input
          value={claveAcceso}
          onChange={(e) => setClaveAcceso(e.target.value)}
          required
          placeholder="Pégala aquí tras solicitarla"
          className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2"
        />
      </label>
      <button
        type="button"
        onClick={solicitarDesdeFormulario}
        disabled={solicitandoClave}
        className="justify-self-start rounded-full border border-black/15 px-4 py-2 text-xs font-bold disabled:opacity-50"
      >
        {solicitandoClave ? "Solicitando..." : "¿No tienes clave? Solicítala →"}
      </button>
      {claveSolicitada && <p className="text-xs text-[#0e6b57]">{claveSolicitada}</p>}
      {claveError && <p className="text-xs text-red-600">{claveError}</p>}

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
          {!result.simulated && result.ownerId ? (
            <button
              type="button"
              onClick={() => pagarLicenciaMensual(result.ownerId!, result.email)}
              disabled={pagandoLicencia}
              className="mt-2 w-full rounded-full bg-black px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {pagandoLicencia ? "Redirigiendo a Stripe..." : "Pagar licencia mensual (Stripe test) →"}
            </button>
          ) : (
            <Link href="/login" className="mt-1 inline-block font-semibold underline">
              Ir a login →
            </Link>
          )}
          {errorLicencia && <p className="mt-2 text-xs text-red-600">{errorLicencia}</p>}
        </div>
      )}

      {result?.ok && (
        <div className="mt-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(99,99,99)]">
            Tu precio, ahora que ya estás dado de alta
          </p>
          <p className="mt-1 text-xs text-[rgb(99,99,99)]">
            Por motivos de confidencialidad de tus tarifas, esta calculadora solo se muestra
            tras el alta.
          </p>
          <IncomeCalculator />
        </div>
      )}
      {result && !result.ok && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{result.error}</p>
      )}
    </form>
  );
}
