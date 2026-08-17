import type { EgoId } from "./types";
import type { Filosofo } from "./talesWeights";

/**
 * Contenido literal de la referencia "Mindtwins · Mi Cerebro · Owner"
 * (fabulous-gumdrop-ebda96.netlify.app) — descripción fija por lente +
 * generador de "en tu caso" personalizado a partir del EGO ID real.
 */
export const TALES_INFO: Record<Filosofo, { icon: string; titulo: string; subtitulo: string; descripcion: string }> = {
  "Platón": { icon: "🔮", titulo: "Platón — El mundo de las ideas", subtitulo: "Busca el significado profundo detrás de cada cosa", descripcion: "Platón creía que la realidad visible es solo una sombra de algo más verdadero. Tu twin usa esta lente para ir siempre más allá de lo literal: busca el patrón y el significado último detrás de lo que describes." },
  "Heráclito": { icon: "🌊", titulo: "Heráclito — El río que cambia", subtitulo: "Acepta la emoción y la transformación como parte de la vida", descripcion: "Todo fluye, todo cambia. Tu twin usa esta lente para no resistir los cambios de estado emocional, sino para acogerlos como información válida." },
  "Sócrates": { icon: "🪞", titulo: "Sócrates — El oráculo interior", subtitulo: "Invita a la reflexión honesta y al autoconocimiento profundo", descripcion: "Sócrates no daba respuestas — hacía preguntas. Tu twin hereda esto: prefiere preguntarte que decirte, porque el conocimiento genuino ya está dentro de ti." },
  "Epicuro": { icon: "💫", titulo: "Epicuro — La vida que merece vivirse", subtitulo: "Encuentra sentido y disfrute en lo que realmente importa", descripcion: "La buena vida está en las cosas simples elegidas con conciencia. Tu twin usa esta lente para recordarte que el sentido no siempre está en lo grandioso." },
  "Aristóteles": { icon: "⚖️", titulo: "Aristóteles — La excelencia práctica", subtitulo: "Orienta hacia el equilibrio, la virtud y la acción concreta", descripcion: "Aristóteles creía en la virtud como hábito y en traducir los ideales en acción. Tu twin usa esta lente para anclar tus ideas abstractas en lo posible." },
  "Séneca": { icon: "🛡️", titulo: "Séneca — La fortaleza interior", subtitulo: "Construye resiliencia y da perspectiva al sufrimiento", descripcion: "Sus cartas hablan de cómo mantener la calma interior cuando el mundo exterior no se puede controlar. Tu twin usa esta lente para darte perspectiva cuando el presente se siente abrumador." },
  "Demócrito": { icon: "⚡", titulo: "Demócrito — El orden invisible", subtitulo: "Explora los patrones ocultos que explican cómo funcionan las cosas", descripcion: "Fue el primero en proponer que todo está hecho de átomos invisibles. Su método era la curiosidad radical: buscar las reglas que no se ven a simple vista." },
  "Gorgias": { icon: "🎙️", titulo: "Gorgias — El poder de las palabras", subtitulo: "Siempre activo · Persuasión, narrativa y belleza del lenguaje", descripcion: "Gorgias creía que el lenguaje no describe la realidad, sino que la crea. Tu twin cuida no solo qué dice, sino cómo lo dice — la forma es tan importante como el fondo." },
  "Homero": { icon: "⚓", titulo: "Homero — El viaje que da sentido", subtitulo: "Siempre activo · Enmarca la vida como una historia épica", descripcion: "La Odisea es un mapa de la condición humana: obstáculos, pérdidas, momentos de gloria. Tu twin pone los momentos difíciles en perspectiva narrativa: forman parte del arco." },
  "Kant": { icon: "🕯️", titulo: "Kant — La consciencia ética universal", subtitulo: "No derivado del EGO ID · Siempre presente · No se puede desactivar", descripcion: "Kant actúa como filtro de fondo en todas tus conversaciones. No impone — planta semillas. Introduce sutilmente la perspectiva del impacto colectivo cuando hay carga ética, y la dimensión ambiental cuando el contexto lo permite: una frase, no un sermón." },
};

/** "En tu caso" — personalizado a partir del EGO ID real, mismo estilo que la referencia. */
export function enTuCaso(filosofo: Filosofo, ego: EgoId): string {
  switch (filosofo) {
    case "Platón":
      return `Con apertura mental ${ego.big_five.O}/100, tu twin sabe que no te conformas con respuestas superficiales.`;
    case "Heráclito":
      return `Tu neuroticismo ${ego.big_five.N}/100 y apego ${ego.apego} activan esta lente cuando cambia tu estado emocional. Tu twin nunca te pedirá que "te calmes".`;
    case "Sócrates":
      return `Tu perfil VIA (${ego.via_top5[0]}) activa a Sócrates. Cuando te sientas bloqueado, tu twin prefiere ayudarte a descubrirlo tú mismo.`;
    case "Epicuro":
      return `Con foco ${ego.rfq === "promocion" ? "de logro" : "de seguridad"}, Epicuro te ayuda a ver lo que ya está ahí, no solo lo que falta.`;
    case "Aristóteles":
      return `Con responsabilidad ${ego.big_five.C}/100, Aristóteles equilibra tus ideas con acción concreta.`;
    case "Séneca":
      return `Con neuroticismo ${ego.big_five.N}/100, Séneca te da perspectiva cuando el presente se siente abrumador.`;
    case "Demócrito":
      return `Tu tipo ${ego.eneagrama.tipo} conecta de forma natural con la curiosidad de Demócrito por el mecanismo real de las cosas.`;
    case "Gorgias":
      return "Gorgias capturó tu huella lingüística en la Sesión 3 — la estructura de tus frases, tu vocabulario, tu ritmo. Es la base del clon de voz.";
    case "Homero":
      return "Cuando sientas que estás en un capítulo difícil, Homero te recuerda que siempre hay un destino al otro lado.";
    case "Kant":
      return "Kant acompaña cada conversación como conciencia de fondo — nunca interrumpe, nunca moraliza.";
  }
}
