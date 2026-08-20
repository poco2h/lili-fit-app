"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { getSupabaseBrowser } from "@/lib/supabase/browserClient";

type Owner = { ownerId: string; ownerName: string; voiceId: string | null };

export default function VozProfesionalPage() {
  const supabase = getSupabaseBrowser();
  const [owner, setOwner] = useState<Owner | null>(null);
  const [cargandoOwner, setCargandoOwner] = useState(true);
  const [errorOwner, setErrorOwner] = useState<string | null>(null);

  const [archivo, setArchivo] = useState<File | null>(null);
  const [clonando, setClonando] = useState(false);
  const [errorClonar, setErrorClonar] = useState<string | null>(null);

  const [texto, setTexto] = useState("Hola, soy tu MindTwin. Esto es una prueba de mi voz clonada.");
  const [probando, setProbando] = useState(false);
  const [errorProbar, setErrorProbar] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!supabase) {
      setCargandoOwner(false);
      setErrorOwner("Supabase no está configurado en este entorno.");
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token;
      if (!token) {
        setCargandoOwner(false);
        setErrorOwner("Inicia sesión primero en /profesionales/acceso.");
        return;
      }
      const res = await fetch("/api/profesionales/voz/resolver-owner", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setCargandoOwner(false);
      if (!res.ok) {
        setErrorOwner(json.error ?? "No se ha podido resolver tu perfil.");
        return;
      }
      setOwner(json);
    });
  }, [supabase]);

  async function clonarVoz() {
    if (!owner || !archivo) return;
    setClonando(true);
    setErrorClonar(null);
    try {
      const form = new FormData();
      form.append("ownerId", owner.ownerId);
      form.append("ownerName", owner.ownerName);
      form.append("audio", archivo);
      const res = await fetch("/api/profesionales/voz/clonar", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) {
        setErrorClonar(json.error ? `${json.error}${json.details ? " — " + json.details : ""}` : "Error clonando la voz.");
        return;
      }
      setOwner({ ...owner, voiceId: json.voiceId });
    } finally {
      setClonando(false);
    }
  }

  async function probarVoz() {
    if (!owner?.voiceId) return;
    setProbando(true);
    setErrorProbar(null);
    try {
      const res = await fetch("/api/conversar/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto, voiceId: owner.voiceId }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErrorProbar(json.error ?? "Error generando el audio de prueba.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.src = url;
        await audioRef.current.play();
      }
    } finally {
      setProbando(false);
    }
  }

  return (
    <div className="mt-landing flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <Link href="/profesionales" className="inline-block">
          <Logo size={40} />
        </Link>
        <h1 className="mt-4 font-serif text-2xl">Tu voz clonada</h1>
        <p className="mt-2 text-sm text-[rgb(99,99,99)]">
          Sube una muestra de audio tuya (idealmente 1-2 minutos, sin ruido de fondo) y la clonamos con ElevenLabs.
        </p>

        {cargandoOwner && <p className="mt-6 text-sm text-[rgb(99,99,99)]">Cargando tu perfil...</p>}
        {errorOwner && <p className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-700">{errorOwner}</p>}

        {owner && (
          <div className="mt-6 space-y-6 text-left">
            <p className="text-sm text-[rgb(99,99,99)]">
              Perfil: <span className="font-semibold text-black">{owner.ownerName}</span>
            </p>

            <div className="space-y-3 rounded-xl border border-black/10 p-4">
              <p className="text-sm font-semibold">1. Muestra de voz</p>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-black/20 bg-[rgb(250,250,250)] px-4 py-6 text-center hover:bg-[rgb(245,245,245)]">
                <span className="text-2xl">🎵</span>
                <span className="text-sm font-semibold text-black">Subir archivo</span>
                <span className="text-xs text-[rgb(120,120,120)]">
                  {archivo ? archivo.name : "Haz clic para elegir un audio de tu ordenador"}
                </span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </label>
              <button
                onClick={clonarVoz}
                disabled={!archivo || clonando}
                className="w-full rounded-full bg-black px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                {clonando ? "Clonando..." : owner.voiceId ? "Volver a clonar →" : "Clonar mi voz →"}
              </button>
              {errorClonar && <p className="text-xs text-red-600">{errorClonar}</p>}
              {owner.voiceId && (
                <p className="text-xs text-[#0e6b57]">Voz clonada — voice_id: {owner.voiceId}</p>
              )}
            </div>

            {owner.voiceId && (
              <div className="space-y-3 rounded-xl border border-black/10 p-4">
                <p className="text-sm font-semibold">2. Prueba y tunea</p>
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
                />
                <button
                  onClick={probarVoz}
                  disabled={probando || !texto.trim()}
                  className="w-full rounded-full bg-black px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {probando ? "Generando..." : "Reproducir con mi voz →"}
                </button>
                {errorProbar && <p className="text-xs text-red-600">{errorProbar}</p>}
                <audio ref={audioRef} controls className="w-full" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
