import type { EgoId } from "@/lib/ego/types";
import type { Filosofo } from "@/lib/ego/talesWeights";
import type { GutData } from "@/lib/gut/types";

/**
 * Persistencia de demo en localStorage mientras no hay Supabase conectado.
 * En producción esto se sustituye por lectura/escritura de `twin_profile`
 * en Supabase (ver src/lib/types/twinProfile.ts).
 */
export type Sources = {
  google: boolean;
  instagram: boolean;
  tiktok: boolean;
  whatsapp: boolean;
  wearables: boolean;
};

export const SOURCES_VACIO: Sources = {
  google: false,
  instagram: false,
  tiktok: false,
  whatsapp: false,
  wearables: false,
};

export type Direcciones = {
  domicilioPersonal: string;
  domicilioProfesional: string;
};

export const DIRECCIONES_VACIAS: Direcciones = { domicilioPersonal: "", domicilioProfesional: "" };

export type DemoTwin = {
  ego: EgoId;
  tales_weights: Record<Filosofo, number>;
  gut: GutData;
  tales_data: Record<Filosofo, number>;
  sources: Sources;
  sesion_actual: "S1" | "S2" | "S3" | "completo";
  direcciones: Direcciones;
};

const KEY = "mindtwin_demo_profile";

export function guardarDemoTwin(twin: DemoTwin) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(twin));
}

export function actualizarSources(patch: Partial<Sources>): DemoTwin | null {
  const actual = leerDemoTwin();
  if (!actual) return null;
  const actualizado = { ...actual, sources: { ...actual.sources, ...patch } };
  guardarDemoTwin(actualizado);
  return actualizado;
}

export function leerDemoTwin(): DemoTwin | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DemoTwin;
  } catch {
    return null;
  }
}
