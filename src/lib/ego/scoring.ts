import { ALL_ITEMS } from "./items";
import type { EgoId, Respuestas } from "./types";
import { VIA_FORTALEZAS } from "./types";

function media(respuestas: Respuestas, ids: string[]): number {
  const items = ALL_ITEMS.filter((i) => ids.includes(i.id));
  const valores = items.map((i) => {
    const v = respuestas[i.id] ?? 3;
    return i.reverse ? 6 - v : v;
  });
  if (!valores.length) return 3;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

function a100(media1a5: number): number {
  return Math.round(((media1a5 - 1) / 4) * 100);
}

function idsPorDimension(prefix: string): string[] {
  return ALL_ITEMS.filter((i) => i.dimension === prefix).map((i) => i.id);
}

/**
 * Calcula el EGO ID completo a partir de las respuestas Likert 1-5
 * acumuladas en S1+S2+S3. 100% determinista — aritmética pura, sin LLM
 * (V10 §2: "Aritmética pura. Sin LLM. Reproducible y auditable").
 */
export function calcularEgoId(respuestas: Respuestas): EgoId {
  const big_five = {
    O: a100(media(respuestas, idsPorDimension("O"))),
    C: a100(media(respuestas, idsPorDimension("C"))),
    E: a100(media(respuestas, idsPorDimension("E"))),
    A: a100(media(respuestas, idsPorDimension("A"))),
    N: a100(media(respuestas, idsPorDimension("N"))),
  };

  const scores: Record<number, number> = {};
  for (let t = 1; t <= 9; t++) {
    scores[t] = media(respuestas, idsPorDimension(`eneagrama_${t}`));
  }
  const tipo = Number(
    Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 9
  );
  const ala = Number(
    Object.entries(scores)
      .filter(([t]) => Number(t) !== tipo)
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? tipo
  );

  const ansioso = media(respuestas, idsPorDimension("ecr_ansioso"));
  const evitativo = media(respuestas, idsPorDimension("ecr_evitativo"));
  const apego: EgoId["apego"] =
    ansioso >= 3.5 && evitativo >= 3.5
      ? "desorganizado"
      : ansioso >= 3.5
        ? "ansioso"
        : evitativo >= 3.5
          ? "evitativo"
          : "seguro";

  const promocion = media(respuestas, idsPorDimension("rfq_promocion"));
  const prevencion = media(respuestas, idsPorDimension("rfq_prevencion"));
  const rfq: EgoId["rfq"] = promocion >= prevencion ? "promocion" : "prevencion";

  const teique = {
    bienestar: a100(media(respuestas, idsPorDimension("teique_bienestar"))),
    autocontrol: a100(media(respuestas, idsPorDimension("teique_autocontrol"))),
    emocionalidad: a100(media(respuestas, idsPorDimension("teique_emocionalidad"))),
    sociabilidad: a100(media(respuestas, idsPorDimension("teique_sociabilidad"))),
    ie_global: 0,
  };
  teique.ie_global = Math.round(
    (teique.bienestar + teique.autocontrol + teique.emocionalidad + teique.sociabilidad) / 4
  );

  const viaScores = VIA_FORTALEZAS.map((nombre) => ({
    nombre,
    score: media(respuestas, idsPorDimension(`via_${nombre}`)),
  })).sort((a, b) => b.score - a.score);
  const via_top5 = viaScores.slice(0, 5).map((v) => v.nombre);

  const IR = Math.round((big_five.C + teique.autocontrol) / 2); // Índice de Resiliencia
  const IA = Math.round((100 - (ansioso - 1) * 25 + (100 - (evitativo - 1) * 25)) / 2); // Índice de Apego
  const IEj = Math.round((big_five.C + big_five.E) / 2); // Índice Ejecutivo
  const IC = teique.ie_global; // Índice de Coherencia emocional

  const serialized =
    `T${tipo}w${ala} / O-${nivel(big_five.O)} C-${nivel(big_five.C)} E-${nivel(big_five.E)} ` +
    `A-${nivel(big_five.A)} N-${nivel(big_five.N)} / ${apego} / ${rfq === "promocion" ? "FP" : "FA"} / ` +
    `IE-${teique.ie_global} / [${via_top5.join(", ")}]`;

  return {
    big_five,
    eneagrama: { tipo, ala, scores },
    apego,
    rfq,
    teique,
    via_top5,
    indices: { IR, IA, IEj, IC },
    serialized,
  };
}

function nivel(v: number): "hi" | "mi" | "lo" {
  if (v >= 66) return "hi";
  if (v >= 33) return "mi";
  return "lo";
}
