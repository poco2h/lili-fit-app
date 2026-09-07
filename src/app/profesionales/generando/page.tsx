"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Starfield } from "@/components/starfield/Starfield";

type Estado = {
  status: "pending" | "generating" | "active" | "suspended" | "error";
  error?: string | null;
  slug?: string | null;
};

const PASOS = [
  { key: "perfil", label: "Perfil recibido" },
  { key: "pago", label: "Pago confirmado" },
  { key: "ia", label: "Entrenando IA" },
  { key: "calibrando", label: "Calibrando MindScore" },
  { key: "activando", label: "Activando tu MindTwin" },
] as const;

function pasoActualIndex(status: Estado["status"] | null): number {
  if (!status || status === "pending") return 1;
  if (status === "generating") return 2;
  return 4; // active o error — se muestra completo, el error se avisa aparte
}

function GenerandoInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ownerId = searchParams.get("ownerId");
  const [estado, setEstado] = useState<Estado | null>(null);
  const [intentos, setIntentos] = useState(0);

  useEffect(() => {
    if (!ownerId) return;
    let activo = true;

    async function poll() {
      try {
        const res = await fetch(`/api/profesionales/generador/estado?ownerId=${encodeURIComponent(ownerId!)}`);
        const data = await res.json();
        if (!activo) return;
        if (res.ok) {
          setEstado(data);
          if (data.status === "active") {
            setTimeout(() => router.push("/login?redirect=/app/conversar"), 900);
            return;
          }
        }
      } catch {
        // red intermitente — se reintenta en el próximo tick, sin romper la UI
      }
      if (activo) setIntentos((n) => n + 1);
    }

    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      activo = false;
      clearInterval(interval);
    };
  }, [ownerId, router]);

  const paso = pasoActualIndex(estado?.status ?? null);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <Starfield />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-3xl">Creando tu MindTwin...</h1>
        <p className="mt-3 text-white/60">
          Estamos entrenando tu gemelo cerebral con tu metodología real. Puede tardar unos segundos.
        </p>

        {estado?.status === "error" ? (
          <div className="mt-8 w-full rounded-xl border border-[#c87e7e]/40 bg-[#c87e7e]/10 p-4 text-sm text-[#f0c9c9]">
            Hubo un problema generando tu MindTwin: {estado.error ?? "error desconocido"}. Contacta con soporte, tu
            pago ya está confirmado.
          </div>
        ) : (
          <ul className="mt-8 w-full space-y-2 text-left">
            {PASOS.map((p, i) => (
              <li
                key={p.key}
                className={
                  "flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm " +
                  (i < paso
                    ? "border-[#1abc9c]/40 bg-[#1abc9c]/10 text-[#1abc9c]"
                    : i === paso
                      ? "border-white/20 bg-white/5 text-white"
                      : "border-white/10 text-white/35")
                }
              >
                <span>{i < paso ? "✓" : i === paso ? "…" : "○"}</span>
                {p.label}
              </li>
            ))}
          </ul>
        )}

        {!ownerId && <p className="mt-6 text-sm text-[#f0c9c9]">Falta el identificador del alta — vuelve a /profesionales/contratar.</p>}
        {intentos > 30 && estado?.status !== "active" && estado?.status !== "error" && (
          <p className="mt-6 text-xs text-white/40">Esto está tardando más de lo normal — no cierres esta pestaña.</p>
        )}
      </div>
    </div>
  );
}

export default function GenerandoPage() {
  return (
    <Suspense fallback={null}>
      <GenerandoInner />
    </Suspense>
  );
}
