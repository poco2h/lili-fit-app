import { NextRequest, NextResponse } from "next/server";
import { streamResponse, buildSportSystemPrompt } from "@/lib/ai/geminiClient";

/**
 * Puente HTTP para geminiClient.streamResponse — necesario porque
 * GEMINI_API_KEY es un secreto de servidor (no NEXT_PUBLIC) y los
 * componentes que lo llaman (VisualCoachPanel) son de cliente. Devuelve los
 * chunks de texto como streaming plano (text/plain), uno detrás de otro,
 * para que el cliente los lea con un ReadableStream reader.
 */
export async function POST(req: NextRequest) {
  const { transcript, frameBase64, systemPromptOverride, sport, knowledgeBase } = (await req.json().catch(() => ({}))) as {
    transcript?: string;
    frameBase64?: string;
    systemPromptOverride?: string;
    /** Alternativa a systemPromptOverride: Visual Coach manda sport/knowledgeBase y el prompt se arma aquí server-side. */
    sport?: string;
    knowledgeBase?: string;
  };
  if (!transcript) return NextResponse.json({ error: "Falta transcript" }, { status: 400 });

  const promptFinal = systemPromptOverride || (sport ? buildSportSystemPrompt(sport, knowledgeBase ?? "") : undefined);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of streamResponse(transcript, frameBase64, promptFinal)) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (e) {
        controller.enqueue(encoder.encode(e instanceof Error ? `\n[error: ${e.message}]` : "\n[error]"));
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
