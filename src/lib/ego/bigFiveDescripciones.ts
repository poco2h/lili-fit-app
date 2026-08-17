type Rasgo = "O" | "C" | "E" | "A" | "N";

const TEXTOS: Record<Rasgo, { alto: string; bajo: string }> = {
  O: { alto: "Muy curioso e imaginativo. El arte, las ideas y la complejidad te atraen de forma natural.", bajo: "Prefieres lo concreto y probado a la novedad por la novedad." },
  C: { alto: "Organizado y constante — planificas antes de actuar.", bajo: "Prefieres la espontaneidad a los planes rígidos. Muy enfocado cuando algo te apasiona." },
  E: { alto: "Te energiza estar rodeado de gente y ser el centro de la conversación.", bajo: "Introvertido: profundidad de pocos vínculos. Los grupos grandes te agotan." },
  A: { alto: "Alta empatía y sensibilidad. Leal en tus relaciones profundas.", bajo: "Antepones tus criterios propios incluso si generan friction." },
  N: { alto: "Procesas las emociones con mucha intensidad. Tu profundidad emocional es tu mayor activo.", bajo: "Mantienes la calma incluso bajo presión." },
};

export function descripcionRasgo(rasgo: Rasgo, valor: number): string {
  return valor >= 55 ? TEXTOS[rasgo].alto : TEXTOS[rasgo].bajo;
}
