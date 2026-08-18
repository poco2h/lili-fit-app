import { NextRequest, NextResponse } from "next/server";
import { emitirClaveAcceso } from "@/lib/access/accessKeys";
import { enviarEmail } from "@/lib/email/send";

/**
 * §1.2 — Solicitud de acceso profesional. En el prompt de backend este paso
 * lo revisa manualmente Poco2h antes de emitir la clave (valida colegiación).
 * No hay todavía un panel de administración para esa revisión manual, así
 * que de momento la clave se emite automáticamente al solicitarla — igual
 * que el resto del código simula pasos pendientes de proceso de negocio real
 * (ver contratarOwner) en vez de bloquear el flujo end-to-end. Cuando exista
 * el panel de revisión, este endpoint debe pasar a solo registrar la
 * solicitud y notificar al admin, sin emitir la clave todavía.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const nombre = String(body?.nombre ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const especialidad = String(body?.especialidad ?? "").trim();
    const colegiado = String(body?.colegiado ?? "").trim();

    if (!nombre || !email || !especialidad) {
      return NextResponse.json({ error: "Faltan campos obligatorios (nombre, email, especialidad)." }, { status: 400 });
    }

    const record = await emitirClaveAcceso(email);

    const emailResult = await enviarEmail({
      to: email,
      subject: "Tu clave de acceso profesional — Mindtwins · Lili Fit",
      html: `<p>Hola ${nombre},</p><p>Hemos validado tu solicitud como ${especialidad}${colegiado ? ` (colegiado ${colegiado})` : ""}.</p><p>Tu clave de acceso de un solo uso (válida 72 horas) es:</p><p style="font-size:20px;font-weight:bold;letter-spacing:1px;">${record.accessKey}</p><p>Introdúcela en la pantalla de activación de tu cuenta para continuar.</p>`,
    });

    return NextResponse.json({
      ok: true,
      simulated: emailResult.simulado,
      expiresAt: record.expiresAt,
      // Solo se expone la clave en la respuesta cuando el envío de email fue
      // simulado (sin RESEND_API_KEY) — nunca cuando el correo real se envió.
      accessKey: emailResult.simulado ? record.accessKey : undefined,
    });
  } catch (error) {
    return NextResponse.json({ error: "Error generando clave de acceso", details: String(error) }, { status: 500 });
  }
}
