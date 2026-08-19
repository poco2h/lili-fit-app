import { NextRequest, NextResponse } from "next/server";
import { getSupabaseMiddlewareClient } from "@/lib/supabase/middlewareClient";

/**
 * Guard de sesión para /app/* (V10 §8.1/§12: Supabase Auth, magic link,
 * sin contraseña) — DESACTIVADO TEMPORALMENTE.
 *
 * Fase actual: Supabase ya está conectado (owners, contact_requests), pero
 * las pantallas del app interior (Mis Fuentes, Mi Cerebro, Mis Hábitos...)
 * todavía leen su estado de localStorage, no del owner autenticado. Forzar
 * login aquí solo bloqueaba el acceso sin atar ningún dato real a esa
 * sesión — Luis (y cualquiera probando la demo) se quedaba fuera sin poder
 * entrar. Se reactivará en cuanto el app interior lea/escriba por
 * owner_id real en vez de localStorage (ver tarea de migración a Supabase).
 *
 * Guard de /profesionales (marketing pública): SÍ activo — pedido para que
 * el acceso desde "Ver más profesionales" (lili-fit.vercel.app) exija login
 * (email+contraseña asignada por el sistema, ver /profesionales/acceso),
 * en vez de quedar abierta a cualquier visitante anónimo.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/profesionales") {
    const response = NextResponse.next();
    const supabase = getSupabaseMiddlewareClient(request, response);
    if (!supabase) return response; // Supabase no configurado: no bloquear.

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/profesionales/acceso";
      url.searchParams.set("redirect", "/profesionales");
      return NextResponse.redirect(url);
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/profesionales"],
};
