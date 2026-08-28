import { NextRequest, NextResponse } from "next/server";
import { streamResponse } from "@/lib/ai/geminiClient";

/**
 * Puente HTTP para geminiClient.streamResponse — necesario porque
 * GEMINI_API_KEY es un secreto de servidor (no NEXT_PUBLIC) y
 * VideollamadaPanel es un componente cliente. Devuelve los chunks de texto
 * como streaming plano (text/plain), uno detrás de otro, para que el
 * cliente los lea con un ReadableStream reader.
 */
export async function POST(req: NextRequest) {
  const { transcript, frameBase64 } = (await req.json().catch(() => ({}))) as {
    transcript?: string;
    frameBase64?: string;
  };
  if (!transcript) return NextResponse.json({ error: "Falta transcript" }, { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of streamResponse(transcript, frameBase64)) {
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
