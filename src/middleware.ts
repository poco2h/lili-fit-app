import { NextRequest, NextResponse } from "next/server";

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
 */
export async function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
