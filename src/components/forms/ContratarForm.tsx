"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { contratarOwner, type ActionResult } from "@/lib/actions/onboarding";
import IncomeCalculator from "@/components/landing/IncomeCalculator";

const BORRADOR_KEY = "mindtwin_contratar_borrador";

type Vertical = "speak" | "fit" | "wakeup" | "celeb";

const VERTICALES: { id: Vertical; emoji: string; nombre: string; desc: string }[] = [
  { id: "speak", emoji: "🗣️", nombre: "Lili Speak", desc: "Idiomas conversacionales" },
  { id: "fit", emoji: "💪", nombre: "Lili Fit", desc: "Entrenamiento y nutrición" },
  { id: "wakeup", emoji: "☀️", nombre: "Lili Wake Up", desc: "Motivación y rutinas diarias" },
  { id: "celeb", emoji: "⭐", nombre: "Lili Celeb", desc: "Celebridades y creadores" },
];

type Borrador = {
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  email: string;
  especialidad: string;
  web: string;
  vertical: Vertical;
  nif: string;
  direccionFacturacion: string;
  claveAcceso: string;
};

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

const PASOS = ["Quién eres", "Pago", "Tu MindTwin"] as const;

export default function ContratarForm() {
  const searchParams = useSearchParams();
  const [paso, setPaso] = useState<1 | 2 | 3>(1);

  // Paso 1 — identidad
  const [nombre, setNombre] = useState("");
  const [primerApellido, setPrimerApellido] = useState("");
  const [segundoApellido, setSegundoApellido] = useState("");
  const [email, setEmail] = useState("");
  const [especialidad, setEspecialidad] = useState("");
  const [web, setWeb] = useState("");
  const [vertical, setVertical] = useState<Vertical>("speak");

  const slug = useMemo(() => {
    const base = slugify(`${nombre} ${primerApellido} ${segundoApellido}`);
    return base ? `${base}-${vertical}` : "tu-nombre-apellidos";
  }, [nombre, primerApellido, segundoApellido, vertical]);

  // Paso 2 — facturación / clave de acceso / stripe / envío
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, setPending] = useState(false);
  const [nif, setNif] = useState("");
  const [direccionFacturacion, setDireccionFacturacion] = useState("");
  const [stripeConectado, setStripeConectado] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [conectandoStripe, setConectandoStripe] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [claveAcceso, setClaveAcceso] = useState("");
  const [solicitandoClave, setSolicitandoClave] = useState(false);
  const [claveSolicitada, setClaveSolicitada] = useState<string | null>(null);
  const [claveError, setClaveError] = useState<string | null>(null);

  // Al volver del onboarding alojado de Stripe Connect (redirección completa,
  // se pierde el estado en memoria), restauramos lo que el owner ya había
  // rellenado y marcamos la cuenta conectada como completada.
  useEffect(() => {
    const accountId = searchParams.get("stripe_account");
    const raw = sessionStorage.getItem(BORRADOR_KEY);
    let borrador: Borrador | null = null;
    if (raw) {
      try {
        borrador = JSON.parse(raw);
      } catch {
        // borrador corrupto, se ignora
      }
    }
    if (borrador) {
      setNombre(borrador.nombre);
      setPrimerApellido(borrador.primerApellido);
      setSegundoApellido(borrador.segundoApellido);
      setEmail(borrador.email);
      setEspecialidad(borrador.especialidad);
      setWeb(borrador.web);
      setVertical(borrador.vertical);
      setNif(borrador.nif);
      setDireccionFacturacion(borrador.direccionFacturacion);
      setPaso(2);
    }
    if (accountId && !searchParams.get("refresh")) {
      setStripeAccountId(accountId);
      setStripeConectado(true);
      if (borrador?.claveAcceso) setClaveAcceso(borrador.claveAcceso);
      sessionStorage.removeItem(BORRADOR_KEY);
      window.history.replaceState(null, "", "/profesionales/contratar");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function solicitarClaveAcceso() {
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

  async function pagarLicenciaMensual(ownerId: string, emailOwner?: string) {
    setPagandoLicencia(true);
    setErrorLicencia(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "owner_license", ownerId, email: emailOwner }),
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

  function borradorActual(): Borrador {
    return {
      nombre,
      primerApellido,
      segundoApellido,
      email,
      especialidad,
      web,
      vertical,
      nif,
      direccionFacturacion,
      claveAcceso,
    };
  }

  async function conectarStripe() {
    setConectandoStripe(true);
    setStripeError(null);
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
      sessionStorage.setItem(BORRADOR_KEY, JSON.stringify(borradorActual()));
      window.location.href = data.url;
    } catch {
      setStripeError("Error de red conectando con Stripe.");
    } finally {
      setConectandoStripe(false);
    }
  }

  const verticalActual = VERTICALES.find((v) => v.id === vertical)!;
  const paso1Valido = nombre.trim() && primerApellido.trim() && email.trim() && especialidad.trim();

  async function enviarAlta() {
    setPending(true);
    const fd = new FormData();
    fd.set("nombre", `${nombre} ${primerApellido} ${segundoApellido}`.trim());
    fd.set("email", email);
    fd.set("especialidad", especialidad);
    fd.set("nif", nif);
    fd.set("direccionFacturacion", direccionFacturacion);
    fd.set("stripeConectado", String(stripeConectado));
    fd.set("claveAcceso", claveAcceso);
    fd.set("slug", slug);
    fd.set("vertical", vertical);
    if (stripeAccountId) fd.set("stripeAccountId", stripeAccountId);
    const res = await contratarOwner(fd);
    setResult(res);
    setPending(false);
    if (res.ok) setPaso(3);
  }

  return (
    <div className="mt-8">
      {/* Indicador de pasos — GENERADOR */}
      <div className="mb-10 flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-white/40">
        <span className="text-white/60">Generador</span>
        {PASOS.map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          const done = paso > n;
          const activo = paso === n;
          return (
            <span key={label} className="flex items-center gap-3">
              {i > 0 && <span className="h-px w-6 bg-white/15" />}
              <span
                className={
                  "flex items-center gap-1.5 " +
                  (activo ? "text-[#1abc9c]" : done ? "text-white/70" : "text-white/30")
                }
              >
                <span
                  className={
                    "flex h-4 w-4 items-center justify-center rounded-full text-[9px] " +
                    (done
                      ? "bg-[#1abc9c] text-black"
                      : activo
                        ? "border border-[#1abc9c] text-[#1abc9c]"
                        : "border border-white/20")
                  }
                >
                  {done ? "✓" : n}
                </span>
                {label}
              </span>
            </span>
          );
        })}
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          {paso === 1 && (
            <div className="grid gap-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#1abc9c]">
                {verticalActual.nombre} · Profesional
              </p>
              <h2 className="font-serif text-3xl">
                Cuéntanos
                <br />
                <em className="not-italic text-white/60">quién eres</em>
              </h2>
              <p className="text-sm text-white/50">
                Tu URL se genera automáticamente con tu nombre y apellidos. Sin contraseñas —
                usamos Magic Link.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <label className="text-xs">
                  <span className="block uppercase tracking-wide text-white/50">Nombre</span>
                  <input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#1abc9c]"
                  />
                </label>
                <label className="text-xs">
                  <span className="block uppercase tracking-wide text-white/50">Primer apellido</span>
                  <input
                    value={primerApellido}
                    onChange={(e) => setPrimerApellido(e.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#1abc9c]"
                  />
                </label>
                <label className="text-xs">
                  <span className="block uppercase tracking-wide text-white/50">Segundo apellido</span>
                  <input
                    value={segundoApellido}
                    onChange={(e) => setSegundoApellido(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#1abc9c]"
                  />
                </label>
              </div>

              <div className="rounded-lg border border-[#1abc9c]/25 bg-[#1abc9c]/10 px-3 py-2 text-sm">
                <span className="text-white/50">Tu URL: </span>
                <span className="font-semibold text-[#1abc9c]">{slug}</span>
                <span className="text-white/50">.mylili.org</span>
              </div>

              <label className="text-xs">
                <span className="block uppercase tracking-wide text-white/50">Email profesional</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#1abc9c]"
                />
                <span className="mt-1 block text-white/40">Recibirás un magic link — sin contraseña que recordar.</span>
              </label>

              <label className="text-xs">
                <span className="block uppercase tracking-wide text-white/50">Tu especialidad (en 1-2 frases)</span>
                <textarea
                  value={especialidad}
                  onChange={(e) => setEspecialidad(e.target.value)}
                  required
                  rows={2}
                  placeholder="Cambridge B2/C1, Business English..."
                  className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#1abc9c]"
                />
              </label>

              <label className="text-xs">
                <span className="block uppercase tracking-wide text-white/50">Tu web (opcional)</span>
                <input
                  value={web}
                  onChange={(e) => setWeb(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#1abc9c]"
                />
                <span className="mt-1 block text-white/40">
                  Si tienes web, podrás embeber tu MindTwin o compartir el link directamente.
                </span>
              </label>

              <div>
                <span className="block text-xs uppercase tracking-wide text-white/50">Tu vertical</span>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {VERTICALES.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVertical(v.id)}
                      className={
                        "rounded-xl border p-3 text-left text-sm transition-colors " +
                        (vertical === v.id
                          ? "border-[#1abc9c] bg-[#1abc9c]/10"
                          : "border-white/15 bg-white/5 hover:border-white/30")
                      }
                    >
                      <span className="text-lg">{v.emoji}</span>
                      <p className="mt-1 font-semibold">{v.nombre}</p>
                      <p className="text-xs text-white">{v.desc}</p>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-white/40">
                  Precio único de licencia Mylili: 99&nbsp;€/mes + IVA, igual para cualquier
                  vertical.
                </p>
              </div>

              <p className="text-xs text-white/40">
                🔐 Magic Link. Te enviamos un enlace de acceso al email — sin contraseña, sin
                registro extra. Tu MindTwin se genera automáticamente tras el pago.
              </p>

              <button
                type="button"
                disabled={!paso1Valido}
                onClick={() => setPaso(2)}
                className="mt-2 justify-self-start rounded-full bg-[#1abc9c] px-6 py-3 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-40"
              >
                Continuar al pago →
              </button>
            </div>
          )}

          {paso === 2 && (
            <form
              key={stripeConectado ? "restaurado" : "vacio"}
              ref={formRef}
              className="grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                enviarAlta();
              }}
            >
              <button
                type="button"
                onClick={() => setPaso(1)}
                className="justify-self-start text-xs text-white/50 hover:text-white"
              >
                ← Volver a Quién eres
              </button>
              <h2 className="font-serif text-3xl">Activa tu suscripción</h2>
              <p className="text-sm text-white/50">
                Tu MindTwin se genera automáticamente en cuanto confirmemos el pago.
              </p>

              <div className="mt-2 border-t border-white/10 pt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
                  Datos de facturación
                </p>
              </div>
              <label className="text-sm">
                <span className="block text-white/60">NIF / CIF</span>
                <input
                  value={nif}
                  onChange={(e) => setNif(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white placeholder-white/30 outline-none focus:border-[#1abc9c]"
                />
              </label>
              <label className="text-sm">
                <span className="block text-white/60">Dirección de facturación</span>
                <input
                  value={direccionFacturacion}
                  onChange={(e) => setDireccionFacturacion(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white placeholder-white/30 outline-none focus:border-[#1abc9c]"
                />
              </label>

              <div className="flex items-center justify-between rounded-lg border border-white/15 bg-white/5 p-3">
                <div>
                  <p className="text-sm font-medium">Stripe Connect</p>
                  <p className="text-xs text-white/50">
                    Necesario para facturar tu licencia mensual de 99&nbsp;€ de Mylili y para
                    que recibas los pagos de tu MindTwin.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={conectarStripe}
                  disabled={conectandoStripe || stripeConectado}
                  className={
                    "shrink-0 rounded-full px-4 py-2 text-xs font-bold " +
                    (stripeConectado ? "bg-[#1abc9c] text-black" : "bg-white text-black disabled:opacity-50")
                  }
                >
                  {stripeConectado ? "Conectado ✓" : conectandoStripe ? "Conectando..." : "Conectar Stripe"}
                </button>
              </div>
              <p className="text-xs text-white/50">
                * Stripe descuenta su comisión de procesamiento de cada cobro antes de
                transferirte el resto — la verás detallada en tu panel de Stripe Connect.
              </p>
              {stripeError && <p className="text-xs text-amber-400">{stripeError}</p>}

              <div className="mt-2 border-t border-white/10 pt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
                  Clave de acceso profesional
                </p>
                <p className="mt-1 text-xs text-white/50">
                  Obligatoria (§1.2). Validamos tu credencial y te enviamos una clave de un solo
                  uso. La clave es ilimitada — no caduca.
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
                onClick={solicitarClaveAcceso}
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
                {pending ? "Enviando..." : "Pagar 99€/mes y generar MindTwin →"}
              </button>
              <p className="text-xs text-white/40">Cancela cuando quieras · Sin permanencia</p>

              {result && !result.ok && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                  {result.error}
                </p>
              )}
            </form>
          )}

          {paso === 3 && result?.ok && (
            <div className="grid gap-6">
              <h2 className="font-serif text-3xl">Creando tu MindTwin...</h2>
              <p className="text-sm text-white/50">
                Estamos entrenando tu gemelo cerebral con tu metodología pedagógica real. Te
                avisamos por email en cuanto esté listo — puede tardar unos minutos.
              </p>
              <ul className="grid gap-2 text-sm">
                {[
                  "Perfil recibido",
                  "Pago confirmado",
                  "Entrenando IA",
                  "Calibrando voz y método",
                  "Activando URL",
                  "Email listo",
                ].map((paso_, i) => (
                  <li key={paso_} className="flex items-center gap-2 text-white/70">
                    <span
                      className={
                        "flex h-5 w-5 items-center justify-center rounded-full text-[10px] " +
                        (i < 2 ? "bg-[#1abc9c] text-black" : "border border-white/20 text-white/40")
                      }
                    >
                      {i < 2 ? "✓" : i + 1}
                    </span>
                    {paso_}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-white/40">
                📧 Recibirás un email en {email} con tu URL y acceso completo.
                {result.simulated && " (simulado — Supabase/Resend todavía no están conectados)"}
              </p>

              {!result.simulated && result.ownerId ? (
                <button
                  type="button"
                  onClick={() => pagarLicenciaMensual(result.ownerId!, result.email)}
                  disabled={pagandoLicencia}
                  className="w-full rounded-full bg-[#1abc9c] px-4 py-2.5 text-sm font-bold text-black disabled:opacity-50"
                >
                  {pagandoLicencia ? "Redirigiendo a Stripe..." : "Pagar licencia mensual (Stripe test) →"}
                </button>
              ) : (
                <Link href="/login" className="font-semibold text-[#1abc9c] underline">
                  Ir a login →
                </Link>
              )}
              {errorLicencia && <p className="text-xs text-red-400">{errorLicencia}</p>}

              <div className="mt-2 border-t border-white/10 pt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
                  Tu precio, ahora que ya estás dado de alta
                </p>
                <p className="mt-1 text-xs text-white/50">
                  Por motivos de confidencialidad de tus tarifas, esta calculadora solo se
                  muestra tras el alta.
                </p>
                <IncomeCalculator />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — Tu pedido */}
        <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Tu pedido</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xl">{verticalActual.emoji}</span>
            <div>
              <p className="text-sm font-semibold">{verticalActual.nombre}</p>
              <p className="text-xs text-white/50">{verticalActual.desc} · Suscripción mensual</p>
            </div>
          </div>

          <dl className="mt-4 grid gap-3 text-xs">
            <div>
              <dt className="uppercase tracking-wide text-white/40">Nombre MindTwin</dt>
              <dd className="mt-0.5 text-white/80">
                {[nombre, primerApellido, segundoApellido].filter(Boolean).join(" ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="uppercase tracking-wide text-white/40">Generación</dt>
              <dd className="mt-0.5 text-white/80">Automática en &lt;5 min</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wide text-white/40">Alumnos</dt>
              <dd className="mt-0.5 text-white/80">Packs desde 6€/hora (tú fijas el precio)</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wide text-white/40">Renovación</dt>
              <dd className="mt-0.5 text-white/80">Mensual · Cancela cuando quieras</dd>
            </div>
          </dl>

          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="text-xs uppercase tracking-wide text-white/40">Total hoy</p>
            <p className="font-serif text-3xl text-[#1abc9c]">99€</p>
            <p className="text-xs text-white/40">+ IVA / mes</p>
          </div>

          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="text-xs uppercase tracking-wide text-white/40">Incluye</p>
            <ul className="mt-2 grid gap-1.5 text-xs text-white/60">
              <li>· MindTwin {verticalActual.nombre} activo 24h en tu URL</li>
              <li>· Panel Mis Alumnos dentro de tu MindTwin</li>
              <li>· Traducción simultánea para alumnos</li>
              <li>· Stripe Connect — cobras directamente</li>
              <li>· Embed iframe o link compartible</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
