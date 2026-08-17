import type { Marca } from "@/lib/marcas/types";

const KEY = "mindtwin_demo_marcas";
const MAX_MARCAS_ACTIVAS = 10; // V10 §6

export function leerMarcas(): Marca[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function guardarMarcas(marcas: Marca[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(marcas));
}

export function anadirMarca(marca: Omit<Marca, "id">): Marca[] {
  const actuales = leerMarcas();
  const activas = actuales.filter((m) => m.activaConversaciones).length;
  if (marca.activaConversaciones && activas >= MAX_MARCAS_ACTIVAS) {
    throw new Error(`Máximo ${MAX_MARCAS_ACTIVAS} marcas activas en conversaciones.`);
  }
  const nueva: Marca = { ...marca, id: crypto.randomUUID() };
  const lista = [...actuales, nueva];
  guardarMarcas(lista);
  return lista;
}

export function eliminarMarca(id: string): Marca[] {
  const lista = leerMarcas().filter((m) => m.id !== id);
  guardarMarcas(lista);
  return lista;
}

/** Toggle "Activa en conversaciones" (V10 §6.1) sobre una marca ya creada. */
export function toggleActivaConversaciones(id: string): Marca[] {
  const actuales = leerMarcas();
  const marca = actuales.find((m) => m.id === id);
  if (!marca) return actuales;

  const activas = actuales.filter((m) => m.activaConversaciones).length;
  if (!marca.activaConversaciones && activas >= MAX_MARCAS_ACTIVAS) {
    throw new Error(`Máximo ${MAX_MARCAS_ACTIVAS} marcas activas en conversaciones.`);
  }

  const lista = actuales.map((m) => (m.id === id ? { ...m, activaConversaciones: !m.activaConversaciones } : m));
  guardarMarcas(lista);
  return lista;
}

export function registrarClick(marcaId: string) {
  const clicks = JSON.parse(window.localStorage.getItem("mindtwin_demo_brand_clicks") ?? "[]");
  clicks.push({ marcaId, timestamp: new Date().toISOString() });
  window.localStorage.setItem("mindtwin_demo_brand_clicks", JSON.stringify(clicks));
}
