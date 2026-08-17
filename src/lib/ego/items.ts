import type { LikertItem } from "./types";
import { VIA_FORTALEZAS } from "./types";

/**
 * ⚠️ Ítems representativos/parafraseados, NO el redactado oficial de los
 * instrumentos licenciados (BFI, TEIQue-SF, ECR, RFQ, VIA-IS). V10 exige
 * "6 tests psicométricos validados" pero ningún documento de la carpeta
 * MINDTWINS trae el banco de ítems con licencia — DOC4/DOC6 avisan
 * explícitamente "Requiere revisión psicólogo antes de producción".
 *
 * Este motor de scoring es funcionalmente correcto y determinista. Los
 * conteos por test SÍ respetan el conteo real de V10 (BFI-20=20, Eneagrama=36,
 * ECR=4, RFQ=6, TEIQue-SF=30, VIA-24=24); lo que falta antes de producción
 * es sustituir `texto` por el ítem oficial licenciado de cada test (o los
 * adaptados y validados por el psicólogo del equipo), sin tocar
 * `dimension`/`reverse`/la lógica de scoring.
 */

// ---------- BFI-20 · Big Five (4 ítems por dimensión, 20 total) ----------
const BFI_TEXTOS: Record<"O" | "C" | "E" | "A" | "N", Array<[string, boolean?]>> = {
  O: [
    ["Disfruto explorando ideas o experiencias nuevas."],
    ["Tengo curiosidad por temas muy distintos entre sí."],
    ["Prefiero rutinas conocidas a probar algo distinto.", true],
    ["Me aburren las conversaciones sobre ideas abstractas.", true],
  ],
  C: [
    ["Termino lo que empiezo, aunque me cueste."],
    ["Planifico con antelación en vez de improvisar."],
    ["Se me olvidan tareas si no las anoto.", true],
    ["Dejo las cosas para el último momento.", true],
  ],
  E: [
    ["Me energiza estar rodeado de gente."],
    ["Hablo con facilidad con personas que no conozco."],
    ["Prefiero pasar tiempo solo antes que en grupo.", true],
    ["Evito ser el centro de atención en reuniones.", true],
  ],
  A: [
    ["Confío en las intenciones de los demás por defecto."],
    ["Me importa que las personas de mi entorno estén bien."],
    ["Discuto con facilidad cuando no estoy de acuerdo.", true],
    ["Antepongo mis intereses a los del grupo.", true],
  ],
  N: [
    ["Me cuesta calmarme cuando algo me preocupa."],
    ["Me afectan mucho las críticas, aunque sean pequeñas."],
    ["Mantengo la calma incluso bajo presión.", true],
    ["Rara vez me siento ansioso sin motivo claro.", true],
  ],
};

export const BFI20: LikertItem[] = Object.entries(BFI_TEXTOS).flatMap(([dim, items]) =>
  items.map(([texto, reverse], i) => ({
    id: `bfi_${dim.toLowerCase()}${i + 1}`,
    test: "bfi20" as const,
    dimension: dim as "O" | "C" | "E" | "A" | "N",
    texto,
    reverse,
  }))
);

// ---------- Short Enneagram · 36 ítems (4 por tipo, 9 tipos) ----------
const ENEAGRAMA_TEXTOS: string[][] = [
  // 1 · Perfeccionista
  ["Necesito que las cosas se hagan bien, aunque implique más esfuerzo.", "Noto rápido los errores antes que los aciertos.", "Me cuesta delegar porque temo que no salga como debe.", "Tengo un sentido claro de lo correcto e incorrecto."],
  // 2 · Ayudador
  ["Me cuesta decir que no cuando alguien necesita ayuda.", "Sé lo que necesitan los demás antes que ellos mismos.", "Me duele sentir que no soy imprescindible para nadie.", "Doy mucho más de lo que pido a cambio."],
  // 3 · Triunfador
  ["Me motiva mucho destacar y lograr resultados visibles.", "Me cuesta parar cuando hay un objetivo por delante.", "Cuido mucho la imagen que proyecto hacia fuera.", "Mido mi valor por lo que consigo, no por cómo me siento."],
  // 4 · Individualista
  ["Siento las cosas con más intensidad que la mayoría.", "Me identifico con lo distinto, lo que no es común.", "Puedo pasar de la euforia a la melancolía con facilidad.", "Busco autenticidad por encima de encajar."],
  // 5 · Investigador
  ["Necesito entender algo a fondo antes de actuar.", "Prefiero observar antes que participar activamente.", "Necesito espacio y tiempo a solas para recargar.", "Me incomoda depender emocionalmente de otros."],
  // 6 · Leal
  ["Anticipo lo que puede salir mal antes de decidir.", "Cuestiono la autoridad hasta ganarme confianza en ella.", "Valoro mucho la lealtad en mis relaciones cercanas.", "Me preparo para escenarios que probablemente no ocurran."],
  // 7 · Entusiasta
  ["Busco mantener siempre abiertas varias opciones divertidas.", "Me cuesta comprometerme con una sola cosa a largo plazo.", "Evito el dolor buscando distracción o estímulo nuevo.", "Soy optimista incluso cuando las cosas van mal."],
  // 8 · Desafiador
  ["Prefiero tomar el control antes que depender de otros.", "Digo las cosas directamente, sin rodeos.", "Me cuesta mostrar debilidad delante de otros.", "Protejo con fuerza a quienes considero míos."],
  // 9 · Pacificador
  ["Evito el conflicto incluso cuando me afecta directamente.", "Me cuesta identificar qué quiero yo, no lo que quieren otros.", "Prefiero la calma aunque implique ceder.", "Postergo decisiones difíciles todo lo que puedo."],
];

