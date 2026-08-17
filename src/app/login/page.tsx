"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase/browserClient";
import Logo from "@/components/Logo";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/app/onboarding";
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "enviado" | "error">("idle");
  const supabase = getSupabaseBrowser();

  async function enviarMagicLink() {
    if (!supabase) return;
    setEstado("enviando");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}` },
    });
    setEstado(error ? "error" : "enviado");
  }

  return (
    <div className="mt-landing flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <Logo size={40} />
        <h1 className="mt-4 font-serif text-2xl">Acceso a tu MindTwin</h1>
        <p className="mt-2 text-sm text-[rgb(99,99,99)]">
          Sin contraseña. Te enviamos un enlace de un solo uso a tu email (V10 §12 — Supabase Auth).
        </p>

        {!supabase ? (
          <div className="mt-6 space-y-3 rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
            <p>
              Supabase todavía no está configurado en este entorno (faltan
              NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY), así que el login real
              no puede activarse aquí.
            </p>
            <Link href={redirect} className="font-semibold underline">
              Continuar en modo demo →
            </Link>
          </div>
        ) : estado === "enviado" ? (
          <p className="mt-6 rounded-lg bg-[#1abc9c]/10 p-4 text-sm text-[#0e6b57]">
            Revisa tu email — te hemos enviado el enlace de acceso.
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
            <button
              onClick={enviarMagicLink}
              disabled={!email || estado === "enviando"}
              className="w-full rounded-full bg-black px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              {estado === "enviando" ? "Enviando..." : "Enviar magic link →"}
            </button>
            {estado === "error" && <p className="text-xs text-red-500">No se ha podido enviar el enlace.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
