import type { DemoTwin } from "@/lib/demo/localTwin";

/**
 * Regla R7 de "Mis Conversaciones" (añadida a PROMPT BACK END.docx v1.0
 * R1-R6, PDF "codigo mt conversaciones" entregado 2026-08-26): el MindTwin
 * del Owner asesora al follower combinando (1) los datos reales del propio
 * follower, (2) la metodología del Owner (EGO ID/TALES, vía bloqueTalesPrompt)
 * y (3) el conocimiento general del modelo — en ese orden de precedencia.
 * Esta función serializa la parte (1): sports_profile + señales de sus
 * autoevaluaciones de Mis Hábitos, para que el consejo sea específico a su
 * situación real y no genérico.
 */
export function bloqueContextoFollower(twinFollower: DemoTwin | null): string {
  if (!twinFollower) return "";

  const sp = twinFollower.sports_profile;
  const lineasSports = sp
    ? Object.entries(sp)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ")
    : "";

  const gut = twinFollower.gut;
  const lineasGut: string[] = [];
  if (gut?.gatillos?.length) lineasGut.push(`Gatillos activos: ${gut.gatillos.join(", ")}`);
  if (gut?.bacterias_deficientes?.length) lineasGut.push(`Bacterias deficientes: ${gut.bacterias_deficientes.join(", ")}`);

  if (!lineasSports && lineasGut.length === 0) return "";

  const partes = [
    lineasSports ? `Perfil deportivo del follower: ${lineasSports}.` : "",
    ...lineasGut,
  ].filter(Boolean);

  return (
    `[DATOS REALES DE ESTE FOLLOWER — R7]\n${partes.join("\n")}\n` +
    `Usa estos datos reales para personalizar cualquier consejo deportivo o nutricional — nunca respondas ` +
    `de forma genérica si esta información está disponible. Si el follower te pide seguimiento de su rutina, ` +
    `parte de aquí antes de recurrir a conocimiento general.`
  );
}
