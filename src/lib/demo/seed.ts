import type { EgoId } from "@/lib/ego/types";
import { calcularTalesWeights } from "@/lib/ego/talesWeights";
import { guardarDemoTwin, type DemoTwin } from "@/lib/demo/localTwin";
import { guardarMarcas } from "@/lib/demo/marcas";
import type { Marca } from "@/lib/marcas/types";

/**
 * Perfil de ejemplo — mismo formato compacto que usa V10 §2 como ilustración
 * ("T4w5 / O-hi C-mi E-lo A-hi N-mi / ansioso / FP / IE-72 / [...]"), para
 * que "rellenar con datos de ejemplo" muestre algo reconocible y no un
 * perfil aleatorio sin sentido.
 */
const EGO_EJEMPLO: EgoId = {
  big_five: { O: 82, C: 55, E: 28, A: 78, N: 48 },
  eneagrama: { tipo: 4, ala: 5, scores: { 1: 2.5, 2: 3, 3: 2.8, 4: 4.6, 5: 3.9, 6: 2.4, 7: 2.1, 8: 2.2, 9: 3.1 } },
  apego: "ansioso",
  rfq: "promocion",
  teique: { ie_global: 72, bienestar: 74, autocontrol: 60, emocionalidad: 80, sociabilidad: 74 },
  via_top5: ["Apreciación de la belleza", "Creatividad", "Perspectiva", "Amor", "Amor por aprender"],
  indices: { IR: 58, IA: 64, IEj: 42, IC: 72 },
  serialized:
    "T4w5 / O-hi C-mi E-lo A-hi N-mi / ansioso / FP / IE-72 / [Belleza, Creatividad, Perspectiva, Amor, Aprendizaje]",
};

const MARCAS_EJEMPLO: Array<Omit<Marca, "id">> = [
  {
    nombre: "ProteinaPlus",
    categoria: "suplementos",
    descripcion: "Proteína en polvo de alta calidad.",
    logoUrl: null,
    affiliateLink: "https://example.com/proteinaplus",
    promoCode: "DEMO10",
    activaConversaciones: true,
    comisionPct: 8,
  },
  {
    nombre: "MoveWear",
    categoria: "ropa",
    descripcion: "Ropa técnica de entrenamiento.",
    logoUrl: null,
    affiliateLink: "https://example.com/movewear",
    promoCode: null,
    activaConversaciones: true,
    comisionPct: 5,
  },
];

/**
 * Rellena localStorage con un perfil + fuentes + marcas de ejemplo para
 * poder ver Mis Fuentes / Mi Cerebro / Mis Marcas con datos reales sin
 * rellenar a mano los 90 ítems del onboarding.
 */
export function rellenarConDatosDeEjemplo() {
  const talesWeights = calcularTalesWeights(EGO_EJEMPLO);

  const twin: DemoTwin = {
    ego: EGO_EJEMPLO,
    tales_weights: talesWeights,
    tales_data: talesWeights,
    gut: {
      source: "conversational",
      gut_baseline_score: 78,
      bacterias_dominantes: ["Akkermansia", "Bifidobacterium"],
      bacterias_deficientes: ["Faecalibacterium"],
      gatillos: ["lacteos", "estres_digestivo"],
      sintomas: ["hinchazon"],
      n1_connected: false,
      n1_user_id: null,
      last_updated: new Date().toISOString(),
    },
    sources: { google: true, instagram: true, tiktok: false, whatsapp: true, wearables: false },
    sesion_actual: "completo",
    direcciones: { domicilioPersonal: "Calle Alcalá 120, Madrid", domicilioProfesional: "Paseo de la Castellana 45, Madrid" },
  };

  guardarDemoTwin(twin);
  guardarMarcas(MARCAS_EJEMPLO.map((m) => ({ ...m, id: crypto.randomUUID() })));
}
