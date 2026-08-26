import { recetasParaBacterias, nombresABacteriaIds } from "@/lib/recetas/rankear";
import type { Receta as RecetaMicrobioma } from "@/lib/recetas/data";

/**
 * Datos de referencia para Mis Hábitos. La documentación específica de esta
 * sección ("HTML DE MIS HABTIOS.docx") solo contenía rutas locales rotas de
 * otro ordenador — no accesibles. Esta implementación sigue V10 §4.4
 * (pestañas Microbioma/Deportes/Mi School) con datos de demo; ajustar en
 * cuanto lleguen los HTML de referencia reales.
 */

export type Receta = {
  id: string;
  nombre: string;
  bacteriaStrains: string[];
  gutTags: string[];
  descripcion: string;
};

export const RECETAS: Receta[] = [
  { id: "r1", nombre: "Bowl de avena con kéfir y arándanos", bacteriaStrains: ["Bifidobacterium"], gutTags: ["lacteos_ok", "energia"], descripcion: "Fermentados + fibra soluble para regular tránsito." },
  { id: "r2", nombre: "Salmón al horno con brócoli al vapor", bacteriaStrains: ["Akkermansia"], gutTags: ["antiinflamatorio"], descripcion: "Omega-3 + fibra prebiótica, ideal si hay hinchazón frecuente." },
  { id: "r3", nombre: "Crema de calabaza sin lácteos", bacteriaStrains: ["Faecalibacterium"], gutTags: ["lacteos_no"], descripcion: "Alternativa reconfortante para quienes no toleran lácteos." },
];

export type Restaurante = { id: string; nombre: string; ciudad: string; tag: string };

export const RESTAURANTES: Restaurante[] = [
  { id: "re1", nombre: "Verde Menta", ciudad: "Madrid", tag: "Sin gluten" },
  { id: "re2", nombre: "Raíces", ciudad: "Barcelona", tag: "Fermentados" },
  { id: "re3", nombre: "Punto Fibra", ciudad: "Valencia", tag: "Alto en fibra" },
];

/** Deriva la ciudad de una dirección libre ("Calle X, Madrid") comparándola contra las ciudades del catálogo. */
function ciudadDesdeDireccion(direccion: string): string | null {
  const ciudades = [...new Set(RESTAURANTES.map((r) => r.ciudad))];
  return ciudades.find((c) => direccion.toLowerCase().includes(c.toLowerCase())) ?? null;
}

/** Restaurante recomendado — cerca del domicilio si hay match de ciudad, si no el primero del catálogo. */
export function restauranteRecomendado(direccion: string): Restaurante {
  const ciudad = ciudadDesdeDireccion(direccion);
  return (ciudad && RESTAURANTES.find((r) => r.ciudad === ciudad)) || RESTAURANTES[0];
}

const EJERCICIOS = [
  "20 min de caminata a paso ligero",
  "Sesión de fuerza — tren superior",
  "Movilidad + estiramientos 15 min",
  "Sesión de fuerza — tren inferior",
  "Cardio suave 25 min",
  "Descanso activo — paseo corto",
  "Sesión libre a tu ritmo",
];

export type ItemAgenda = {
  dia: string;
  momento: "mañana" | "tarde" | "noche";
  tipo: "microbioma" | "deporte";
  ejercicio: string;
  receta: RecetaMicrobioma | null;
  restaurante: Restaurante | null;
};

/**
 * Fallback determinista de agenda semanal. En producción V10 usa Gemini
 * (cron domingo 22:00, cruzando GUT ID snapshot + EGO ID + hábitos activos) —
 * este fallback se usa si GEMINI_API_KEY no está configurada. Incluye
 * ejercicio + receta (motor bacteria→nutriente→receta) + restaurante
 * recomendado cerca de tu domicilio, para que la agenda sea accionable.
 */
