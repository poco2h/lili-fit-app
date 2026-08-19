"use client";

import { useState } from "react";
import { MI_SCHOOL } from "@/lib/habitos/data";

export default function SchoolPage() {
  const [abierta, setAbierta] = useState<number | null>(null);

  return (
    <div className="mt-app">
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-6 text-xl font-bold">Mi School</h1>
        <div className="space-y-3">
          {MI_SCHOOL.map((item, i) => {
            const abiertaAhora = abierta === i;
            return (
              <div key={item.pregunta} className="mt-glass overflow-hidden">
                <button
                  onClick={() => setAbierta(abiertaAhora ? null : i)}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left"
                  aria-expanded={abiertaAhora}
                >
                  <span className="font-semibold text-[#1abc9c]">{item.pregunta}</span>
                  <span className="flex-shrink-0 text-xl text-white/50">{abiertaAhora ? "−" : "+"}</span>
                </button>
                {abiertaAhora && (
                  <p className="whitespace-pre-line px-4 pb-4 text-sm text-white/70">{item.respuesta}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
