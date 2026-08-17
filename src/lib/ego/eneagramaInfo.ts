/** Triada miedo/emoción/virtud por eneatipo — vista "Quién soy" de Mi Cerebro (doc de referencia). */
export const ENEAGRAMA_TRIADA: Record<number, { nombre: string; miedo: string; emocion: string; virtud: string }> = {
  1: { nombre: "Perfeccionista", miedo: "Ser corrupto o imperfecto", emocion: "Resentimiento contenido", virtud: "Serenidad" },
  2: { nombre: "Ayudador", miedo: "Ser indigno de amor", emocion: "Orgullo por ser imprescindible", virtud: "Humildad" },
  3: { nombre: "Triunfador", miedo: "Ser inútil o sin valor", emocion: "Vanidad", virtud: "Autenticidad" },
  4: { nombre: "Individualista", miedo: "No tener identidad propia", emocion: "Envidia", virtud: "Ecuanimidad" },
  5: { nombre: "Investigador", miedo: "Ser invadido o vaciado", emocion: "Avaricia (de tiempo/energía)", virtud: "Desapego" },
  6: { nombre: "Leal", miedo: "Quedarse sin apoyo o guía", emocion: "Ansiedad anticipatoria", virtud: "Valentía" },
  7: { nombre: "Entusiasta", miedo: "La privación y el dolor", emocion: "Gula (de experiencias)", virtud: "Sobriedad" },
  8: { nombre: "Desafiador", miedo: "Ser controlado o débil", emocion: "Lujuria (intensidad, control)", virtud: "Inocencia" },
  9: { nombre: "Pacificador", miedo: "La pérdida y el conflicto", emocion: "Pereza (de la propia agenda)", virtud: "Acción" },
};

export const VIA_DESCRIPCION: Record<string, string> = {
  "Apreciación de la belleza": "Percibes y valoras la excelencia en distintos ámbitos de la vida.",
  "Creatividad": "Piensas en formas nuevas y productivas de hacer las cosas.",
  "Perspectiva": "Aportas sabiduría que ayuda a otros a ver el panorama completo.",
  "Amor": "Priorizas las relaciones cercanas y cálidas por encima de lo demás.",
  "Amor por aprender": "Dominas nuevas habilidades y temas por el gusto de aprender.",
};
