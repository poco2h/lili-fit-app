import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { enviarRecordatorioWhatsapp } from "@/lib/whatsapp/zernio";
import type { DemoTwin, Recordatorio } from "@/lib/demo/localTwin";

export const maxDuration = 60;

function diasDesde(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Envía por WhatsApp (vía Zernio) los recordatorios de Mis Hábitos › Alertas
 * que tocan hoy — canal "whatsapp"/"ambos", con teléfono guardado, y sin
 * envío previo o con frecuenciaDias ya cumplidos desde el último. Pensado
 * para correr una vez al día vía Vercel Cron (vercel.json) — por eso NO
 * comprueba la "hora" exacta del recordatorio, solo el día.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase no configurado" }, { status: 501 });

  const { data: filas, error } = await supabase
    .from("twin_profiles")
    .select("id, owner_id, follower_id, demo_twin")
    .not("demo_twin->>recordatorios", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let enviados = 0;
  let saltados = 0;
  const errores: string[] = [];

  for (const fila of filas ?? []) {
    const twin = fila.demo_twin as DemoTwin | null;
    const recordatorios = twin?.recordatorios ?? [];
    if (recordatorios.length === 0) continue;

    let cambios = false;
    const actualizados: Recordatorio[] = [];

    for (const r of recordatorios) {
      const aplica = r.canal === "whatsapp" || r.canal === "ambos";
      const toca = !r.ultimoEnvioWhatsapp || diasDesde(r.ultimoEnvioWhatsapp) >= r.frecuenciaDias;

      if (!aplica || !r.telefono || !toca) {
        actualizados.push(r);
        if (aplica && toca && !r.telefono) saltados++;
        continue;
      }

      const resultado = await enviarRecordatorioWhatsapp({ ownerId: fila.owner_id, telefono: r.telefono, habito: r.habito });
      if (resultado.ok) {
        enviados++;
        cambios = true;
        actualizados.push({ ...r, ultimoEnvioWhatsapp: new Date().toISOString() });
      } else {
        saltados++;
        errores.push(`${r.habito}: ${resultado.motivo}`);
        actualizados.push(r);
      }
    }

    if (cambios) {
      await supabase
        .from("twin_profiles")
        .update({ demo_twin: { ...twin, recordatorios: actualizados } })
        .eq("id", fila.id);
    }
  }

  return NextResponse.json({ ok: true, enviados, saltados, errores: errores.slice(0, 10) });
}
