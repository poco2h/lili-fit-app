/**
 * Persistencia de demo en localStorage para vídeos generados, igual patrón
 * que src/lib/demo/localTwin.ts — mientras no hay sesión real de Supabase
 * Auth (useOwnerSession devuelve owner=null), MisVideos.tsx cae aquí en vez
 * de perder el vídeo generado. Con owner real, sigue usando generated_videos
 * en Supabase vía /api/videos/guardar y /api/videos/listar.
 */
export type VideoDemo = {
  id: string;
  video_url: string;
  variante: string;
  guion: string | null;
  created_at: string;
};

const KEY = "mindtwin_demo_videos";
const MAX_GUARDADOS = 20;

export function leerVideosDemo(): VideoDemo[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as VideoDemo[];
  } catch {
    return [];
  }
}

export function guardarVideoDemo(video: Omit<VideoDemo, "id" | "created_at">): VideoDemo[] {
  const actuales = leerVideosDemo();
  const nuevo: VideoDemo = { ...video, id: crypto.randomUUID(), created_at: new Date().toISOString() };
  const actualizados = [nuevo, ...actuales].slice(0, MAX_GUARDADOS);
  window.localStorage.setItem(KEY, JSON.stringify(actualizados));
  return actualizados;
}
