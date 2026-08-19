import { randomBytes } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { enviarEmail } from "@/lib/email/send";

/**
 * Gate ligero de acceso a la landing pública /profesionales (pedido por
 * lili-fit.vercel.app: "Ver más profesionales" no debe poder verse sin
 * haber iniciado sesión, aunque hoy esa landing ya no muestra tarifas).
 * No es el alta de Owner (eso sigue siendo /profesionales/contratar +
 * clave de acceso profesional, ver src/lib/access/accessKeys.ts) — es solo
 * una cuenta de "visitante" con email+contraseña para pasar el gate.
 */
function generarPasswordTemporal(): string {
  return randomBytes(9).toString("base64url"); // ~12 caracteres, url-safe
}

export type AltaVisitanteResultado =
  | { ok: true; simulado: boolean; passwordSimulada?: string }
  | { ok: false; error: string };

export async function altaVisitanteProfesional(email: string): Promise<AltaVisitanteResultado> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { ok: false, error: "Supabase no está configurado en este entorno." };
  }

  const password = generarPasswordTemporal();
  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    // Ya existe cuenta con ese email — no es un fallo, el visitante debe usar "¿Olvidaste tu contraseña?".
    if (error.message.toLowerCase().includes("already been registered") || error.status === 422) {
      return { ok: false, error: "Ya existe una cuenta con ese email. Usa el login o restablece tu contraseña." };
    }
    return { ok: false, error: error.message };
  }

  const envio = await enviarEmail({
    to: email,
    subject: "Tu acceso a MindTwin para profesionales",
    html: `<p>Hola,</p><p>Te hemos creado un acceso para ver la zona de profesionales de MindTwin.</p><p>Email: ${email}<br/>Contraseña temporal: <b>${password}</b></p><p>Puedes cambiarla después de entrar, en "Mi cuenta".</p>`,
  });

  return { ok: true, simulado: envio.simulado, passwordSimulada: envio.simulado ? password : undefined };
}
