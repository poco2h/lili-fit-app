"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { getSupabaseBrowser } from "@/lib/supabase/browserClient";

type Owner = {
  ownerId: string;
  ownerName: string;
  voiceId: string | null;
  avatarUrl: string | null;
  heygenAvatarId: string | null;
  heygenVoiceId: string | null;
};
type EstadoSoul = "idle" | "subiendo" | "entrenando" | "listo" | "error";

const MIN_FOTOS_SOUL = 20;

export default function AvatarProfesionalPage() {
  const supabase = getSupabaseBrowser();
  const [owner, setOwner] = useState<Owner | null>(null);
  const [cargandoOwner, setCargandoOwner] = useState(true);
  const [errorOwner, setErrorOwner] = useState<string | null>(null);

  const [fotosSoul, setFotosSoul] = useState<File[]>([]);
  const [estadoSoul, setEstadoSoul] = useState<EstadoSoul>("idle");
  const [mensajeSoul, setMensajeSoul] = useState<string | null>(null);
  const [soulId, setSoulId] = useState<string | null>(null);
  const [fotoGenerada, setFotoGenerada] = useState<string | null>(null);
  const pollSoulRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollFotoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [guion, setGuion] = useState("Hoy os cuento cómo recuperar mejor después de una sesión intensa.");
  const [generando, setGenerando] = useState(false);
  const [resultado, setResultado] = useState<{ estado: string; mensaje: string; videoUrl?: string; statusUrl?: string } | null>(null);
  const [videosGuardados, setVideosGuardados] = useState<Array<{ id: string; video_url: string; guion: string | null; created_at: string }>>([]);

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
      cargarVideos(json.ownerId);
    });
  }, [supabase]);

  function cargarVideos(ownerId: string) {
    fetch(`/api/videos/listar?ownerId=${encodeURIComponent(ownerId)}`)
      .then((r) => r.json())
      .then((d) => setVideosGuardados(d.videos ?? []));
  }

  useEffect(() => {
    return () => {
      if (pollSoulRef.current) clearInterval(pollSoulRef.current);
      if (pollFotoRef.current) clearInterval(pollFotoRef.current);
    };
  }, []);

  function iniciarPollingSoul(id: string) {
    if (pollSoulRef.current) clearInterval(pollSoulRef.current);
    pollSoulRef.current = setInterval(async () => {
      const res = await fetch(`/api/profesionales/avatar/estado-soul?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      setMensajeSoul(data.mensaje ?? null);
      if (data.estado === "completado") {
        clearInterval(pollSoulRef.current!);
        setEstadoSoul("listo");
        setSoulId(data.soulId ?? id);
      } else if (data.estado === "error") {
        clearInterval(pollSoulRef.current!);
        setEstadoSoul("error");
      }
    }, 5000);
  }

  async function entrenarSoul() {
    if (!owner || fotosSoul.length < MIN_FOTOS_SOUL) return;
    setEstadoSoul("subiendo");
    setMensajeSoul(`Subiendo fotos… (0/${fotosSoul.length})`);
    try {
      const urls: string[] = [];
      for (let i = 0; i < fotosSoul.length; i++) {
        const form = new FormData();
        form.append("ownerId", owner.ownerId);
        form.append("foto", fotosSoul[i]);
        const res = await fetch("/api/profesionales/avatar/subir-lote", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Error subiendo una foto.");
        urls.push(json.url);
        setMensajeSoul(`Subiendo fotos… (${i + 1}/${fotosSoul.length})`);
      }

      setEstadoSoul("entrenando");
      setMensajeSoul("Entrenando tu Soul ID (3-5 min)…");
      const res = await fetch("/api/profesionales/avatar/entrenar-soul", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: owner.ownerId, ownerName: owner.ownerName, photoUrls: urls }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ? `${json.error}${json.details ? " — " + json.details : ""}` : "Error entrenando el Soul.");
      iniciarPollingSoul(json.soulTrainingId);
    } catch (e) {
      setEstadoSoul("error");
      setMensajeSoul(e instanceof Error ? e.message : "Error desconocido.");
    }
  }

  function iniciarPollingFoto(statusUrl: string) {
    if (pollFotoRef.current) clearInterval(pollFotoRef.current);
    pollFotoRef.current = setInterval(async () => {
      const res = await fetch(`/api/profesionales/avatar/estado-foto?statusUrl=${encodeURIComponent(statusUrl)}`);
      const data = await res.json();
      if (data.estado === "completado" && data.imageUrl) {
        clearInterval(pollFotoRef.current!);
        setFotoGenerada(data.imageUrl);
        setMensajeSoul(null);
      } else if (data.estado === "error") {
        clearInterval(pollFotoRef.current!);
        setMensajeSoul(data.mensaje ?? "Error generando la foto.");
      }
    }, 4000);
  }

  async function generarFotoRealista() {
    if (!soulId) return;
    setMensajeSoul("Generando tu foto realista…");
    setFotoGenerada(null);
    const res = await fetch("/api/profesionales/avatar/generar-foto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ soulId }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMensajeSoul(json.details ? `${json.error} ${json.details}` : json.error ?? "Error generando la foto.");
      return;
    }
    if (json.estado === "completado" && json.imageUrl) {
      setFotoGenerada(json.imageUrl);
      setMensajeSoul(null);
    } else if (json.statusUrl) {
      iniciarPollingFoto(json.statusUrl);
    }
  }

  async function usarFotoGenerada() {
    if (!owner || !fotoGenerada) return;
    await fetch("/api/profesionales/avatar/guardar-foto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId: owner.ownerId, avatarUrl: fotoGenerada }),
    });
    setOwner({ ...owner, avatarUrl: fotoGenerada });
  }

  async function guardarVideoGenerado(videoUrl: string) {
    if (!owner) return;
    await fetch("/api/videos/guardar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId: owner.ownerId, variante: "v4", guion, videoUrl }),
    });
    cargarVideos(owner.ownerId);
  }

  function iniciarPolling(statusUrl: string) {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/videos/estado?statusUrl=${encodeURIComponent(statusUrl)}`);
      const data = await res.json();
      setResultado(data);
      if (data.estado !== "procesando") {
        clearInterval(interval);
        if (data.estado === "completado" && data.videoUrl) guardarVideoGenerado(data.videoUrl);
      }
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
      else if (data.estado === "completado" && data.videoUrl) guardarVideoGenerado(data.videoUrl);
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
          Entrena un Soul ID con 20+ fotos tuyas para un avatar mucho más realista.
        </p>

        {cargandoOwner && <p className="mt-6 text-sm text-[rgb(99,99,99)]">Cargando tu perfil...</p>}
        {errorOwner && <p className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-700">{errorOwner}</p>}

        {owner && (
          <div className="mt-6 space-y-6 text-left">
            <p className="text-sm text-[rgb(99,99,99)]">
              Perfil: <span className="font-semibold text-black">{owner.ownerName}</span>
            </p>

            <div className="space-y-3 rounded-xl border border-[#1abc9c]/40 p-4">
              <p className="text-sm font-semibold">1. Modo realista · Soul ID</p>
              {owner.avatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={owner.avatarUrl} alt="Tu avatar" className="h-40 w-full rounded-lg object-cover" />
              )}
              <p className="text-xs text-[rgb(99,99,99)]">
                Entrena un personaje consistente con Higgsfield Soul ID a partir de {MIN_FOTOS_SOUL}+ fotos tuyas —
                distintos ángulos y expresiones, buena luz, sin gafas de sol. Tarda unos minutos y el resultado es
                mucho más fiel que con una sola foto.
              </p>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#1abc9c]/40 bg-[#1abc9c]/[0.04] px-4 py-6 text-center hover:bg-[#1abc9c]/[0.08]">
                <span className="text-2xl">🖼️</span>
                <span className="text-sm font-semibold text-black">
                  {fotosSoul.length > 0 ? `${fotosSoul.length} fotos elegidas` : "Subir fotos (mínimo 20)"}
                </span>
                <span className="text-xs text-[rgb(120,120,120)]">
                  {fotosSoul.length > 0 && fotosSoul.length < MIN_FOTOS_SOUL
                    ? `Necesitas ${MIN_FOTOS_SOUL - fotosSoul.length} más`
                    : "Selecciona varias fotos a la vez (Ctrl/Cmd + clic)"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setFotosSoul(Array.from(e.target.files ?? []))}
                  className="hidden"
                />
              </label>
              <button
                onClick={entrenarSoul}
                disabled={fotosSoul.length < MIN_FOTOS_SOUL || estadoSoul === "subiendo" || estadoSoul === "entrenando"}
                className="w-full rounded-full bg-[#0e6b57] px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                {estadoSoul === "subiendo" || estadoSoul === "entrenando" ? "Procesando…" : "Entrenar mi Soul ID →"}
              </button>
              {mensajeSoul && <p className="text-xs text-[rgb(99,99,99)]">{mensajeSoul}</p>}

              {estadoSoul === "listo" && !fotoGenerada && (
                <button
                  onClick={generarFotoRealista}
                  className="w-full rounded-full bg-black px-6 py-3 text-sm font-semibold text-white"
                >
                  Generar foto realista →
                </button>
              )}

              {fotoGenerada && (
                <div className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fotoGenerada} alt="Foto generada" className="h-48 w-full rounded-lg object-cover" />
                  <button
                    onClick={usarFotoGenerada}
                    className="w-full rounded-full bg-[#0e6b57] px-6 py-3 text-sm font-semibold text-white"
                  >
                    Usar esta foto como mi avatar →
                  </button>
                </div>
              )}
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

                {videosGuardados.length > 0 && (
                  <div className="space-y-2 border-t border-black/10 pt-3">
                    <p className="text-xs font-semibold text-[rgb(99,99,99)]">Tus vídeos guardados</p>
                    {videosGuardados.map((v) => (
                      <div key={v.id} className="space-y-1">
                        {v.guion && <p className="text-xs text-[rgb(120,120,120)]">{v.guion}</p>}
                        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                        <video controls src={v.video_url} className="w-full rounded-lg" />
                      </div>
                    ))}
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
