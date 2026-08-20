"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { getSupabaseBrowser } from "@/lib/supabase/browserClient";

function AccesoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/profesionales";
  const supabase = getSupabaseBrowser();

  const [modo, setModo] = useState<"login" | "alta" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avisoAlta, setAvisoAlta] = useState<string | null>(null);
  const [avisoReset, setAvisoReset] = useState<string | null>(null);

  async function entrar() {
    if (!supabase) return;
    setCargando(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setCargando(false);
    if (error) {
      setError("Email o contraseña incorrectos.");
      return;
    }
    router.push(redirect);
    router.refresh();
  }

  async function solicitarReset() {
    if (!supabase) return;
    setCargando(true);
    setError(null);
    setAvisoReset(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?redirect=/profesionales/cuenta`,
    });
    setCargando(false);
    if (error) {
      setError(error.message);
      return;
    }
    setAvisoReset("Si ese email tiene una cuenta, te hemos enviado un enlace para restablecer la contraseña.");
  }

  async function solicitarAlta() {
    setCargando(true);
    setError(null);
    setAvisoAlta(null);
    try {
      const res = await fetch("/api/profesionales/alta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error ?? "No se ha podido crear el acceso.");
        return;
      }
      setAvisoAlta(
        data.passwordSimulada
          ? `Cuenta creada (modo simulado, sin email real configurado). Tu contraseña temporal: ${data.passwordSimulada}`
          : "Te hemos enviado un email con tu contraseña temporal — revisa tu bandeja y entra desde aquí."
      );
      setModo("login");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="mt-landing flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <Link href="/profesionales" className="inline-block">
          <Logo size={40} />
        </Link>
        <h1 className="mt-4 font-serif text-2xl">Acceso para profesionales</h1>
        <p className="mt-2 text-sm text-[rgb(99,99,99)]">
          {modo === "login" && "Entra con el email al que te hemos invitado y tu contraseña."}
          {modo === "alta" && "¿No has recibido invitación? Date de alta con tu email — te asignamos una contraseña que podrás cambiar después."}
          {modo === "reset" && "Escribe tu email y te enviamos un enlace para restablecer la contraseña."}
        </p>

        {!supabase ? (
          <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
            Supabase todavía no está configurado en este entorno.
          </div>
        ) : (
          <div className="mt-6 space-y-3 text-left">
            <label className="text-sm">
              <span className="block text-[rgb(99,99,99)]">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2"
              />
            </label>
            {modo === "login" && (
              <label className="text-sm">
                <span className="block text-[rgb(99,99,99)]">Contraseña</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2"
                />
              </label>
            )}

            {modo === "login" && (
              <button
                onClick={entrar}
                disabled={!email || !password || cargando}
                className="w-full rounded-full bg-black px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                {cargando ? "Entrando..." : "Entrar →"}
              </button>
            )}
            {modo === "alta" && (
              <button
                onClick={solicitarAlta}
                disabled={!email || cargando}
                className="w-full rounded-full bg-black px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                {cargando ? "Creando acceso..." : "Crear mi acceso →"}
              </button>
            )}
            {modo === "reset" && (
              <button
                onClick={solicitarReset}
                disabled={!email || cargando}
                className="w-full rounded-full bg-black px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                {cargando ? "Enviando..." : "Enviarme el enlace →"}
              </button>
            )}

            {error && <p className="text-xs text-red-600">{error}</p>}
            {avisoAlta && <p className="text-xs text-[#0e6b57]">{avisoAlta}</p>}
            {avisoReset && <p className="text-xs text-[#0e6b57]">{avisoReset}</p>}

            {modo === "login" && (
              <button
                type="button"
                onClick={() => {
                  setModo("reset");
                  setError(null);
                  setAvisoReset(null);
                }}
                className="block text-xs text-[rgb(99,99,99)] underline"
              >
                ¿Has olvidado tu contraseña?
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setModo(modo === "login" ? "alta" : "login");
                setError(null);
                setAvisoAlta(null);
                setAvisoReset(null);
              }}
              className="text-xs text-[rgb(99,99,99)] underline"
            >
              {modo === "login" ? "¿No tienes acceso? Date de alta →" : "← Ya tengo acceso, quiero entrar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AccesoProfesionalesPage() {
  return (
    <Suspense>
      <AccesoForm />
    </Suspense>
  );
}
