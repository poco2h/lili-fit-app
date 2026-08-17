"use client";

import { useEffect, useState } from "react";
import { leerMarcas, registrarClick } from "@/lib/demo/marcas";
import type { Marca } from "@/lib/marcas/types";

export default function MarcasFollowerPage() {
  const [marcas, setMarcas] = useState<Marca[]>([]);

  useEffect(() => setMarcas(leerMarcas().filter((m) => m.activaConversaciones)), []);

  return (
    <div className="mt-app">
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-2 text-xl font-bold">Marcas de tu profesional</h1>
        <p className="mb-6 text-sm text-white/50">
          Marcas que tu profesional recomienda personalmente. Poco2h no cobra comisión — el
          revenue de afiliación es 100% del profesional.
        </p>
        <div className="grid gap-3">
          {marcas.map((m) => (
            <div key={m.id} className="mt-glass flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{m.nombre}</p>
                <p className="text-sm text-white/60">{m.descripcion}</p>
                {m.promoCode && <p className="mt-1 text-xs text-[#1abc9c]">Código: {m.promoCode}</p>}
              </div>
              <a
                href={m.affiliateLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => registrarClick(m.id)}
                className="rounded-full bg-[#1abc9c] px-4 py-2 text-xs font-bold text-black"
              >
                Ver más
              </a>
            </div>
          ))}
          {marcas.length === 0 && <p className="text-sm text-white/40">Tu profesional no ha publicado marcas todavía.</p>}
        </div>
      </div>
    </div>
  );
}
