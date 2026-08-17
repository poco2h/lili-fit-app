export type CategoriaMarca =
  | "nutricion" | "equipamiento" | "ropa" | "suplementos" | "tecnologia" | "recuperacion" | "lifestyle";

export type Marca = {
  id: string;
  nombre: string;
  categoria: CategoriaMarca;
  descripcion: string;
  logoUrl: string | null;
  affiliateLink: string;
  promoCode: string | null;
  activaConversaciones: boolean;
  comisionPct: number | null;
};

/** Keywords que activan la mención orgánica de una marca por categoría (V10 §6.2). */
export const KEYWORDS_CATEGORIA: Record<CategoriaMarca, string[]> = {
  nutricion: ["comida", "dieta", "nutrición", "alimentación"],
  equipamiento: ["material", "equipamiento", "pesas", "bandas"],
  ropa: ["ropa", "zapatillas", "malla"],
  suplementos: ["proteína", "suplemento", "creatina", "batido"],
  tecnologia: ["pulsómetro", "reloj", "wearable", "app"],
  recuperacion: ["recuperación", "masaje", "estiramiento", "descanso"],
  lifestyle: ["rutina", "hábito", "estilo de vida"],
};
