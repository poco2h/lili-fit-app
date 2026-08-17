"use server";

import { enviarEmail } from "@/lib/email/send";
import type { ItemAgenda } from "@/lib/habitos/data";

export async function enviarAgendaAlProfesional(emailProfesional: string, agenda: ItemAgenda[]) {
  const filas = agenda
    .map(
      (i) =>
        `<tr><td>${i.dia}</td><td>${i.ejercicio}</td><td>${i.receta?.nombre ?? "—"}</td><td>${i.restaurante?.nombre ?? "—"}</td></tr>`
    )
    .join("");

  return enviarEmail({
    to: emailProfesional,
    subject: "Agenda semanal de tu cliente — MindTwin",
    html: `<h2>Agenda semanal</h2><table border="1" cellpadding="6"><tr><th>Día</th><th>Ejercicio</th><th>Receta</th><th>Restaurante</th></tr>${filas}</table>`,
  });
}
