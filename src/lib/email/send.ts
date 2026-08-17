export type EmailResult = { enviado: boolean; simulado: boolean };

/**
 * Envío de email transaccional (Resend). Usado por: alta Owner (roadmap +
 * aviso de magic link) y contacto Follower→Owner (V10 §8.1/§8.2 — "el
 * sistema envía email al profesional con el contacto y al cliente con las
 * tarifas + link Stripe"). Sin RESEND_API_KEY configurada, se registra en
 * consola y se marca como simulado en vez de fallar o fingir un envío real.
 */
export async function enviarEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "MindTwin <no-reply@mindtwin.app>";

  if (!apiKey) {
    console.warn("[MindTwin] RESEND_API_KEY no configurada — email simulado:", {
      to: params.to,
      subject: params.subject,
    });
    return { enviado: false, simulado: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: params.to, subject: params.subject, html: params.html }),
    });
    if (!res.ok) {
      console.error("[MindTwin] Resend respondió error al enviar email:", await res.text());
      return { enviado: false, simulado: false };
    }
    return { enviado: true, simulado: false };
  } catch (e) {
    console.error("[MindTwin] Fallo de red enviando email:", e);
    return { enviado: false, simulado: false };
  }
}
