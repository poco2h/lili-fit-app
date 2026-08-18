"use client";

import { useState } from "react";
import { MI_SCHOOL, MI_SCHOOL_FOLLOWER } from "@/lib/habitos/data";

export default function SchoolPage() {
  const [vista, setVista] = useState<"owner" | "follower">("owner");
  const contenido = vista === "owner" ? MI_SCHOOL : MI_SCHOOL_FOLLOWER;

  return (
    <div className="mt-app">
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold">Mi School</h1>
          <div className="flex gap-1">
            <button
              onClick={() => setVista("owner")}
              className={"rounded-full px-3 py-1.5 text-xs font-semibold " + (vista === "owner" ? "bg-white text-black" : "bg-white/10 text-white/60")}
            >
              Vista Owner
            </button>
            <button
              onClick={() => setVista("follower")}
              className={"rounded-full px-3 py-1.5 text-xs font-semibold " + (vista === "follower" ? "bg-white text-black" : "bg-white/10 text-white/60")}
            >
              Vista Follower
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {contenido.map((item) => (
            <div key={item.pregunta} className="mt-glass p-4">
              <p className="font-semibold text-[#1abc9c]">{item.pregunta}</p>
              <p className="mt-1 whitespace-pre-line text-sm text-white/70">{item.respuesta}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
