"use client";

import { useEffect, useState } from "react";
import { leerMarcas, anadirMarca, eliminarMarca, toggleActivaConversaciones } from "@/lib/demo/marcas";
import type { CategoriaMarca, Marca } from "@/lib/marcas/types";

const CATEGORIAS: CategoriaMarca[] = ["nutricion", "equipamiento", "ropa", "suplementos", "tecnologia", "recuperacion", "lifestyle"];

export default function MisMarcas() {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [form, setForm] = useState({ nombre: "", categoria: "suplementos" as CategoriaMarca, descripcion: "", affiliateLink: "", promoCode: "" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMarcas(leerMarcas()), []);

  function toggle(id: string) {
    setError(null);
    try {
      setMarcas(toggleActivaConversaciones(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cambiar el estado de la marca");
    }
  }

  function agregar() {
    setError(null);
    try {
      const lista = anadirMarca({
        nombre: form.nombre,
        categoria: form.categoria,
        descripcion: form.descripcion,
        logoUrl: null,
        affiliateLink: form.affiliateLink,
        promoCode: form.promoCode || null,
        activaConversaciones: true,
        comisionPct: null,
      });
      setMarcas(lista);
      setForm({ nombre: "", categoria: "suplementos", descripcion: "", affiliateLink: "", promoCode: "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al añadir la marca");
    }
  }

  return (
    <div className="space-y-6">
      <div className="mt-glass space-y-3 p-5">
        <h3 className="font-semibold">Añadir marca</h3>
        <input placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm" />
        <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value as CategoriaMarca })} className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm">
          {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input placeholder="Descripción corta" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm" />
        <input placeholder="Link de afiliado" value={form.affiliateLink} onChange={(e) => setForm({ ...form, affiliateLink: e.target.value })} className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm" />
        <input placeholder="Código promo (opcional)" value={form.promoCode} onChange={(e) => setForm({ ...form, promoCode: e.target.value })} className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm" />
        <button onClick={agregar} disabled={!form.nombre || !form.affiliateLink} className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black disabled:opacity-40">
          Añadir →
        </button>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      <div className="space-y-3">
        {marcas.map((m) => (
          <div key={m.id} className="mt-glass flex items-center justify-between p-4">
            <div>
              <p className="font-semibold">{m.nombre} <span className="text-xs text-[#1abc9c]">· {m.categoria}</span></p>
              <p className="text-sm text-white/60">{m.descripcion}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggle(m.id)}
                className={
                  "rounded-full px-3 py-1.5 text-xs font-bold " +
                  (m.activaConversaciones ? "bg-white text-black" : "bg-white/10 text-white/50")
                }
              >
                {m.activaConversaciones ? "Activa en conversaciones ✓" : "Inactiva"}
              </button>
              <button onClick={() => setMarcas(eliminarMarca(m.id))} className="text-xs text-red-400 hover:underline">
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {marcas.length === 0 && <p className="text-sm text-white/40">Todavía no has añadido marcas.</p>}
      </div>
    </div>
  );
}
