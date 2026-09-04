import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * `owners`/`followers` en Supabase exigen UUID real (FK desde
 * follower_minute_wallets, session_billing, etc.), pero el resto del código
 * (billing, conversar) identifica a la gente con ids de texto arbitrarios
 * tipo "demo_owner" — vienen del cliente sin haber pasado por el alta real
 * todavía. Este módulo resuelve ese id de texto a un UUID real de forma
 * idempotente (busca por email determinista; si no existe, lo crea con
 * datos mínimos de relleno) para que el billing pueda persistir en las
 * tablas reales sin tener que reescribir todo el flujo de alta.
 */

function slug(id: string): string {
  return id.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60) || "anon";
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Si al endpoint le llega directamente el UUID real (p.ej. porque
 * end-session lo recuperó de la propia fila de session_billing en vez del
 * id externo original), no hay que volver a resolverlo — se devuelve tal
 * cual. Evita depender de caché en memoria entre invocaciones serverless
 * distintas (start-session y end-session pueden caer en procesos distintos).
 */
export async function resolveOwnerUuid(ownerIdExternal: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  if (UUID_RE.test(ownerIdExternal)) return ownerIdExternal;

  const email = `owner+${slug(ownerIdExternal)}@demo.mindtwin.local`;
  const { data: existing } = await supabase.from("owners").select("id").eq("email", email).maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("owners")
    .insert({
      name: ownerIdExternal,
      email,
      especialidad: "demo",
      precio_follower_texto_min: 0,
      nif: "DEMO",
      direccion_facturacion: "Demo",
    })
    .select("id")
    .single();
  if (error) throw new Error(`No se pudo resolver owner demo: ${error.message}`);
  return created.id;
}

/**
 * `displayName` es opcional (Visual Coach: el alumno escribe su nombre sin
 * registrarse). Si se pasa y difiere del guardado, se actualiza — así un
 * alumno que cambie de nombre entre sesiones queda con el más reciente.
 *
 * A diferencia de `resolveOwnerUuid`, aquí un `followerIdExternal` con forma
 * de UUID NO implica que la fila ya exista en `followers`: el id local sin
 * registro (`obtenerFollowerLocalId`, `crypto.randomUUID()`) es un UUID
 * válido desde el primer momento, antes de haber tocado la base de datos.
 * Devolverlo tal cual sin comprobar (como hacía antes) dejaba el `follower_id`
 * de billing/eventos apuntando a una fila que nunca se creó — el `UPDATE` de
 * abajo no encontraba nada y no fallaba, así que el bug pasaba en silencio.
 */
export async function resolveFollowerUuid(
  followerIdExternal: string,
  ownerUuid: string,
  displayName?: string
): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  if (UUID_RE.test(followerIdExternal)) {
    const { data: existente } = await supabase.from("followers").select("id").eq("id", followerIdExternal).maybeSingle();
    if (existente) {
      if (displayName) await supabase.from("followers").update({ display_name: displayName }).eq("id", followerIdExternal);
      return followerIdExternal;
    }
    const { data: creado, error } = await supabase
      .from("followers")
      .insert({
        id: followerIdExternal,
        email: `follower+${followerIdExternal}@demo.mindtwin.local`,
        owner_id: ownerUuid,
        display_name: displayName ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(`No se pudo crear follower con id local: ${error.message}`);
    return creado.id;
  }

  const email = `follower+${slug(followerIdExternal)}@demo.mindtwin.local`;
  const { data: existing } = await supabase
    .from("followers")
    .select("id")
    .eq("email", email)
    .eq("owner_id", ownerUuid)
    .maybeSingle();
  if (existing) {
    if (displayName) await supabase.from("followers").update({ display_name: displayName }).eq("id", existing.id);
    return existing.id;
  }

  const { data: created, error } = await supabase
    .from("followers")
    .insert({ email, owner_id: ownerUuid, display_name: displayName ?? null })
    .select("id")
    .single();
  if (error) throw new Error(`No se pudo resolver follower demo: ${error.message}`);
  return created.id;
}