export function generarAgendaFallback(
  bacteriasDeficientes: string[],
  domicilioPersonal?: string
): ItemAgenda[] {
  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const bacteriaIds = nombresABacteriaIds(bacteriasDeficientes);
  const recetasRecomendadas = recetasParaBacterias(bacteriaIds);
  const restaurante = domicilioPersonal ? restauranteRecomendado(domicilioPersonal) : null;

  return dias.map((dia, i) => ({
    dia,
    momento: i % 2 === 0 ? "mañana" : "tarde",
    tipo: i % 3 === 0 ? "deporte" : "microbioma",
    ejercicio: EJERCICIOS[i % EJERCICIOS.length],
    receta: recetasRecomendadas.length > 0 ? recetasRecomendadas[i % recetasRecomendadas.length] : null,
    // Solo se sugiere restaurante los días que se sale a comer fuera (viernes/sábado, deterministamente).
    restaurante: (dia === "Viernes" || dia === "Sábado") ? restaurante : null,
  }));
}

export const MI_SCHOOL = [
  {
    pregunta: "¿Qué es el EGO ID?",
    respuesta: "Tu perfil psicológico completo, calculado con 6 tests validados (Big Five, Eneagrama, apego, foco regulatorio, inteligencia emocional y fortalezas VIA). 100% determinista, sin IA — nunca es una IA \"adivinando\" cómo eres.",
  },
  {
    pregunta: "¿Qué es el GUT ID?",
    respuesta: "Tu perfil de microbioma: bacterias dominantes/deficientes, gatillos digestivos y síntomas, en 7 dimensiones. Se actualiza con tus autoevaluaciones semanales en Mis Hábitos.",
  },
  {
    pregunta: "Mis Conversaciones — ¿qué es y cómo interactúo?",
    respuesta:
      "Es el chat con tu MindTwin, en texto, voz o vídeo. Las 3 primeras veces que entres aquí NO es un chat normal: son tus 3 sesiones de creación de perfil (S1, S2, S3), de unos 20 minutos cada una, donde vas respondiendo con normalidad y el sistema construye tu EGO ID sin que rellenes ningún formulario. Después de esas 3 sesiones, Mis Conversaciones se convierte en tu chat habitual con el MindTwin.\n\n" +
      "· Sesión 1 (S1, ~20 min): Big Five (personalidad), Eneagrama corto y tu estilo de apego. Al terminar, tu twin ya tiene un primer nivel de fidelidad (65-70%).\n" +
      "· Sesión 2 (S2, ~20 min): tu foco regulatorio (si te mueves por metas o por seguridad) y tu inteligencia emocional. Sube la fidelidad al 82%.\n" +
      "· Sesión 3 (S3, ~20-25 min + grabación de voz): tus fortalezas de carácter (VIA) y, si quieres, clonas tu voz real para que el twin pueda hablar contigo. Al terminar, tu MindTwin queda activo para todos tus clientes, con un 87% de fidelidad.",
  },
  {
    pregunta: "Mis Fuentes — ¿qué es y cómo interactúo?",
    respuesta:
      "Es donde conectas redes sociales, email o documentos (Google, Instagram, TikTok, WhatsApp, wearables) para que tu MindTwin aprenda más rápido cómo hablas y piensas realmente, sin que tengas que contárselo tú. Cada fuente que conectas sube tu % de fidelidad. Es opcional y lo haces a tu ritmo, después de terminar tus 3 sesiones.",
  },
  {
    pregunta: "Mi Cerebro — ¿qué es y cómo interactúo?",
    respuesta:
      "Es la radiografía de tu perfil: no se edita aquí, solo se lee. Tiene 2 pestañas: \"Quién soy\" (tu Eneagrama, Big Five, apego, VIA y GUT ID explicados en lenguaje humano) y \"Cómo me interpreta la IA\" (las 10 lentes filosóficas que usa tu twin para responder, con el peso de cada una). Sirve para que veas exactamente cómo te representa tu gemelo digital.",
  },
  {
    pregunta: "Mis Hábitos — ¿qué es y cómo interactúo?",
    respuesta:
      "Aquí rellenas tu autoevaluación semanal (cómo has dormido, tu energía, tu ánimo) y ves tu agenda: qué ejercicio te toca, qué debes comer y a qué restaurante ir si sales fuera. Cada autoevaluación recalibra tu GUT ID y tu agenda de la semana siguiente.",
  },
  {
    pregunta: "Mis Vídeos — ¿qué es y cómo interactúo?",
    respuesta:
      "Genera vídeos con tu avatar digital para redes sociales. Escribes lo que quieres que diga tu MindTwin y el sistema clona tu voz y anima tu imagen automáticamente — no grabas nada tú. Puedes elegir hablar a cámara (V1), aparecer en movimiento/acción (V2), o combinar ambos.",
  },
  {
    pregunta: "Mis Clientes — ¿qué es y cómo interactúo?",
    respuesta:
      "Tu panel de seguimiento de clientes: rachas, logros y alertas — nunca el contenido de sus conversaciones ni sus tests psicológicos, eso es privado. Sirve para saber a quién atender antes.",
  },
  {
    pregunta: "Mi Facturación — ¿qué es y cómo interactúo?",
    respuesta: "Aquí ves tus facturas mensuales (licencia + sesiones de tus clientes), su estado de pago y puedes descargarlas. No hace falta que hagas nada — se genera automáticamente cada mes.",
  },
];

