import { NextRequest, NextResponse } from "next/server";
import { responderConversar } from "@/lib/conversar/engine";
import type { Role } from "@/lib/conversar/guardrails";
import { obtenerSportsContext, resumenParaPrompt } from "@/lib/sports/sync";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { resolveOwnerUuid } from "@/lib/demo/identities";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const mensaje = String(body?.mensaje ?? "").slice(0, 2000);
  const role: Role = body?.role === "owner" ? "owner" : "follower";
  const ownerName = String(body?.ownerName ?? "tu profesional");
  const ownerId = body?.ownerId ? String(body.ownerId) : undefined;
  const followerId = body?.followerId ? String(body.followerId) : undefined;
  const marcas = Array.isArray(body?.marcas) ? body.marcas : [];
  const marcaYaMencionada = Boolean(body?.marcaYaMencionada);
  const celebId = body?.celebId ? String(body.celebId) : null; // solo Lili Celebs
  const historial = Array.isArray(body?.historial) ? body.historial : undefined;

  if (!mensaje.trim()) {
    return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
  }

  const sportsContextResumen = celebId
    ? resumenParaPrompt(await obtenerSportsContext(celebId))
    : undefined;

  // MindTwin Generator: si el owner tiene un vertical no-fitness con system
  // prompt ya generado, se usa tal cual — sustituye el prompt/onboarding fijo
  // de Lili Fit, que no aplica a un profesor de idiomas, coach, etc.
  let systemPromptOverride: string | undefined;
  if (ownerId) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const ownerUuid = await resolveOwnerUuid(ownerId);
      if (ownerUuid) {
        const { data: owner } = await supabase
          .from("owners")
          .select("vertical, system_prompt")
          .eq("id", ownerUuid)
          .maybeSingle();
        if (owner?.vertical && owner.vertical !== "fit" && owner.system_prompt) {
          systemPromptOverride = owner.system_prompt;
        }
      }
    }
  }

  const resultado = await responderConversar({
    mensaje,
    role,
    ownerName,
    ownerId,
    followerId,
    marcas,
    marcaYaMencionada,
    sportsContextResumen,
    historial,
    systemPromptOverride,
  });
  return NextResponse.json(resultado);
}
