import type { DemoTwin } from "@/lib/demo/localTwin";

const TECHO = 0.95;

/** Misma fórmula que calcularFidelidad (src/lib/fidelity/calcular.ts) aplicada al DemoTwin de localStorage. */
export function calcularFidelidadDemo(twin: DemoTwin): number {
  let f = 0;
  if (twin.sesion_actual === "S1") f = 0.65;
  else if (twin.sesion_actual === "S2") f = 0.82;
  else if (twin.sesion_actual === "S3" || twin.sesion_actual === "completo") f = 0.87;

  if (twin.gut.gut_baseline_score !== null || twin.gut.n1_connected) f += 0.08;
  if (twin.sources.google) f += 0.1;
  if (twin.sources.instagram) f += 0.03;
  if (twin.sources.tiktok) f += 0.04;
  if (twin.sources.whatsapp) f += 0.04;
  if (twin.sources.wearables) f += 0.02;

  return Math.min(f, TECHO);
}