export const ENEAGRAMA36: LikertItem[] = ENEAGRAMA_TEXTOS.flatMap((textos, i) => {
  const tipo = i + 1;
  return textos.map((texto, j) => ({
    id: `ene_${tipo}_${j + 1}`,
    test: "eneagrama36" as const,
    dimension: `eneagrama_${tipo}` as const,
    texto,
  }));
});

// ---------- ECR-4 · Apego (4 ítems) ----------
export const ECR4: LikertItem[] = [
  { id: "ecr_ans1", test: "ecr4", dimension: "ecr_ansioso", texto: "Me preocupa que las personas cercanas se alejen de mí." },
  { id: "ecr_ans2", test: "ecr4", dimension: "ecr_ansioso", texto: "Necesito señales frecuentes de que le importo a la otra persona." },
  { id: "ecr_evi1", test: "ecr4", dimension: "ecr_evitativo", texto: "Prefiero no depender emocionalmente de nadie." },
  { id: "ecr_evi2", test: "ecr4", dimension: "ecr_evitativo", texto: "Me incomoda mostrar vulnerabilidad a otros." },
];

// ---------- RFQ-6 · Foco regulatorio (6 ítems) ----------
export const RFQ6: LikertItem[] = [
  { id: "rfq_prom1", test: "rfq6", dimension: "rfq_promocion", texto: "Me muevo sobre todo persiguiendo logros e ilusiones." },
  { id: "rfq_prom2", test: "rfq6", dimension: "rfq_promocion", texto: "Pienso más en lo que puedo ganar que en lo que puedo perder." },
  { id: "rfq_prom3", test: "rfq6", dimension: "rfq_promocion", texto: "Me entusiasma imaginar el mejor escenario posible." },
  { id: "rfq_prev1", test: "rfq6", dimension: "rfq_prevencion", texto: "Me muevo sobre todo evitando errores y riesgos." },
  { id: "rfq_prev2", test: "rfq6", dimension: "rfq_prevencion", texto: "Prefiero seguridad garantizada a una posible ganancia mayor." },
  { id: "rfq_prev3", test: "rfq6", dimension: "rfq_prevencion", texto: "Repaso varias veces una decisión antes de confirmarla." },
];

// ---------- TEIQue-SF · Inteligencia emocional (30 ítems) ----------
const TEIQUE_TEXTOS: Record<"teique_bienestar" | "teique_autocontrol" | "teique_emocionalidad" | "teique_sociabilidad", string[]> = {
  teique_bienestar: [
    "En general estoy satisfecho con mi vida.",
    "Suelo tener una visión positiva de las cosas que me pasan.",
    "Me siento capaz de conseguir lo que me propongo.",
    "Rara vez me siento insatisfecho con quien soy.",
    "Confío en que las cosas tienden a salir bien.",
    "Me siento orgulloso de cómo he gestionado momentos difíciles.",
    "Tengo una autoestima estable, no depende de la opinión ajena.",
    "Disfruto de las cosas pequeñas del día a día.",
  ],
  teique_autocontrol: [
    "Controlo mis impulsos incluso bajo estrés.",
    "Puedo regular mi ansiedad cuando la situación lo requiere.",
    "No dejo que el enfado dirija lo que digo o hago.",
    "Me recupero rápido después de un contratiempo.",
    "Puedo posponer una gratificación inmediata por algo mejor después.",
    "Mantengo la cabeza fría en discusiones tensas.",
    "Gestiono bien la presión de tiempo.",
  ],
  teique_emocionalidad: [
    "Identifico con claridad lo que siento en cada momento.",
    "Reconozco las emociones de otros aunque no las digan.",
    "Expreso lo que siento sin mucha dificultad.",
    "Distingo matices entre emociones parecidas (p. ej. tristeza y decepción).",
    "Uso mis emociones como información útil para decidir.",
    "Noto cuándo alguien cercano está incómodo, aunque disimule.",
    "Mis relaciones cercanas se sienten emocionalmente auténticas.",
    "Puedo ponerme en el lugar del otro con facilidad.",
  ],
  teique_sociabilidad: [
    "Me resulta fácil conectar emocionalmente con desconocidos.",
    "Se me da bien negociar o mediar en un desacuerdo.",
    "Me adapto con facilidad a grupos sociales nuevos.",
    "Puedo influir en el estado de ánimo de un grupo.",
    "Escucho activamente sin esperar solo mi turno de hablar.",
    "Me es cómodo pedir ayuda cuando la necesito.",
    "Genero confianza con rapidez en un primer encuentro.",
  ],
};

