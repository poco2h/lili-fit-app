"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { contratarOwner, type ActionResult } from "@/lib/actions/onboarding";
import IncomeCalculator from "@/components/landing/IncomeCalculator";

const BORRADOR_KEY = "mindtwin_contratar_borrador";

type Borrador = { nombre: string; email: string; especialidad: string; nif: string; direccionFacturacion: string; claveAcceso: string };

export default function ContratarForm() {
  const searchParams = useSearchParams();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, setPending] = useState(false);
  const [stripeConectado, setStripeConectado] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [conectandoStripe, setConectandoStripe] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [claveAcceso, setClaveAcceso] = useState("");
  const [solicitandoClave, setSolicitandoClave] = useState(false);
  const [claveSolicitada, setClaveSolicitada] = useState<string | null>(null);
  const [claveError, setClaveError] = useState<string | null>(null);
  const [borrador, setBorrador] = useState<Borrador | null>(null);

  // Al volver del onboarding alojado de Stripe Connect (redirección completa,
  // se pierde el estado en memoria), restauramos lo que el owner ya había
  // rellenado y marcamos la cuenta conectada como completada.
  useEffect(() => {
    const accountId = searchParams.get("stripe_account");
    const raw = sessionStorage.getItem(BORRADOR_KEY);
    if (raw) {
      try {
        setBorrador(JSON.parse(raw));
      } catch {
        // borrador corrupto, se ignora
      }
    }
    if (accountId && !searchParams.get("refresh")) {
      setStripeAccountId(accountId);
      setStripeConectado(true);
      if (raw) {
        try {
          const b: Borrador = JSON.parse(raw);
          if (b.claveAcceso) setClaveAcceso(b.claveAcceso);
        } catch {
          // ignorado
        }
      }
      sessionStorage.removeItem(BORRADOR_KEY);
      window.history.replaceState(null, "", "/profesionales/contratar");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    const fd = new FormData(formRef.current ?? undefined);
    const borradorActual: Borrador = {
      nombre: String(fd.get("nombre") ?? ""),
      email: String(fd.get("email") ?? ""),
      especialidad: String(fd.get("especialidad") ?? ""),
      nif: String(fd.get("nif") ?? ""),
      direccionFacturacion: String(fd.get("direccionFacturacion") ?? ""),
      claveAcceso,
    };

    try {
      const res = await fetch("/api/billing/stripe-connect/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: stripeAccountId }),
      });
      const data = await res.json();
      if (res.status === 501) {
        setStripeError("Falta configurar STRIPE_SECRET_KEY para este proyecto — de momento no se puede conectar Stripe de verdad.");
        return;
      }
      if (!res.ok || !data.url) {
        setStripeError(data?.error ?? "No se ha podido iniciar Stripe Connect.");
        return;
      }
      sessionStorage.setItem(BORRADOR_KEY, JSON.stringify(borradorActual));
      window.location.href = data.url;
    } catch {
      setStripeError("Error de red conectando con Stripe.");
    } finally {
      setConectandoStripe(false);
    }
  }

  return (
    <form
      key={borrador ? "restaurado" : "vacio"}
      ref={formRef}
      className="mt-8 grid gap-4"
      action={async (formData) => {
        formData.set("stripeConectado", String(stripeConectado));
        formData.set("claveAcceso", claveAcceso);
        if (stripeAccountId) formData.set("stripeAccountId", stripeAccountId);
        setPending(true);
        const res = await contratarOwner(formData);
        setResult(res);
        setPending(false);
      }}
    >
      <label className="text-sm">
        <span className="block text-white/60">Nombre completo</span>
        <input name="nombre" defaultValue={borrador?.nombre} required className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white placeholder-white/30 outline-none focus:border-[#1abc9c]" />
      </label>
      <label className="text-sm">
        <span className="block text-white/60">Email</span>
        <input name="email" type="email" defaultValue={borrador?.email} required className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white placeholder-white/30 outline-none focus:border-[#1abc9c]" />
      </label>
      <label className="text-sm">
        <span className="block text-white/60">Especialidad</span>
        <input name="especialidad" defaultValue={borrador?.especialidad} required placeholder="Nutricionista, entrenador, coach..." className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white placeholder-white/30 outline-none focus:border-[#1abc9c]" />
      </label>
      <div className="mt-2 border-t border-white/10 pt-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
          Precio licencia Mylili: 99&nbsp;€/mes
        </p>
        <p className="mt-1 text-xs text-white/50">
          Precio MindTwin: por motivos de confidencialidad de tus tarifas finales, te
          pasaremos una calculadora de los precios que pueden pagar tus clientes (sin costes
          para ti) una vez dado de alta.
        </p>
      </div>

      <div className="mt-2 border-t border-white/10 pt-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
          Datos de facturación
        </p>
      </div>
      <label className="text-sm">
        <span className="block text-white/60">NIF / CIF</span>
        <input name="nif" defaultValue={borrador?.nif} required className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white placeholder-white/30 outline-none focus:border-[#1abc9c]" />
      </label>
      <label className="text-sm">
        <span className="block text-white/60">Dirección de facturación</span>
        <input name="direccionFacturacion" defaultValue={borrador?.direccionFacturacion} required className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white placeholder-white/30 outline-none focus:border-[#1abc9c]" />
      </label>

      <div className="flex items-center justify-between rounded-lg border border-white/15 bg-white/5 p-3">
        <div>
          <p className="text-sm font-medium">Stripe Connect</p>
          <p className="text-xs text-white/50">
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
            (stripeConectado ? "bg-[#1abc9c] text-black" : "bg-white text-black disabled:opacity-50")
          }
        >
          {stripeConectado ? "Conectado ✓" : conectandoStripe ? "Conectando..." : "Conectar Stripe"}
        </button>
      </div>
      <p className="text-xs text-white/50">
        * Stripe descuenta su comisión de procesamiento de cada cobro antes de transferirte el
        resto — la verás detallada en tu panel de Stripe Connect.
      </p>
      {stripeError && <p className="text-xs text-amber-400">{stripeError}</p>}

      <div className="mt-2 border-t border-white/10 pt-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
          Clave de acceso profesional
        </p>
        <p className="mt-1 text-xs text-white/50">
          Obligatoria (§1.2). Validamos tu credencial y te enviamos una clave de un solo uso.
          La clave es ilimitada — no caduca.
        </p>
      </div>
      <label className="text-sm">
        <span className="block text-white/60">Clave de acceso</span>
        <input
          value={claveAcceso}
          onChange={(e) => setClaveAcceso(e.target.value)}
          required
          placeholder="Pégala aquí tras solicitarla"
          className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white placeholder-white/30 outline-none focus:border-[#1abc9c]"
        />
      </label>
      <button
        type="button"
        onClick={solicitarDesdeFormulario}
        disabled={solicitandoClave}
        className="justify-self-start rounded-full border border-white/15 px-4 py-2 text-xs font-bold disabled:opacity-50"
      >
        {solicitandoClave ? "Solicitando..." : "¿No tienes clave? Solicítala →"}
      </button>
      {claveSolicitada && <p className="text-xs text-[#1abc9c]">{claveSolicitada}</p>}
      {claveError && <p className="text-xs text-red-400">{claveError}</p>}

      <button
        disabled={pending}
        className="mt-2 rounded-full bg-[#1abc9c] px-6 py-3 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Contratar →"}
      </button>

      {result?.ok && (
        <div className="rounded-lg border border-[#1abc9c]/30 bg-[#1abc9c]/10 p-3 text-sm text-white">
          <p>
            ¡Alta recibida! Te llegará un email con tu magic link de acceso.
            {result.simulated && " (simulado — Supabase/Resend todavía no están conectados)"}
          </p>
          {!result.simulated && result.ownerId ? (
            <button
              type="button"
              onClick={() => pagarLicenciaMensual(result.ownerId!, result.email)}
              disabled={pagandoLicencia}
              className="mt-2 w-full rounded-full bg-[#1abc9c] px-4 py-2.5 text-sm font-bold text-black disabled:opacity-50"
            >
              {pagandoLicencia ? "Redirigiendo a Stripe..." : "Pagar licencia mensual (Stripe test) →"}
            </button>
          ) : (
            <Link href="/login" className="mt-1 inline-block font-semibold text-[#1abc9c] underline">
              Ir a login →
            </Link>
          )}
          {errorLicencia && <p className="mt-2 text-xs text-red-400">{errorLicencia}</p>}
        </div>
      )}

      {result?.ok && (
        <div className="mt-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
            Tu precio, ahora que ya estás dado de alta
          </p>
          <p className="mt-1 text-xs text-white/50">
            Por motivos de confidencialidad de tus tarifas, esta calculadora solo se muestra
            tras el alta.
          </p>
          <IncomeCalculator />
        </div>
      )}
      {result && !result.ok && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{result.error}</p>
      )}
    </form>
  );
}
