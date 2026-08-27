import type { TalesState } from "@/lib/conversar/preprocessorN2";

/**
 * Pre-procesador N2 específico del módulo Constancia (§3 del prompt —
 * tabla "Estado detectado → señal lingüística → ajuste tales_state").
 * Determinista, sin LLM — mismo principio que preprocessorN2.ts pero con
 * las frases-gatillo propias de conversaciones de constancia, más
 * específicas que las heurísticas genéricas del resto del sistema.
 */
const SENALES: Array<{ frases: string[]; ajuste: TalesState }> = [
  { frases: ["para que", "para qué", "nunca lo consigo", "da igual"], ajuste: { Epicuro: 0.3, Homero: 0.2 } },
  { frases: ["no tengo tiempo", "es que ahora", "cuando pase esto"], ajuste: { Séneca: 0.3, Sócrates: 0.2 } },
  { frases: ["yo soy muy constante pero", "el problema es"], ajuste: { Sócrates: 0.4 } },
  { frases: ["debería", "tendria que", "tendría que", "me odio por no"], ajuste: { Epicuro: 0.3, Heráclito: 0.2 } },
  { frases: ["que hago", "qué hago", "dame un plan", "como lo organizo", "cómo lo organizo"], ajuste: { Aristóteles: 0.4 } },
];

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Frases muy cortas / monosilábicas repetidas se tratan como "desconexión del propósito" (§3). */
function esDesconexion(mensaje: string): boolean {
  const palabras = normalizar(mensaje).match(/[a-z]+/g) ?? [];
  return palabras.length > 0 && palabras.length <= 3;
}

export function analizarMensajeConstancia(mensaje: string): TalesState {
  const texto = normalizar(mensaje);
  const state: TalesState = {};
  let algunaSenal = false;

  for (const { frases, ajuste } of SENALES) {
    if (frases.some((f) => texto.includes(normalizar(f)))) {
      algunaSenal = true;
      for (const [filosofo, delta] of Object.entries(ajuste)) {
        const f = filosofo as keyof TalesState;
        state[f] = Math.min(0.5, (state[f] ?? 0) + (delta ?? 0));
      }
    }
  }

  if (!algunaSenal && esDesconexion(mensaje)) {
    state.Homero = Math.min(0.5, (state.Homero ?? 0) + 0.3);
    state.Platón = Math.min(0.5, (state.Platón ?? 0) + 0.2);
  }

  return state;
}