export const TEIQUE30: LikertItem[] = Object.entries(TEIQUE_TEXTOS).flatMap(([dim, textos]) =>
  textos.map((texto, i) => ({
    id: `teq_${dim}_${i + 1}`,
    test: "teique30" as const,
    dimension: dim as keyof typeof TEIQUE_TEXTOS,
    texto,
  }))
);

// ---------- VIA-24 · Fortalezas de carácter (1 ítem por cada una de las 24) ----------
const VIA_TEXTOS: Record<string, string> = {
  "Creatividad": "Encuentro formas originales de resolver problemas.",
  "Curiosidad": "Me atraen los temas nuevos aunque no tengan uso inmediato.",
  "Juicio": "Sopeso los datos con cuidado antes de sacar conclusiones.",
  "Amor por aprender": "Disfruto aprendiendo algo nuevo aunque no sea útil de inmediato.",
  "Perspectiva": "La gente me pide consejo porque veo el panorama completo.",
  "Valentía": "Actúo según lo que creo correcto aunque sea impopular.",
  "Perseverancia": "Sigo adelante aunque una tarea se alargue mucho.",
  "Honestidad": "Prefiero decir una verdad incómoda que una mentira cómoda.",
  "Vitalidad": "Afronto el día con energía, no por obligación.",
  "Amor": "Priorizo el vínculo cercano por encima de otras cosas.",
  "Amabilidad": "Ayudo aunque no me lo pidan directamente.",
  "Inteligencia social": "Entiendo rápido qué necesita una situación social.",
  "Trabajo en equipo": "Rindo mejor cuando formo parte de un grupo con un fin común.",
  "Equidad": "Trato a todos con el mismo criterio, sin favoritismos.",
  "Liderazgo": "Organizo con naturalidad a un grupo hacia un objetivo.",
  "Perdón": "Suelo soltar el resentimiento antes que aferrarme a él.",
  "Humildad": "Reconozco mis errores sin necesitar quedar bien.",
  "Prudencia": "Evalúo consecuencias antes de actuar por impulso.",
  "Autorregulación": "Mantengo hábitos aunque no tenga ganas ese día.",
  "Apreciación de la belleza": "Me detengo a apreciar algo bien hecho o bello.",
  "Gratitud": "Noto y agradezco lo bueno, no solo lo que falta.",
  "Esperanza": "Espero un buen resultado incluso en momentos difíciles.",
  "Humor": "Uso el humor para aliviar tensión en momentos duros.",
  "Espiritualidad": "Siento que formo parte de algo más grande que yo mismo.",
};

export const VIA24: LikertItem[] = VIA_FORTALEZAS.map((nombre, i) => ({
  id: `via_${i + 1}`,
  test: "via24" as const,
  dimension: `via_${nombre}` as const,
  texto: VIA_TEXTOS[nombre] ?? `Me identifico con la fortaleza: ${nombre}.`,
}));

export const ALL_ITEMS: LikertItem[] = [
  ...BFI20,
  ...ENEAGRAMA36,
  ...ECR4,
  ...RFQ6,
  ...TEIQUE30,
  ...VIA24,
];

export const SESIONES: Record<"S1" | "S2" | "S3", LikertItem[]> = {
  S1: [...BFI20, ...ENEAGRAMA36, ...ECR4],
  S2: [...RFQ6, ...TEIQUE30],
  S3: [...VIA24],
};
