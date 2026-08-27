/**
 * Cliente mínimo de Terra API (tryterra.co) — agrega Fitbit, Garmin, Oura,
 * Whoop, Apple Health, etc. en un solo conector, como ya describe la propia
 * tarjeta de Wearables en Mis Fuentes. Requiere TERRA_DEV_ID + TERRA_API_KEY
 * (dev dashboard de Terra) — sin ellos, degrada con un error claro en vez de
 * lanzar, igual que el resto de integraciones opcionales de la app.
 */
const TERRA_BASE = "https://api.tryterra.co/v2";

type ResultadoTerra<T> = { ok: true; data: T } | { ok: false; motivo: string };

function credenciales(): { devId: string; apiKey: string } | null {
  const devId = process.env.TERRA_DEV_ID;
  const apiKey = process.env.TERRA_API_KEY;
  if (!devId || !apiKey) return null;
  return { devId, apiKey };
}

/** Genera la URL del widget de conexión de Terra para que el owner autorice su(s) dispositivo(s). */
export async function generarSesionConexionTerra(params: {
  ownerId: string;
  redirectExitoUrl: string;
  redirectErrorUrl: string;
}): Promise<ResultadoTerra<string>> {
  const cred = credenciales();
  if (!cred) return { ok: false, motivo: "TERRA_DEV_ID/TERRA_API_KEY no configurados" };

  try {
    const res = await fetch(`${TERRA_BASE}/auth/generateWidgetSession`, {
      method: "POST",
      headers: { "dev-id": cred.devId, "x-api-key": cred.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        reference_id: params.ownerId,
        providers: "GARMIN,FITBIT,OURA,WITHINGS,GOOGLE,APPLE,WHOOP",
        language: "es",
        auth_success_redirect_url: params.redirectExitoUrl,
        auth_failure_redirect_url: params.redirectErrorUrl,
      }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    if (!res.ok || !data?.url) return { ok: false, motivo: data?.message ?? `HTTP ${res.status}` };
    return { ok: true, data: data.url as string };
  } catch (e) {
    return { ok: false, motivo: e instanceof Error ? e.message : "error de red" };
  }
}
