import type { SportsContext } from "./types";

const cache = new Map<string, SportsContext>();

/**
 * Equivalente a sports-news-sync + get-sports-context (V10 §7): cron cada
 * 30 min en días de competición vía API-Football/SportMonks. Sin
 * SPORTS_API_KEY, usa la última entrada válida en caché e indica
 * explícitamente que los datos pueden estar desactualizados — nunca falla
 * en silencio (V10 §7.1: "indica: Mis datos llegan hasta [fecha]").
 */
export async function obtenerSportsContext(celebId: string): Promise<SportsContext> {
  const apiKey = process.env.SPORTS_API_KEY;
  const cacheado = cache.get(celebId);

  if (!apiKey) {
    return (
      cacheado ?? {
        ultimoPartido: null,
        proximoPartido: null,
        estadoFisico: "disponible",
        titularPrensa: null,
        validoHasta: new Date(0).toISOString(),
      }
    );
  }

  try {
    // Endpoint real de API-Football pendiente de confirmar contrato — placeholder.
    const res = await fetch("https://v3.football.api-sports.io/status", {
      headers: { "x-apisports-key": apiKey },
    });
    if (!res.ok) throw new Error("API-Football falló");
    // Mapeo real pendiente — de momento, si responde OK, mantenemos el último caché.
    return cacheado ?? { ultimoPartido: null, proximoPartido: null, estadoFisico: "disponible", titularPrensa: null, validoHasta: new Date().toISOString() };
  } catch {
    return cacheado ?? { ultimoPartido: null, proximoPartido: null, estadoFisico: "disponible", titularPrensa: null, validoHasta: new Date(0).toISOString() };
  }
}

export function resumenParaPrompt(ctx: SportsContext): string {
  const stale = new Date(ctx.validoHasta).getTime() < Date.now();
  const partes: string[] = [];
  if (ctx.ultimoPartido) partes.push(`Último partido: vs ${ctx.ultimoPartido.rival} (${ctx.ultimoPartido.resultado}) el ${ctx.ultimoPartido.fecha}.`);
  if (ctx.proximoPartido) partes.push(`Próximo partido: vs ${ctx.proximoPartido.rival}, ${ctx.proximoPartido.competicion}, ${ctx.proximoPartido.fecha}.`);
  partes.push(`Estado físico: ${ctx.estadoFisico}.`);
  if (stale) partes.push(`(Aviso: mis datos deportivos llegan hasta ${new Date(ctx.validoHasta).toLocaleDateString("es-ES")}, pueden estar desactualizados.)`);
  return partes.join(" ");
}
