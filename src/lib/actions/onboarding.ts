"use server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { enviarEmail } from "@/lib/email/send";
import { validarYConsumirClaveAcceso, mensajeError } from "@/lib/access/accessKeys";

export type ActionResult =
  | { ok: true; simulated: boolean; ownerId?: string; email?: string }
  | { ok: false; error: string };

/**
 * Alta Owner tras pulsar "Contratar" (V10 §8.1): plan + precio al follower +
 * datos de facturación + Stripe. Crea el registro en `owners`, envía el
 * email de bienvenida con el aviso de magic link y arranca el roadmap S1-S4.
 * Sin Supabase/Resend configurados aún, simula ambos pasos para poder
 * verificar el flujo end-to-end en desarrollo.
 *
 * §1.2 (regla de seguridad obligatoria): nadie puede activarse como Owner
 * sin una clave de acceso profesional válida, de un solo uso. Esta
 * validación es server-side y no se puede saltar desde el frontend — un
 * intento sin clave válida devuelve error aquí, nunca crea el owner.
 */
export async function contratarOwner(formData: FormData): Promise<ActionResult> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const especialidad = String(formData.get("especialidad") ?? "").trim();
  const nif = String(formData.get("nif") ?? "").trim();
  const direccionFacturacion = String(formData.get("direccionFacturacion") ?? "").trim();
  const stripeConectado = formData.get("stripeConectado") === "true";
  const claveAcceso = String(formData.get("claveAcceso") ?? "").trim();

  if (!nombre || !email || !especialidad || !nif || !direccionFacturacion) {
    return { ok: false, error: "Faltan campos obligatorios (incluye datos de facturación)." };
  }
  if (!claveAcceso) {
    return { ok: false, error: "Falta la clave de acceso profesional. Solicítala antes de activar tu cuenta." };
  }

  const validacion = await validarYConsumirClaveAcceso(email, claveAcceso);
  if (!validacion.valid) {
    return { ok: false, error: mensajeError(validacion.reason) };
  }

  const supabase = getSupabaseAdmin();
  let simulated = true;
  let ownerId: string | undefined;

  if (supabase) {
    const { data, error } = await supabase
      .from("owners")
      .insert({
        name: nombre,
        email,
        especialidad,
        nif,
        direccion_facturacion: direccionFacturacion,
        stripe_conectado: stripeConectado,
        precio_follower_texto_min: 0,
        margen_profesional_pct: 0,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    simulated = false;
    ownerId = data.id;
  } else {
    console.warn("[MindTwin] Supabase no configurado — alta Owner simulada:", {
      nombre, email, especialidad, nif, direccionFacturacion, stripeConectado,
    });
  }

  await enviarEmail({
    to: email,
    subject: "Bienvenido a Mindtwins · Lili Fit — tu magic link de acceso",
    html: `<p>Hola ${nombre},</p><p>Tu alta como profesional está lista. Accede desde <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}/login">este enlace de acceso sin contraseña</a>.</p><p>Roadmap: Semana 1 crea tu perfil (EGO ID + voz) · Semana 2 invita a tus clientes · Semana 3 tu primer vídeo · Semana 4 optimiza tu dashboard.</p>`,
  });

  return { ok: true, simulated, ownerId, email };
}

/**
 * Contacto Follower → Owner (V10 §8.2): guarda la solicitud y envía email
 * al profesional (con el contacto) y al cliente (con la referencia de que
 * el profesional le responderá con tarifas + link de pago — Lili Fit nunca
 * muestra esas tarifas en la landing pública).
 */
export async function contactarProfesional(
  slug: string,
  formData: FormData
): Promise<ActionResult> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const mensaje = String(formData.get("mensaje") ?? "").trim();

  if (!nombre || !email) {
    return { ok: false, error: "Faltan campos obligatorios." };
  }

  const supabase = getSupabaseAdmin();
  let simulated = true;

  if (supabase) {
    const { error } = await supabase.from("contact_requests").insert({
      owner_slug: slug,
      follower_name: nombre,
      follower_email: email,
      message: mensaje,
    });
    if (error) return { ok: false, error: error.message };
    simulated = false;
  } else {
    console.warn("[MindTwin] Supabase no configurado — contacto simulado:", { slug, nombre, email, mensaje });
  }

  await enviarEmail({
    to: email,
    subject: "Hemos avisado a tu profesional",
    html: `<p>Hola ${nombre},</p><p>Le hemos avisado. Te responderá directamente con sus tarifas y un link de pago — Lili Fit no fija ni muestra esos precios.</p>`,
  });

  return { ok: true, simulated };
}
