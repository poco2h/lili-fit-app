"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { getSupabaseBrowser } from "@/lib/supabase/browserClient";

export default function CuentaProfesionalPage() {
  const supabase = getSupabaseBrowser();
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [estado, setEstado] = useState<"idle" | "guardando" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, [supabase]);

  async function cambiarPassword() {
    if (!supabase || password.length < 8) return;
    setEstado("guardando");
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setEstado("error");
      setError(error.message);
      return;
    }
    setEstado("ok");
    setPassword("");
  }

  async function salir() {
    await supabase?.auth.signOut();
    window.location.href = "/profesionales";
  }

  return (
    <div className="mt-landing flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <Link href="/profesionales" className="inline-block">
          <Logo size={40} />
        </Link>
        <h1 className="mt-4 font-serif text-2xl">Mi cuenta</h1>
        <p className="mt-2 text-sm text-[rgb(99,99,99)]">{email ?? "Cargando..."}</p>

        <div className="mt-6 space-y-3 text-left">
          <label className="text-sm">
            <span className="block text-[rgb(99,99,99)]">Nueva contraseña (mín. 8 caracteres)</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2"
            />
          </label>
          <button
            onClick={cambiarPassword}
            disabled={password.length < 8 || estado === "guardando"}
            className="w-full rounded-full bg-black px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {estado === "guardando" ? "Guardando..." : "Cambiar contraseña →"}
          </button>
          {estado === "ok" && <p className="text-xs text-[#0e6b57]">Contraseña actualizada.</p>}
          {error && <p className="text-xs text-red-600">{error}</p>}

          <button type="button" onClick={salir} className="text-xs text-[rgb(99,99,99)] underline">
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
