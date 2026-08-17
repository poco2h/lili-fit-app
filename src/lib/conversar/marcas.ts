import { KEYWORDS_CATEGORIA, type Marca } from "@/lib/marcas/types";

/**
 * Mención orgánica de marcas en Conversar (V10 §6.2): máx. 1 mención/sesión,
 * solo si el contexto es relevante, siempre con disclosure explícito.
 */
export function buscarMencionMarca(
  mensaje: string,
  marcas: Marca[],
  yaMencionada: boolean
): { marca: Marca; texto: string } | null {
  if (yaMencionada) return null;
  const activas = marcas.filter((m) => m.activaConversaciones);
  if (!activas.length) return null;

  const msgLower = mensaje.toLowerCase();
  for (const marca of activas) {
    const keywords = KEYWORDS_CATEGORIA[marca.categoria] ?? [];
    if (keywords.some((k) => msgLower.includes(k))) {
      const promo = marca.promoCode ? ` (código ${marca.promoCode})` : "";
      return {
        marca,
        texto: ` Por cierto, para esto suelo recomendar ${marca.nombre}${promo} — es una marca que tu profesional recomienda personalmente.`,
      };
    }
  }
  return null;
}
