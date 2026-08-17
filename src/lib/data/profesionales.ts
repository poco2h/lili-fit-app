export type Profesional = {
  slug: string;
  nombre: string;
  especialidad: string;
  ciudad: string;
  bio: string;
  precioTextoMin: number; // € / sesión 20 min texto — lo fija el propio profesional
};

/**
 * Dataset de ejemplo. En producción esto vive en Supabase (tabla `owners`)
 * y el filtro de src/lib/search/buscarProfesionales.ts pasa a ser una query SQL,
 * pero se mantiene 100% determinista (sin LLM, sin tokens) en ambos casos.
 */
export const PROFESIONALES: Profesional[] = [
  {
    slug: "maria-lopez",
    nombre: "María López",
    especialidad: "Psicóloga del deporte",
    ciudad: "Madrid",
    bio: "Especializada en rendimiento y gestión de la presión competitiva.",
    precioTextoMin: 2.83,
  },
  {
    slug: "laura-garcia",
    nombre: "Laura García",
    especialidad: "Nutricionista deportiva",
    ciudad: "Barcelona",
    bio: "Planes nutricionales basados en microbioma (GUT ID) para deportistas.",
    precioTextoMin: 2.9,
  },
  {
    slug: "carlos-ruiz",
    nombre: "Carlos Ruiz",
    especialidad: "Entrenador personal",
    ciudad: "Valencia",
    bio: "Periodización de fuerza para deportistas amateur y semi-profesionales.",
    precioTextoMin: 2.75,
  },
  {
    slug: "ana-torres",
    nombre: "Ana Torres",
    especialidad: "Fisioterapeuta",
    ciudad: "Madrid",
    bio: "Prevención y readaptación de lesiones en deportistas de resistencia.",
    precioTextoMin: 2.95,
  },
];
