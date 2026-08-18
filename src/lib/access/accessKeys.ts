import { randomBytes } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type AccessKeyRecord = {
  id: string;
  email: string;
  accessKey: string;
  used: boolean;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
};

/**
 * Fallback en memoria por proceso — mismo patrón que src/lib/billing/store.ts.
 * Se usa mientras Supabase no está configurado (getSupabaseAdmin() === null).
 * Se cuelga de `globalThis` (no un `const` module-level normal) porque este
 * módulo se importa tanto desde Route Handlers (api/access-keys/request)
 * como desde una Server Action (lib/actions/onboarding.ts) — en dev con
 * Turbopack esos dos entrypoints pueden compilarse en bundles separados con
 * su propia instancia del módulo, lo que rompía la validación (la clave se
 * generaba en una instancia del Map y se validaba contra otra, vacía).
 */
const globalKey = "__mindtwin_access_keys_memoria__";
type GlobalWithMemoria = typeof globalThis & { [globalKey]?: Map<string, AccessKeyRecord> };
const g = globalThis as GlobalWithMemoria;
if (!g[globalKey]) g[globalKey] = new Map<string, AccessKeyRecord>();
const memoria = g[globalKey];

/** La clave de acceso profesional es de un solo uso pero NO caduca — es ilimitada en el tiempo. */
function generarClave(): string {
  return randomBytes(16).toString("hex"); // 32 caracteres, igual que access_key VARCHAR(32)
}

/**
 * §1.2 del prompt de backend: el acceso Owner requiere una clave de un solo
 * uso, generada tras validar la credencial profesional. En producción ese
 * paso de validación lo hace Poco2h manualmente antes de emitir la clave;
 * aquí se expone `emitirClaveAcceso` como el paso que ejecuta esa emisión
 * (hoy disparado automáticamente desde la solicitud pública mientras no haya
 * un panel de revisión manual — ver comentario en el endpoint que la llama).
 */
export async function emitirClaveAcceso(email: string): Promise<AccessKeyRecord> {
  const accessKey = generarClave();
  const now = new Date();
  // Sin caducidad real: guardamos una fecha muy lejana para no romper el NOT NULL de expires_at.
  const expiresAt = new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000);
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from("professional_access_keys")
      .insert({ email, access_key: accessKey, expires_at: expiresAt.toISOString() })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return {
      id: data.id,
      email: data.email,
      accessKey: data.access_key,
      used: data.used,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
      usedAt: data.used_at,
    };
  }

  const record: AccessKeyRecord = {
    id: crypto.randomUUID(),
    email,
    accessKey,
    used: false,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    usedAt: null,
  };
  memoria.set(accessKey, record);
  return record;
}

export type ClaveInvalidaReason = "not_found" | "already_used" | "expired" | "email_mismatch";

export type ValidacionClave = { valid: true; recordId: string } | { valid: false; reason: ClaveInvalidaReason };

/**
 * Valida y consume (marca used=true) una clave de acceso. Nunca puede
 * saltarse desde el frontend — se llama server-side dentro de la Server
 * Action que da de alta al Owner (ver src/lib/actions/onboarding.ts).
 */
export async function validarYConsumirClaveAcceso(
  email: string,
  accessKey: string
): Promise<ValidacionClave> {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from("professional_access_keys")
      .select("*")
      .eq("access_key", accessKey)
      .maybeSingle();
    if (error || !data) return { valid: false, reason: "not_found" };
    if (data.email.toLowerCase() !== email.toLowerCase()) return { valid: false, reason: "email_mismatch" };
    if (data.used) return { valid: false, reason: "already_used" };

    const { error: updateError } = await supabase
      .from("professional_access_keys")
      .update({ used: true, used_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("used", false);
    if (updateError) return { valid: false, reason: "already_used" };
    return { valid: true, recordId: data.id };
  }

  const record = memoria.get(accessKey);
  if (!record) return { valid: false, reason: "not_found" };
  if (record.email.toLowerCase() !== email.toLowerCase()) return { valid: false, reason: "email_mismatch" };
  if (record.used) return { valid: false, reason: "already_used" };

  record.used = true;
  record.usedAt = new Date().toISOString();
  memoria.set(accessKey, record);
  return { valid: true, recordId: record.id };
}

export function mensajeError(reason: ClaveInvalidaReason): string {
  switch (reason) {
    case "not_found":
      return "Clave de acceso no reconocida.";
    case "already_used":
      return "Esta clave de acceso ya ha sido utilizada.";
    case "email_mismatch":
      return "Esta clave de acceso no corresponde a este email.";
    default:
      return "Clave de acceso inválida.";
  }
}
