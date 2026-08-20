"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { getSupabaseBrowser } from "@/lib/supabase/browserClient";

type Owner = { ownerId: string; ownerName: string; voiceId: string | null; avatarUrl: string | null };

export default function AvatarProfesionalPage() {
  const supabase = getSupabaseBrowser();
  const [owner, setOwner] = useState<Owner | null>(null);
  const [cargandoOwner, setCargandoOwner] = useState(true);
  const [errorOwner, setErrorOwner] = useState<string | null>(null);

  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errorSubir, setErrorSubir] = useState<string | null>(null);

  const [guion, setGuion] = useState("Hoy os cuento cómo recuperar mejor después de una sesión intensa.");
  const [generando, setGenerando] = useState(false);
  const [resultado, setResultado] = useState<{ estado: string; mensaje: string; videoUrl?: string; statusUrl?: string } | null>(null);

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

  async function subirFoto() {
    if (!owner || !archivo) return;
    setSubiendo(true);
    setErrorSubir(null);
    try {
      const form = new FormData();
      form.append("ownerId", owner.ownerId);
      form.append("foto", archivo);
      const res = await fetch("/api/profesionales/avatar/subir", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) {
        setErrorSubir(json.error ?? "Error subiendo la foto.");
        return;
      }
      setOwner({ ...owner, avatarUrl: json.avatarUrl });
    } finally {
      setSubiendo(false);
    }
  }

  function iniciarPolling(statusUrl: string) {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/videos/estado?statusUrl=${encodeURIComponent(statusUrl)}`);
      const data = await res.json();
      setResultado(data);
      if (data.estado !== "procesando") clearInterval(interval);
    }, 3000);
  }

  async function generarVideoPrueba() {
    if (!owner || !guion.trim()) return;
    setGenerando(true);
    setResultado(null);
    try {
      const res = await fetch("/api/videos/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variante: "v4", guion, ownerId: owner.ownerId }),
      });
      const data = await res.json();
      setResultado(data);
      if (data.estado === "procesando" && data.statusUrl) iniciarPolling(data.statusUrl);
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div className="mt-landing flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <Link href="/profesionales" className="inline-block">
          <Logo size={40} />
        </Link>
        <h1 className="mt-4 font-serif text-2xl">Tu avatar</h1>
        <p className="mt-2 text-sm text-[rgb(99,99,99)]">
          Sube una foto tuya de referencia (buena luz, mirando a cámara) para animar tu avatar en los vídeos.
        </p>

        {cargandoOwner && <p className="mt-6 text-sm text-[rgb(99,99,99)]">Cargando tu perfil...</p>}
        {errorOwner && <p className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-700">{errorOwner}</p>}

        {owner && (
          <div className="mt-6 space-y-6 text-left">
            <p className="text-sm text-[rgb(99,99,99)]">
              Perfil: <span className="font-semibold text-black">{owner.ownerName}</span>
            </p>

            <div className="space-y-3 rounded-xl border border-black/10 p-4">
              <p className="text-sm font-semibold">1. Foto de referencia</p>
              {owner.avatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={owner.avatarUrl} alt="Tu avatar" className="h-40 w-full rounded-lg object-cover" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                className="block w-full text-sm"
              />
              <button
                onClick={subirFoto}
                disabled={!archivo || subiendo}
                className="w-full rounded-full bg-black px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                {subiendo ? "Subiendo..." : owner.avatarUrl ? "Actualizar foto →" : "Subir mi foto →"}
              </button>
              {errorSubir && <p className="text-xs text-red-600">{errorSubir}</p>}
            </div>

            {owner.avatarUrl && (
              <div className="space-y-3 rounded-xl border border-black/10 p-4">
                <p className="text-sm font-semibold">2. Prueba y tunea (vídeo V2 · cuerpo en acción)</p>
                <textarea
                  value={guion}
                  onChange={(e) => setGuion(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
                />
                <button
                  onClick={generarVideoPrueba}
                  disabled={generando || !guion.trim()}
                  className="w-full rounded-full bg-black px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {generando ? "Enviando..." : "Generar vídeo de prueba →"}
                </button>
                {resultado && (
                  <div className="rounded-lg bg-black/5 p-3 text-xs">
                    {resultado.mensaje}
                    {resultado.estado === "completado" && resultado.videoUrl && (
                      // eslint-disable-next-line jsx-a11y/media-has-caption
                      <video controls src={resultado.videoUrl} className="mt-2 w-full rounded-lg" />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
