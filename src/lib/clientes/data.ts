export type ClienteResumen = {
  id: string;
  nombre: string;
  especialidad: string;
  alertasActivas: number;
  diasSinActividad: number;
  racha: number;
  sesionesTotales: number;
  minutos: { texto: number; voz: number; video: number };
  /** Sesiones de la semana en curso, por día — lo que se muestra en la tabla de Mis Clientes. */
  sesionesSemana: Record<"lun" | "mar" | "mie" | "jue" | "vie", { canal: "T" | "V" | "Vid"; minutos: number } | null>;
};

/** Precio por minuto según canal (V10 — el mismo usado en el resto de la app). */
export const PRECIO_MIN: Record<"T" | "V" | "Vid", number> = { T: 0.376, V: 0.746, Vid: 1.166 };

export function minutosMes(c: ClienteResumen): number {
  return c.minutos.texto + c.minutos.voz + c.minutos.video;
}

export function facturadoMes(c: ClienteResumen): number {
  return c.minutos.texto * PRECIO_MIN.T + c.minutos.voz * PRECIO_MIN.V + c.minutos.video * PRECIO_MIN.Vid;
}

/**
 * Dashboard "Mis Clientes" — solo lectura, sin LLM (~€0, V10 §4.7).
 * El owner NUNCA ve contenido de conversaciones, tests psicológicos,
 * ni notas del follower — solo KPIs agregados, presentados como logros
 * en vez de estadísticas frías.
 */
export const CLIENTES_DEMO: ClienteResumen[] = [
  {
    id: "c1", nombre: "Ana Martínez", especialidad: "Nutrición",
    alertasActivas: 0, diasSinActividad: 1, racha: 8, sesionesTotales: 52,
    minutos: { texto: 40, voz: 0, video: 107 },
    sesionesSemana: { lun: { canal: "V", minutos: 20 }, mar: null, mie: { canal: "V", minutos: 15 }, jue: null, vie: { canal: "V", minutos: 22 } },
  },
  {
    id: "c2", nombre: "Carlos Ruiz", especialidad: "Entrenamiento",
    alertasActivas: 1, diasSinActividad: 3, racha: 3, sesionesTotales: 17,
    minutos: { texto: 30, voz: 20, video: 32 },
    sesionesSemana: { lun: { canal: "T", minutos: 30 }, mar: { canal: "T", minutos: 20 }, mie: null, jue: { canal: "V", minutos: 15 }, vie: null },
  },
  {
    id: "c3", nombre: "Laura Pérez", especialidad: "Coaching",
    alertasActivas: 0, diasSinActividad: 0, racha: 12, sesionesTotales: 40,
    minutos: { texto: 20, voz: 0, video: 180 },
    sesionesSemana: { lun: null, mar: { canal: "Vid", minutos: 40 }, mie: null, jue: null, vie: { canal: "Vid", minutos: 60 } },
  },
  {
    id: "c4", nombre: "Miguel García", especialidad: "Nutrición",
    alertasActivas: 2, diasSinActividad: 6, racha: 1, sesionesTotales: 4,
    minutos: { texto: 0, voz: 12, video: 0 },
    sesionesSemana: { lun: { canal: "V", minutos: 12 }, mar: null, mie: null, jue: null, vie: null },
  },
  {
    id: "c5", nombre: "Sofía Blanco", especialidad: "Entrenamiento",
    alertasActivas: 0, diasSinActividad: 1, racha: 5, sesionesTotales: 28,
    minutos: { texto: 15, voz: 8, video: 32 },
    sesionesSemana: { lun: { canal: "V", minutos: 8 }, mar: { canal: "T", minutos: 15 }, mie: null, jue: { canal: "T", minutos: 11 }, vie: { canal: "Vid", minutos: 32 } },
  },
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
