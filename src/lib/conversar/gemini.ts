export type TurnoHistorial = { who: "MindTwin" | "Tú"; text: string };
export type RespuestaGemini = { texto: string; extraccion?: Record<string, number | string> };

/** Llamada compartida a Gemini para N3 — usada por el chat libre, el onboarding y el módulo Constancia. */
export async function llamarGemini(
  systemInstructionText: string,
  mensaje: string,
  historial: TurnoHistorial[] | undefined,
  responseSchema: Record<string, unknown> | null
): Promise<RespuestaGemini | { errorApiKeyFalta: true } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { errorApiKeyFalta: true };

  const turnos = (historial ?? []).slice(-8).map((h) => ({
    role: h.who === "MindTwin" ? "model" : "user",
    parts: [{ text: h.text }],
  }));

  const generationConfig = responseSchema
    ? {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: { respuesta: { type: "STRING" }, extraccion: responseSchema },
          required: ["respuesta", "extraccion"],
        },
      }
    : undefined;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstructionText }] },
          contents: [...turnos, { role: "user", parts: [{ text: mensaje }] }],
          ...(generationConfig ? { generationConfig } : {}),
        }),
        signal: AbortSignal.timeout(15000),
      }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[Conversar] Gemini falló (${res.status}): ${body.slice(0, 300)}`);
      return null;
    }
    const data = await res.json();
    const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!texto) return null;

    if (!responseSchema) return { texto };
    try {
      const parsed = JSON.parse(texto);
      return { texto: parsed.respuesta ?? texto, extraccion: parsed.extraccion };
    } catch {
      return { texto };
    }
  } catch (e) {
    console.error("[Conversar] Gemini fetch error:", e);
    return null;
  }
}
