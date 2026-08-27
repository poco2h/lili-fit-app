import type { ConstanciaEpisodioAbandono, ConstanciaState } from "@/lib/demo/localTwin";

/** §1/§12 del prompt: dias_sin_checkin, racha_actual, racha_maxima, patron_abandono, brecha_autoevaluacion — todo determinista, sin LLM. */

function soloFecha(iso: string): string {
  return iso.slice(0, 10);
}

function diasEntre(a: string, b: string): number {
  const msA = new Date(soloFecha(a) + "T00:00:00Z").getTime();
  const msB = new Date(soloFecha(b) + "T00:00:00Z").getTime();
  return Math.round((msB - msA) / (1000 * 60 * 60 * 24));
}

export function ultimoCheckin(state: ConstanciaState): string | null {
  if (state.checkins.length === 0) return null;
  return state.checkins.map((c) => c.fecha).sort().at(-1) ?? null;
}

export function diasSinCheckin(state: ConstanciaState, ahoraIso: string = new Date().toISOString()): number | null {
  const ultimo = ultimoCheckin(state);
  if (!ultimo) return null;
  return Math.max(0, diasEntre(ultimo, ahoraIso));
}

/** Racha actual = días consecutivos con check-in terminando hoy o ayer (si hoy aún no ha marcado). */
export function rachaActual(state: ConstanciaState, ahoraIso: string = new Date().toISOString()): number {
  if (state.checkins.length === 0) return 0;
  const fechas = new Set(state.checkins.map((c) => soloFecha(c.fecha)));
  const hoy = soloFecha(ahoraIso);
  let cursor = fechas.has(hoy) ? hoy : soloFecha(new Date(new Date(hoy).getTime() - 86400000).toISOString());
  if (!fechas.has(cursor)) return 0;
  let racha = 0;
  while (fechas.has(cursor)) {
    racha++;
    cursor = soloFecha(new Date(new Date(cursor).getTime() - 86400000).toISOString());
  }
  return racha;
}

export function rachaMaxima(state: ConstanciaState): number {
  if (state.checkins.length === 0) return 0;
  const fechas = [...new Set(state.checkins.map((c) => soloFecha(c.fecha)))].sort();
  let maxima = 1;
  let actual = 1;
  for (let i = 1; i < fechas.length; i++) {
    if (diasEntre(fechas[i - 1], fechas[i]) === 1) {
      actual++;
      maxima = Math.max(maxima, actual);
    } else {
      actual = 1;
    }
  }
  return maxima;
}

/** §12: true si score >= 7 pero llevan 14+ días sin check-in — disonancia entre autopercepción y comportamiento real. */
export function brechaAutoevaluacion(state: ConstanciaState, ahoraIso: string = new Date().toISOString()): boolean {
  if (state.ultimaAutoevaluacionScore == null) return false;
  const dias = diasSinCheckin(state, ahoraIso);
  return state.ultimaAutoevaluacionScore >= 7 && dias != null && dias >= 14;
}

/** §12: solo se infiere con 2+ episodios previos que comparten el mismo motivo (excluyendo "otro"). */
export function patronAbandono(episodios: ConstanciaEpisodioAbandono[]): ConstanciaEpisodioAbandono["motivo"] | null {
  const conteo = new Map<string, number>();
  for (const e of episodios) {
    if (e.motivo === "otro") continue;
    conteo.set(e.motivo, (conteo.get(e.motivo) ?? 0) + 1);
  }
  for (const [motivo, n] of conteo) {
    if (n >= 2) return motivo as ConstanciaEpisodioAbandono["motivo"];
  }
  return null;
}