/**
 * Hábitos del módulo "Deportes" de Mis Hábitos — diferentes por deporte
 * (no son hábitos de microbioma), igual que la referencia
 * https://stellular-rugelach-d8c19d.netlify.app.
 */
export type HabitoDeporte = { emoji: string; nombre: string; categoria: string };

/** Hábitos activos del módulo Microbiota — misma estructura que la referencia (nombre, categoría, estrellas). */
export const HABITOS_MICROBIOMA: HabitoDeporte[] = [
  { emoji: "🥤", nombre: "Ayuno intermitente 16h", categoria: "Microbiota · Digestivo" },
  { emoji: "🥬", nombre: "Fermentados diarios", categoria: "Microbiota · Probióticos" },
  { emoji: "🐟", nombre: "Omega-3 post-entreno", categoria: "Microbiota · Antiinflamatorio" },
];

export const DEPORTES = [
  "Boxeo",
  "Running",
  "Fuerza",
  "Yoga",
  "Fútbol",
  "Baloncesto",
  "Tenis",
  "Pádel",
  "Natación",
  "Ciclismo",
  "Crossfit",
  "Pilates",
  "Escalada",
  "Artes marciales",
  "Voleibol",
  "Golf",
  "Atletismo",
  "Triatlón",
  "Senderismo",
  "Remo",
  "Esquí",
  "Surf",
  "Baile",
  "Calistenia",
  "HIIT / Funcional",
  "Rugby",
] as const;
export type Deporte = (typeof DEPORTES)[number];

/**
 * Mi School — versión Follower (cliente): explica los conceptos desde su
 * propio punto de vista como cliente del profesional, distinta de MI_SCHOOL
 * (que está escrita desde el punto de vista del Owner construyendo su perfil).
 */
