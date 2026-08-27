/**
 * Cliente mínimo de la API de Zernio (https://zernio.com) para el envío real
 * de WhatsApp en los recordatorios de Mis Hábitos › Alertas. Confirmado vía
 * su OpenAPI público (zernio.com/openapi.json) que soporta envío en frío por
 * plantilla (obligatorio en WhatsApp fuera de una conversación abierta de
 * 24h) a través de Broadcasts + WhatsApp Templates — incluye plantillas de
 * biblioteca de Meta pre-aprobadas (sin esperar revisión).
 *
 * Requiere ZERNIO_API_KEY en el entorno y una cuenta de WhatsApp ya
 * conectada al perfil de Zernio (vía su dashboard, embedded signup, o
 * credenciales de Meta Business). Sin la key configurada o sin cuenta
 * conectada, todas las funciones devuelven un resultado "no disponible" en
 * vez de lanzar — igual que el resto de integraciones opcionales de la app
 * (HeyGen, Terra...).
 */

const ZERNIO_BASE = "https://zernio.com/api/v1";
const NOMBRE_PLANTILLA = "recordatorio_habito_mindtwin";
const IDIOMA_PLANTILLA = "es";

type ZernioResultado<T> = { ok: true; data: T } | { ok: false; motivo: string };

async function zernioFetch<T = unknown>(path: string, init?: RequestInit): Promise<ZernioResultado<T>> {
  const apiKey = process.env.ZERNIO_API_KEY;
  if (!apiKey) return { ok: false, motivo: "ZERNIO_API_KEY no configurada" };
  try {
    const res = await fetch(`${ZERNIO_BASE}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
      signal: AbortSignal.timeout(15000),
    });
    const texto = await res.text();
    const data = texto ? JSON.parse(texto) : null;
    if (!res.ok) return { ok: false, motivo: data?.error ?? `HTTP ${res.status}` };
    return { ok: true, data: data as T };
  } catch (e) {
    return { ok: false, motivo: e instanceof Error ? e.message : "error de red" };
  }
}

type CuentaZernioRaw = { _id: string; profileId?: { _id: string } | string; platform: string; isActive: boolean };
type CuentaZernio = { accountId: string; profileId?: string; platform: string; isActive: boolean };

/** Localiza la primera cuenta de WhatsApp activa conectada al workspace de Zernio. */
export async function cuentaWhatsappActiva(): Promise<ZernioResultado<CuentaZernio>> {
  const r = await zernioFetch<{ accounts?: CuentaZernioRaw[] }>("/accounts?platform=whatsapp&status=connected");
  if (!r.ok) return r;
  const cuenta = (r.data.accounts ?? []).find((a) => a.isActive);
  if (!cuenta) return { ok: false, motivo: "No hay ninguna cuenta de WhatsApp conectada en Zernio" };
  const profileId = typeof cuenta.profileId === "string" ? cuenta.profileId : cuenta.profileId?._id;
  return { ok: true, data: { accountId: cuenta._id, profileId, platform: cuenta.platform, isActive: cuenta.isActive } };
}

type PlantillaZernio = { name: string; status: "APPROVED" | "PENDING" | "REJECTED" };

/**
 * Asegura que existe la plantilla de recordatorio, creándola si falta.
 * Solo devuelve "lista para usar" cuando Meta la ha aprobado — una plantilla
 * recién creada (custom) queda PENDING hasta la revisión de Meta (horas).
 */
export async function asegurarPlantillaRecordatorio(accountId: string): Promise<ZernioResultado<PlantillaZernio>> {
  const lista = await zernioFetch<{ templates?: PlantillaZernio[] }>(`/whatsapp/templates?accountId=${encodeURIComponent(accountId)}`);
  if (lista.ok) {
    const existente = lista.data.templates?.find((t) => t.name === NOMBRE_PLANTILLA);
    if (existente) return { ok: true, data: existente };
  }

  const creada = await zernioFetch<{ template?: PlantillaZernio }>("/whatsapp/templates", {
    method: "POST",
    body: JSON.stringify({
      accountId,
      name: NOMBRE_PLANTILLA,
      category: "UTILITY",
      language: IDIOMA_PLANTILLA === "es" ? "es" : "en_US",
      components: [
        { type: "body", text: "Recordatorio de MindTwin: {{1}}. Es buen momento para retomarlo.", example: { body_text: [["Respiración matutina"]] } },
      ],
    }),
  });
  if (!creada.ok) return creada;
  if (!creada.data.template) return { ok: false, motivo: "Zernio no devolvió la plantilla creada" };
  return { ok: true, data: creada.data.template };
}

/** Envía un recordatorio a un número concreto vía un broadcast Zernio de un solo destinatario. */
export async function enviarRecordatorioWhatsapp(params: {
  telefono: string;
  habito: string;
}): Promise<ZernioResultado<{ enviado: true }>> {
  const cuenta = await cuentaWhatsappActiva();
  if (!cuenta.ok) return cuenta;

  const plantilla = await asegurarPlantillaRecordatorio(cuenta.data.accountId);
  if (!plantilla.ok) return plantilla;
  if (plantilla.data.status !== "APPROVED") {
    return { ok: false, motivo: `Plantilla "${NOMBRE_PLANTILLA}" todavía no aprobada por Meta (estado: ${plantilla.data.status})` };
  }

  const profileId = cuenta.data.profileId;
  if (!profileId) return { ok: false, motivo: "La cuenta de WhatsApp de Zernio no tiene profileId asociado" };

  const crear = await zernioFetch<{ broadcast?: { id: string } }>("/broadcasts", {
    method: "POST",
    body: JSON.stringify({
      profileId,
      accountId: cuenta.data.accountId,
      platform: "whatsapp",
      name: `Recordatorio ${params.habito} · ${new Date().toISOString()}`,
      template: {
        name: NOMBRE_PLANTILLA,
        language: IDIOMA_PLANTILLA,
        variableMapping: {
          "1": { field: "custom", customValue: params.habito },
        },
      },
    }),
  });
  if (!crear.ok) return crear;
  const broadcastId = crear.data.broadcast?.id;
  if (!broadcastId) return { ok: false, motivo: "Zernio no devolvió el id del broadcast" };

  const recipiente = await zernioFetch(`/broadcasts/${encodeURIComponent(broadcastId)}/recipients`, {
    method: "POST",
    body: JSON.stringify({ phones: [params.telefono] }),
  });
  if (!recipiente.ok) return recipiente;

  const envio = await zernioFetch<{ status: string }>(`/broadcasts/${encodeURIComponent(broadcastId)}/send`, { method: "POST" });
  if (!envio.ok) return envio;

  return { ok: true, data: { enviado: true } };
}
