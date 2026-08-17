/**
 * Sistema de recetas por microbioma — arquitectura de "sistema_recetas_microbioma.pdf"
 * (memoria del proyecto, 06 ago 2026): bacteria → nutriente → receta,
 * determinista, sin IA en producción. Mismos nombres de tabla/columna que
 * la especificación aprobada (bacterias, nutrientes, bacteria_nutriente,
 * recetas, receta_nutriente), para poder migrar esto a Supabase + RPC
 * `recetas_para_bacterias` sin rediseñar nada.
 *
 * ⚠️ Carga de datos pendiente de Luis (16 bacterias + recetas reales según
 * la memoria del proyecto) — este fichero trae un subconjunto representativo
 * para que el motor de ranking sea end-to-end verificable, no el catálogo
 * clínico completo.
 */

export type Bacteria = { id: string; nombre: string; color: "turquesa" | "verde" | "amarilla" | "roja" };
export type Nutriente = { id: string; nombre: string };
export type Receta = {
  id: string;
  nombre: string;
  ingredientes: string[];
  pasos: string[];
  tiempoMin: number;
  porciones: number;
  nutrienteIds: string[];
};

export const BACTERIAS: Bacteria[] = [
  { id: "akkermansia", nombre: "Akkermansia muciniphila", color: "turquesa" },
  { id: "bifidobacterium", nombre: "Bifidobacterium", color: "verde" },
  { id: "faecalibacterium", nombre: "Faecalibacterium prausnitzii", color: "verde" },
  { id: "lactobacillus", nombre: "Lactobacillus", color: "turquesa" },
  { id: "bacteroides", nombre: "Bacteroides", color: "amarilla" },
  { id: "prevotella", nombre: "Prevotella", color: "amarilla" },
  { id: "ruminococcus", nombre: "Ruminococcus", color: "roja" },
];

export const NUTRIENTES: Nutriente[] = [
  { id: "fibra_soluble", nombre: "Fibra soluble" },
  { id: "polifenoles", nombre: "Polifenoles" },
  { id: "prebioticos", nombre: "Prebióticos (inulina/FOS)" },
  { id: "omega3", nombre: "Omega-3" },
  { id: "fermentados", nombre: "Alimentos fermentados" },
  { id: "proteina_magra", nombre: "Proteína magra" },
];

/** bacteria_nutriente — N:N con intensidad 1-3 (cuánto estimula ese nutriente a esa bacteria). */
export const BACTERIA_NUTRIENTE: Array<{ bacteriaId: string; nutrienteId: string; intensidad: 1 | 2 | 3 }> = [
  { bacteriaId: "akkermansia", nutrienteId: "polifenoles", intensidad: 3 },
  { bacteriaId: "akkermansia", nutrienteId: "fibra_soluble", intensidad: 2 },
  { bacteriaId: "bifidobacterium", nutrienteId: "prebioticos", intensidad: 3 },
  { bacteriaId: "bifidobacterium", nutrienteId: "fermentados", intensidad: 2 },
  { bacteriaId: "faecalibacterium", nutrienteId: "fibra_soluble", intensidad: 3 },
  { bacteriaId: "faecalibacterium", nutrienteId: "omega3", intensidad: 1 },
  { bacteriaId: "lactobacillus", nutrienteId: "fermentados", intensidad: 3 },
  { bacteriaId: "bacteroides", nutrienteId: "proteina_magra", intensidad: 2 },
  { bacteriaId: "prevotella", nutrienteId: "fibra_soluble", intensidad: 2 },
  { bacteriaId: "ruminococcus", nutrienteId: "prebioticos", intensidad: 2 },
];

export const RECETAS: Receta[] = [
  { id: "r1", nombre: "Bowl de avena con kéfir y arándanos", ingredientes: ["Avena", "Kéfir", "Arándanos", "Semillas de chía"], pasos: ["Mezcla la avena con el kéfir.", "Añade los arándanos y las semillas de chía.", "Deja reposar 10 min en frío."], tiempoMin: 10, porciones: 1, nutrienteIds: ["fermentados", "polifenoles", "fibra_soluble"] },
  { id: "r2", nombre: "Salmón al horno con brócoli", ingredientes: ["Salmón", "Brócoli", "Aceite de oliva", "Limón"], pasos: ["Hornea el salmón 15 min a 180°C.", "Cocina el brócoli al vapor 8 min.", "Sirve con un chorro de limón."], tiempoMin: 25, porciones: 2, nutrienteIds: ["omega3", "fibra_soluble"] },
  { id: "r3", nombre: "Crema de calabaza sin lácteos", ingredientes: ["Calabaza", "Caldo de verduras", "Jengibre", "Aceite de oliva"], pasos: ["Cuece la calabaza con el caldo 20 min.", "Tritura con el jengibre.", "Sirve con un chorro de aceite."], tiempoMin: 30, porciones: 3, nutrienteIds: ["fibra_soluble", "prebioticos"] },
  { id: "r4", nombre: "Ensalada de garbanzos y espinacas", ingredientes: ["Garbanzos cocidos", "Espinacas", "Tomate", "Aceite de oliva"], pasos: ["Mezcla los garbanzos con las espinacas y el tomate.", "Aliña con aceite de oliva."], tiempoMin: 10, porciones: 2, nutrienteIds: ["fibra_soluble", "proteina_magra", "polifenoles"] },
  { id: "r5", nombre: "Yogur natural con miel y nueces", ingredientes: ["Yogur natural", "Miel", "Nueces"], pasos: ["Sirve el yogur en un bol.", "Añade la miel y las nueces por encima."], tiempoMin: 5, porciones: 1, nutrienteIds: ["fermentados", "prebioticos"] },
  { id: "r6", nombre: "Pollo a la plancha con puerro y espárragos", ingredientes: ["Pechuga de pollo", "Puerro", "Espárragos", "Aceite de oliva"], pasos: ["Saltea el puerro y los espárragos.", "Cocina el pollo a la plancha.", "Sirve todo junto."], tiempoMin: 20, porciones: 2, nutrienteIds: ["proteina_magra", "prebioticos"] },
];