export const MI_SCHOOL_FOLLOWER = [
  {
    pregunta: "¿Qué es el EGO ID?",
    respuesta: "El perfil psicológico completo de tu profesional — cómo piensa, decide y se comunica. Su MindTwin lo usa para responderte igual que lo haría él o ella en persona.",
  },
  {
    pregunta: "¿Qué es el GUT ID?",
    respuesta: "El perfil de microbioma de tu profesional (o el tuyo, si tu plan lo incluye): qué bacterias dominan, cuáles faltan y qué síntomas digestivos son frecuentes. Se usa para personalizar tus recomendaciones.",
  },
  {
    pregunta: "Mis Canales (Texto/Voz/Vídeo) — ¿qué es y cómo interactúo?",
    respuesta: "Es donde hablas con el MindTwin de tu profesional ahora mismo, disponible 24/7. Elige texto, voz o videollamada según lo que te apetezca en cada momento — el twin responde igual en los tres, con su tono y su metodología, no genéricas.",
  },
  {
    pregunta: "Mis Conversaciones — ¿qué es y cómo interactúo?",
    respuesta: "Es el historial de tus charlas anteriores con el MindTwin: fecha, canal usado y duración. Sirve para repasar lo que hablasteis — para empezar una charla nueva, usa Mis Canales.",
  },
  {
    pregunta: "Mis Fuentes — ¿qué es y cómo interactúo?",
    respuesta: "Aquí ves qué fuentes ha conectado tu profesional para entrenar su MindTwin (redes sociales, documentos, etc.) — te da transparencia sobre de dónde saca su forma de responder.",
  },
  {
    pregunta: "Mi Cerebro — ¿qué es y cómo interactúo?",
    respuesta: "Es la radiografía del perfil de tu profesional: su Eneagrama, Big Five, apego y fortalezas explicados en lenguaje humano, y las lentes que usa la IA para responderte como él o ella lo haría. Solo lectura, no se edita.",
  },
  {
    pregunta: "Mis Hábitos — ¿qué es y cómo interactúo?",
    respuesta: "Aquí rellenas tu autoevaluación (cómo has dormido, tu energía, tu ánimo) y ves los hábitos que tu profesional recomienda para tu perfil y tu deporte.",
  },
];

