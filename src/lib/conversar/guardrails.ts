export type Role = "owner" | "follower";

/**
 * Gap detectado en la documentación V10/DOC1-7: ningún documento especificaba
 * una regla de "el follower nunca debe hablar de precios" — la añadimos aquí
 * como restricción explícita y auditable, no delegada al LLM.
 *
 * Se aplica en dos puntos: (1) antes de generar respuesta, para desviar la
 * pregunta sin pasar por N3; (2) después de generar respuesta (n3 o cache),
 * como red de seguridad por si una respuesta cacheada quedara obsoleta.
 */
const PRICE_PATTERN =
  /\b(precio|precios|tarifa|tarifas|cu[aá]nto (cuesta|cobra|vale)|cobras?|cost[ea]s?|€|euros?)\b/i;

export function esPreguntaDePrecio(mensaje: string): boolean {
  return PRICE_PATTERN.test(mensaje);
}

export function respuestaBloqueadaPorPrecio(ownerName: string): string {
  return (
    `Eso es algo que solo puede confirmarte ${ownerName} directamente — yo no tengo acceso ` +
    `a sus tarifas ni puedo hablar de precios. Si quieres, te ayudo con cualquier otra duda ` +
    `sobre tu plan o tu progreso.`
  );
}

/**
 * Red de seguridad post-generación: si por lo que sea la respuesta (cache o LLM)
 * contuviese referencias a precio, se sustituye antes de mostrarla al follower.
 */
export function aplicaGuardrailPrecio(
  role: Role,
  mensajeUsuario: string,
  respuestaGenerada: string,
  ownerName: string
): string {
  if (role !== "follower") return respuestaGenerada;
  if (esPreguntaDePrecio(mensajeUsuario) || esPreguntaDePrecio(respuestaGenerada)) {
    return respuestaBloqueadaPorPrecio(ownerName);
  }
  return respuestaGenerada;
}
