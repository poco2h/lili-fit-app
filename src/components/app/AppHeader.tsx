"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import { calcularFidelidadDemo } from "@/lib/fidelity/calcularDemo";
import { useTwin } from "@/lib/session/useTwin";

export const OWNER_NOMBRE_DEMO = "David Rodríguez";
const OWNER_INICIALES_DEMO = "DR";

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase() || "?";
}

/** Cabecera de identidad del Owner — avatar, rol y MINDSCORE (V10: fidelidad), igual a la referencia REF_MisFuentes. */
export default function AppHeader() {
  const { twin, owner } = useTwin();

  const mindscore = twin ? Math.round(calcularFidelidadDemo(twin) * 100) : null;
  const nombreMostrado = owner?.ownerName ?? OWNER_NOMBRE_DEMO;
  const inicialesMostradas = owner ? iniciales(owner.ownerName) : OWNER_INICIALES_DEMO;

  return (
    <header className="relative z-10 flex items-center justify-between gap-3 border-b border-[#1abc9c]/35 bg-black/65 px-4 py-3 backdrop-blur-xl">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[10px] border-2 border-[#1abc9c] bg-gradient-to-br from-blue-700 to-teal-600 text-[13px] font-bold shadow-[0_0_18px_rgba(26,188,156,0.6)]">
          {owner?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={owner.avatarUrl} alt={nombreMostrado} className="h-full w-full object-cover" />
          ) : (
            inicialesMostradas
          )}
        </div>
        <div>
          <div className="text-[15px] font-extrabold leading-tight">{nombreMostrado}</div>
          <span className="mt-0.5 inline-block rounded bg-[#1abc9c]/18 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#1abc9c]">
            Owner · Profesional
          </span>
        </div>
      </div>
      <Link href="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-label="Volver a la landing">
        <Logo variant="dark" size={44} />
      </Link>
      <div className="text-right">
        <div className="text-[22px] font-extrabold leading-none text-[#1abc9c]">{mindscore ?? "—"}%</div>
        <div className="text-[9px] uppercase tracking-wide text-white/40">Mindscore</div>
        <div className="mt-1 h-1 w-14 rounded bg-white/10">
          <div className="h-full rounded bg-gradient-to-r from-[#1abc9c] to-[#0e9f85]" style={{ width: `${mindscore ?? 0}%` }} />
        </div>
      </div>
    </header>
  );
}