export const HABITOS_POR_DEPORTE: Record<Deporte, HabitoDeporte[]> = {
  Boxeo: [
    { emoji: "🥊", nombre: "Técnica de golpeo · 45 min", categoria: "Boxeo · Técnica" },
    { emoji: "🏃", nombre: "Road work · 5km", categoria: "Boxeo · Resistencia" },
    { emoji: "🧘", nombre: "Recuperación activa", categoria: "Boxeo · Recuperación" },
  ],
  Running: [
    { emoji: "🏃", nombre: "Rodaje suave · 8km", categoria: "Running · Base aeróbica" },
    { emoji: "⚡", nombre: "Series 400m ×8", categoria: "Running · Velocidad" },
    { emoji: "🦵", nombre: "Fuerza de tren inferior", categoria: "Running · Prevención lesiones" },
  ],
  Fuerza: [
    { emoji: "🏋️", nombre: "Sentadilla + peso muerto", categoria: "Fuerza · Tren inferior" },
    { emoji: "💪", nombre: "Empuje: press banca/militar", categoria: "Fuerza · Tren superior" },
    { emoji: "🔄", nombre: "Movilidad y calentamiento", categoria: "Fuerza · Prevención" },
  ],
  Yoga: [
    { emoji: "🧘", nombre: "Vinyasa flow · 45 min", categoria: "Yoga · Movilidad" },
    { emoji: "🌬️", nombre: "Pranayama / respiración", categoria: "Yoga · Recuperación" },
    { emoji: "🧠", nombre: "Meditación guiada", categoria: "Yoga · Mente" },
  ],
  "Fútbol": [
    { emoji: "⚽", nombre: "Técnica de control y pase", categoria: "Fútbol · Técnica" },
    { emoji: "🏃", nombre: "Trabajo de resistencia intermitente", categoria: "Fútbol · Físico" },
    { emoji: "🦵", nombre: "Fuerza y prevención de isquios", categoria: "Fútbol · Prevención lesiones" },
  ],
  Baloncesto: [
    { emoji: "🏀", nombre: "Tiro y manejo de balón", categoria: "Baloncesto · Técnica" },
    { emoji: "🤾", nombre: "Pliometría / salto", categoria: "Baloncesto · Potencia" },
    { emoji: "🦶", nombre: "Estabilidad de tobillo", categoria: "Baloncesto · Prevención lesiones" },
  ],
  Tenis: [
    { emoji: "🎾", nombre: "Golpe de fondo y saque", categoria: "Tenis · Técnica" },
    { emoji: "🔄", nombre: "Trabajo de rotación de tronco", categoria: "Tenis · Potencia" },
    { emoji: "🦿", nombre: "Agilidad lateral", categoria: "Tenis · Movilidad" },
  ],
  "Pádel": [
    { emoji: "🎾", nombre: "Volea y bandeja", categoria: "Pádel · Técnica" },
    { emoji: "🧠", nombre: "Lectura de juego / posicionamiento", categoria: "Pádel · Táctica" },
    { emoji: "💪", nombre: "Fuerza de hombro y muñeca", categoria: "Pádel · Prevención lesiones" },
  ],
  "Natación": [
    { emoji: "🏊", nombre: "Técnica de crol · series", categoria: "Natación · Técnica" },
    { emoji: "🌬️", nombre: "Trabajo de respiración", categoria: "Natación · Resistencia" },
    { emoji: "💪", nombre: "Fuerza de tren superior en seco", categoria: "Natación · Fuerza" },
  ],
  Ciclismo: [
    { emoji: "🚴", nombre: "Rodaje base · Z2", categoria: "Ciclismo · Base aeróbica" },
    { emoji: "⚡", nombre: "Series de umbral", categoria: "Ciclismo · Rendimiento" },
    { emoji: "🦵", nombre: "Fuerza de piernas fuera de bici", categoria: "Ciclismo · Fuerza" },
  ],
  Crossfit: [
    { emoji: "🏋️", nombre: "WOD del día", categoria: "Crossfit · Metabólico" },
    { emoji: "🤸", nombre: "Técnica de levantamientos olímpicos", categoria: "Crossfit · Técnica" },
    { emoji: "🔄", nombre: "Movilidad articular", categoria: "Crossfit · Prevención" },
  ],
  Pilates: [
    { emoji: "🧘", nombre: "Core y control postural", categoria: "Pilates · Centro" },
    { emoji: "🔄", nombre: "Movilidad de columna", categoria: "Pilates · Movilidad" },
    { emoji: "🌬️", nombre: "Respiración y control", categoria: "Pilates · Mente-cuerpo" },
  ],
  Escalada: [
    { emoji: "🧗", nombre: "Bloque / técnica de pies", categoria: "Escalada · Técnica" },
    { emoji: "💪", nombre: "Fuerza de dedos y antebrazo", categoria: "Escalada · Fuerza" },
    { emoji: "🔄", nombre: "Movilidad de hombro y cadera", categoria: "Escalada · Prevención" },
  ],
  "Artes marciales": [
    { emoji: "🥋", nombre: "Técnica de golpeo/agarre", categoria: "Artes marciales · Técnica" },
    { emoji: "🤼", nombre: "Sparring / randori controlado", categoria: "Artes marciales · Aplicación" },
    { emoji: "🧘", nombre: "Movilidad y recuperación", categoria: "Artes marciales · Recuperación" },
  ],
  Voleibol: [
    { emoji: "🏐", nombre: "Remate y colocación", categoria: "Voleibol · Técnica" },
    { emoji: "🤾", nombre: "Salto y potencia de tren inferior", categoria: "Voleibol · Potencia" },
    { emoji: "🦶", nombre: "Prevención de tobillo y hombro", categoria: "Voleibol · Prevención lesiones" },
  ],
  Golf: [
    { emoji: "⛳", nombre: "Swing y putt", categoria: "Golf · Técnica" },
    { emoji: "🔄", nombre: "Rotación de tronco y cadera", categoria: "Golf · Movilidad" },
    { emoji: "💪", nombre: "Estabilidad de core", categoria: "Golf · Fuerza" },
  ],
  "Atletismo": [
    { emoji: "🏃", nombre: "Series según prueba (velocidad/fondo)", categoria: "Atletismo · Rendimiento" },
    { emoji: "⚡", nombre: "Técnica de carrera", categoria: "Atletismo · Técnica" },
    { emoji: "🦵", nombre: "Fuerza y prevención de lesiones", categoria: "Atletismo · Prevención" },
  ],
  "Triatlón": [
    { emoji: "🏊", nombre: "Sesión de natación", categoria: "Triatlón · Natación" },
    { emoji: "🚴", nombre: "Sesión de bici", categoria: "Triatlón · Ciclismo" },
    { emoji: "🏃", nombre: "Sesión de carrera / brick", categoria: "Triatlón · Running" },
  ],
  Senderismo: [
    { emoji: "🥾", nombre: "Ruta larga · desnivel", categoria: "Senderismo · Resistencia" },
    { emoji: "🦵", nombre: "Fuerza de piernas y core", categoria: "Senderismo · Fuerza" },
    { emoji: "🎒", nombre: "Entrenamiento con carga (mochila)", categoria: "Senderismo · Específico" },
  ],
  Remo: [
    { emoji: "🚣", nombre: "Técnica de remada", categoria: "Remo · Técnica" },
    { emoji: "⚡", nombre: "Series de umbral en ergómetro", categoria: "Remo · Rendimiento" },
    { emoji: "💪", nombre: "Fuerza de tirón (espalda/piernas)", categoria: "Remo · Fuerza" },
  ],
  "Esquí": [
    { emoji: "⛷️", nombre: "Técnica de curva y equilibrio", categoria: "Esquí · Técnica" },
    { emoji: "🦵", nombre: "Fuerza de piernas (sentadilla isométrica)", categoria: "Esquí · Preparación física" },
    { emoji: "🔄", nombre: "Propiocepción y equilibrio", categoria: "Esquí · Prevención lesiones" },
  ],
  Surf: [
    { emoji: "🏄", nombre: "Remada y pop-up", categoria: "Surf · Técnica" },
    { emoji: "💪", nombre: "Fuerza de hombro y core", categoria: "Surf · Fuerza" },
    { emoji: "🔄", nombre: "Movilidad de cadera y tobillo", categoria: "Surf · Movilidad" },
  ],
  Baile: [
    { emoji: "💃", nombre: "Coreografía / técnica", categoria: "Baile · Técnica" },
    { emoji: "🔄", nombre: "Movilidad y flexibilidad", categoria: "Baile · Movilidad" },
    { emoji: "🫀", nombre: "Resistencia cardiovascular", categoria: "Baile · Resistencia" },
  ],
  Calistenia: [
    { emoji: "💪", nombre: "Dominadas y fondos", categoria: "Calistenia · Fuerza" },
    { emoji: "🤸", nombre: "Progresiones (muscle-up, plancha)", categoria: "Calistenia · Técnica" },
    { emoji: "🔄", nombre: "Movilidad de hombro", categoria: "Calistenia · Prevención" },
  ],
  "HIIT / Funcional": [
    { emoji: "⚡", nombre: "Circuito de alta intensidad", categoria: "HIIT · Metabólico" },
    { emoji: "🏋️", nombre: "Patrones funcionales (empuje/tirón/bisagra)", categoria: "HIIT · Fuerza funcional" },
    { emoji: "🧘", nombre: "Movilidad post-entreno", categoria: "HIIT · Recuperación" },
  ],
  Rugby: [
    { emoji: "🏉", nombre: "Placaje y contacto", categoria: "Rugby · Técnica" },
    { emoji: "🏋️", nombre: "Fuerza y potencia general", categoria: "Rugby · Físico" },
    { emoji: "🏃", nombre: "Resistencia intermitente", categoria: "Rugby · Resistencia" },
  ],
};
