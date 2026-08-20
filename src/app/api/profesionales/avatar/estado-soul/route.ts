import { NextRequest, NextResponse } from "next/server";
import { higgsfieldAuthHeader } from "@/lib/videos/pipeline";

/**
 * Consulta el estado del entrenamiento de un Soul ID buscándolo en
 * /v1/custom-references/list (no hay documentado un GET por id único).
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const authHeader = higgsfieldAuthHeader();
  if (!authHeader) return NextResponse.json({ error: "Falta configurar Higgsfield." }, { status: 501 });

  const res = await fetch("https://platform.higgsfield.ai/v1/custom-references/list", {
    headers: { Authorization: authHeader, Accept: "application/json" },
  });
  if (!res.ok) {
    const details = await res.text().catch(() => "");
    return NextResponse.json({ estado: "error", mensaje: `Higgsfield list falló (${res.status})`, details: details.slice(0, 500) }, { status: 502 });
  }

  const data = await res.json();
  const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  const item = items.find((it: { id?: string }) => it.id === id);

  if (!item) {
    return NextResponse.json({ estado: "procesando", mensaje: "Todavía no aparece en la lista — sigue entrenando." });
  }
  const status = String(item.status ?? "").toLowerCase();
  if (["completed", "ready", "succeeded", "success"].includes(status)) {
    return NextResponse.json({ estado: "completado", mensaje: "Soul ID entrenado.", soulId: item.id });
  }
  if (["failed", "error", "canceled"].includes(status)) {
    return NextResponse.json({ estado: "error", mensaje: `Higgsfield: entrenamiento fallido (${status}).` });
  }
  return NextResponse.json({ estado: "procesando", mensaje: `Entrenando… (${status || "en curso"})` });
}
