import type { GutData } from "@/lib/gut/types";

/**
 * Conexión con el sistema N1 (GUT_ID_v2 / ZOE) de Javi — dueño real del test
 * clínico de microbioma (28 preguntas, 7 dimensiones, 16 bacterias). No hay
 * todavía un endpoint/API documentado en la carpeta MINDTWINS para esta
 * integración — stub explícito hasta que se defina el contrato con Javi.
 */
export async function conectarN1(_n1UserId: string): Promise<GutData | null> {
  console.warn("[MindTwin] Integración N1 no configurada todavía (falta endpoint/API de GUT_ID_v2).");
  return null;
}
