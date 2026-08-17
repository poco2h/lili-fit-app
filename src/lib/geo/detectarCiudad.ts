import { headers } from "next/headers";

/**
 * Matching geográfico (V10 §8.2): "IP → geolocalización (Vercel Edge /
 * MaxMind)". En Vercel, las cabeceras x-vercel-ip-* llegan pobladas en
 * producción; en local/otros hosts no existen — se degrada devolviendo
 * null (el buscador simplemente no preordena por proximidad).
 */
export async function detectarCiudadPorIp(): Promise<string | null> {
  const h = await headers();
  return h.get("x-vercel-ip-city") || null;
}
