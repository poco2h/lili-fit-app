import { redirect } from "next/navigation";

/**
 * Retirado 2026-08-28: este cuestionario estático (OnboardingFlow.tsx)
 * escribía sesion_actual="completo" por su cuenta, en paralelo al flujo
 * conversacional real de Mis Conversaciones (engine.ts/onboarding.ts,
 * V10 §5, R1-R6) — quien pasaba por aquí quedaba marcado como "ya
 * onboardeado" sin haber hecho nunca las sesiones conversacionales, y
 * Conversar le mostraba el saludo corto de "ya te conozco" en vez de
 * arrancarlas. El onboarding real pasa siempre por /app/conversar ahora.
 * Enlaces existentes a esta ruta (login, auth/callback, MisFuentes,
 * MiCerebro) siguen funcionando — solo cambia adónde aterrizan.
 */
export default function OnboardingPage() {
  redirect("/app/conversar");
}
