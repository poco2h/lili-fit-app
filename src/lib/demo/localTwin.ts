import type { EgoId, Respuestas } from "@/lib/ego/types";
import type { Filosofo } from "@/lib/ego/talesWeights";
import type { GutData } from "@/lib/gut/types";
import type { RespuestasBaseline } from "@/lib/gut/baseline";

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

/** Datos deportivos/antropométricos recogidos en la Sesión 4 (V10 §5.3, conversacional, sin tests). */
export type SportsProfile = {
  deporte?: string;
  nivel?: string;
  objetivo?: string;
  frecuenciaActual?: string;
  frecuenciaObjetivo?: string;
  lesiones?: string;
  edad?: string;
  altura?: string;
  peso?: string;
  pesoObjetivo?: string;
  grasaEstimada?: string;
  restricciones?: string;
};

export const SPORTS_PROFILE_VACIO: SportsProfile = {};

/** Puntero de progreso dentro de la sesión activa de Mis Conversaciones (V10 §5) — qué paso toca a continuación. */
export type OnboardingProgress = {
  iniciado: boolean;
  pasoIdx: number;
};

export const ONBOARDING_PROGRESS_INICIAL: OnboardingProgress = { iniciado: false, pasoIdx: 0 };

export type DemoTwin = {
  ego: EgoId;
  tales_weights: Record<Filosofo, number>;
  gut: GutData;
  tales_data: Record<Filosofo, number>;
  sources: Sources;
  sesion_actual: "S1" | "S2" | "S3" | "S4" | "completo";
  direcciones: Direcciones;
  /** Acumulador de respuestas Likert 1-5 de EGO ID a través de S1+S2+S3 — recalcula calcularEgoId en cada avance. */
  respuestas_raw?: Respuestas;
  /** Acumulador de respuestas del baseline GUT conversacional (S2+S3). */
  gut_respuestas_raw?: RespuestasBaseline;
  onboarding_progress?: OnboardingProgress;
  sports_profile?: SportsProfile;
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
