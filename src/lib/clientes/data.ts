export type ClienteResumen = {
  id: string;
  nombre: string;
  alertasActivas: number;
  diasSinActividad: number;
  racha: number;
  sesionesTotales: number;
  minutos: { texto: number; voz: number; video: number };
};

/**
 * Dashboard "Mis Clientes" — solo lectura, sin LLM (~€0, V10 §4.7).
 * El owner NUNCA ve contenido de conversaciones, tests psicológicos,
 * ni notas del follower — solo KPIs agregados, presentados como logros
 * en vez de estadísticas frías.
 */
export const CLIENTES_DEMO: ClienteResumen[] = [
  { id: "c1", nombre: "Pedro Sánchez", alertasActivas: 2, diasSinActividad: 6, racha: 1, sesionesTotales: 4, minutos: { texto: 12, voz: 20, video: 0 } },
  { id: "c2", nombre: "Lucía Fernández", alertasActivas: 0, diasSinActividad: 1, racha: 8, sesionesTotales: 52, minutos: { texto: 40, voz: 0, video: 10 } },
  { id: "c3", nombre: "Marcos Iglesias", alertasActivas: 1, diasSinActividad: 3, racha: 3, sesionesTotales: 17, minutos: { texto: 5, voz: 15, video: 0 } },
];

export function ordenarClientes(clientes: ClienteResumen[]): ClienteResumen[] {
  return [...clientes].sort((a, b) => {
    if (a.alertasActivas !== b.alertasActivas) return b.alertasActivas - a.alertasActivas;
    if (a.diasSinActividad !== b.diasSinActividad) return b.diasSinActividad - a.diasSinActividad;
    return b.racha - a.racha;
  });
}

export type Logro = { emoji: string; titulo: string };

/** Traduce la racha/actividad fría en un logro reconocible — mismo dato, presentado como reconocimiento. */
export function logroPrincipal(c: ClienteResumen): Logro {
  if (c.diasSinActividad >= 5) return { emoji: "👋", titulo: "Le vendría bien un empujón" };
  if (c.racha >= 7) return { emoji: "🔥", titulo: `Racha en llamas — ${c.racha} días seguidos` };
  if (c.racha >= 3) return { emoji: "⭐", titulo: `Buen ritmo — ${c.racha} días seguidos` };
  return { emoji: "🌱", titulo: "Recién empezando" };
}

export function hitoSesiones(c: ClienteResumen): Logro | null {
  if (c.sesionesTotales >= 50) return { emoji: "🏆", titulo: `${c.sesionesTotales} sesiones — nivel oro` };
  if (c.sesionesTotales >= 15) return { emoji: "🥈", titulo: `${c.sesionesTotales} sesiones — nivel plata` };
  if (c.sesionesTotales >= 5) return { emoji: "🥉", titulo: `${c.sesionesTotales} sesiones — nivel bronce` };
  return null;
}
