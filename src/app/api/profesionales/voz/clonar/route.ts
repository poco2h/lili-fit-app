import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Clona la voz de un Owner a partir de una muestra de audio (ElevenLabs
 * "Add Voice") y guarda el voice_id resultante en twin_profiles.
 * Sin ELEVENLABS_API_KEY, devuelve 501 explícito.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ELEVENLABS_API_KEY no configurada." }, { status: 501 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase no está configurado en este entorno." }, { status: 501 });
  }

  const form = await req.formData();
  const ownerId = String(form.get("ownerId") ?? "");
  const ownerName = String(form.get("ownerName") ?? "MindTwin");
  const audio = form.get("audio");

  if (!ownerId || !(audio instanceof File)) {
    return NextResponse.json({ error: "Faltan ownerId o el archivo de audio." }, { status: 400 });
  }

  const elevenForm = new FormData();
  elevenForm.append("name", `MindTwin · ${ownerName}`);
  elevenForm.append("files", audio, audio.name || "muestra.mp3");

  const res = await fetch("https://api.elevenlabs.io/v1/voices/add", {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: elevenForm,
  });

  if (!res.ok) {
    const details = await res.text();
    return NextResponse.json({ error: "ElevenLabs rechazó la clonación de voz.", details }, { status: 502 });
  }

  const { voice_id: voiceId } = (await res.json()) as { voice_id: string };

  const { data: existente } = await supabase
    .from("twin_profiles")
    .select("id")
    .eq("owner_id", ownerId)
    .is("follower_id", null)
    .maybeSingle();

  if (existente) {
    await supabase.from("twin_profiles").update({ voice_id: voiceId }).eq("id", existente.id);
  } else {
    await supabase.from("twin_profiles").insert({ owner_id: ownerId, voice_id: voiceId });
  }

  return NextResponse.json({ ok: true, voiceId });
}
