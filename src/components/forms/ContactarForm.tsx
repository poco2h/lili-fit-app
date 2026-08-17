"use client";

import { useState } from "react";
import { contactarProfesional, type ActionResult } from "@/lib/actions/onboarding";

export default function ContactarForm({ slug }: { slug: string }) {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="mt-6 grid gap-4"
      action={async (formData) => {
        setPending(true);
        const res = await contactarProfesional(slug, formData);
        setResult(res);
        setPending(false);
      }}
    >
      <label className="text-sm">
        <span className="block text-black/60">Tu nombre</span>
        <input name="nombre" required className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2" />
      </label>
      <label className="text-sm">
        <span className="block text-black/60">Tu email</span>
        <input name="email" type="email" required className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2" />
      </label>
      <label className="text-sm">
        <span className="block text-black/60">Mensaje (opcional)</span>
        <textarea name="mensaje" rows={3} className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2" />
      </label>

      <button
        disabled={pending}
        className="mt-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-[#1abc9c] disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Enviar contacto →"}
      </button>

      {result?.ok && (
        <p className="rounded-lg bg-[#1abc9c]/10 p-3 text-sm text-[#0e6b57]">
          Mensaje enviado. El profesional te responderá con sus tarifas y el link de pago.
          {result.simulated && " (simulado — Supabase todavía no está conectado)"}
        </p>
      )}
      {result && !result.ok && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{result.error}</p>
      )}
    </form>
  );
}
