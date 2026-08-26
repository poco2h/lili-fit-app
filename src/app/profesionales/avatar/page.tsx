"use client";

import { useEffect, useState } from "react";
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

const GUION_LECTURA =
  "Hola, soy [tu nombre] y este es mi MindTwin. Estoy grabando este vídeo para entrenar mi avatar digital y " +
  "mi forma de hablar, para poder ayudar a mis clientes las 24 horas del día con mi mismo tono y mi misma " +
  "manera de explicar las cosas. Gracias por confiar en mí.";

/** Extrae un fotograma (a ~1s o mitad del clip) del vídeo subido, para usarlo como foto de referencia del avatar. */
function extraerFotograma(archivo: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = URL.createObjectURL(archivo);
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, video.duration / 2 || 0);
    };
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No se pudo procesar el vídeo."));
        return;
      }
      ctx.drawImage(video, 0, 0);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(video.src);
          if (blob) resolve(blob);
          else reject(new Error("No se pudo extraer el fotograma del vídeo."));
        },
        "image/jpeg",
        0.92
      );
    };
    video.onerror = () => reject(new Error("No se pudo leer el archivo de vídeo."));
  });
}

export default function AvatarProfesionalPage() {
  const supabase = getSupabaseBrowser();
  const [owner, setOwner] = useState<Owner | null>(null);
  const [cargandoOwner, setCargandoOwner] = useState(true);
  const [errorOwner, setErrorOwner] = useState<string | null>(null);

  const [videoArchivo, setVideoArchivo] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [procesandoAvatar, setProcesandoAvatar] = useState(false);
  const [mensajeAvatar, setMensajeAvatar] = useState<string | null>(null);

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

  function elegirVideo(archivo: File | null) {
    setVideoArchivo(archivo);
    setMensajeAvatar(null);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(archivo ? URL.createObjectURL(archivo) : null);
  }

  async function procesarVideoAvatar() {
    if (!owner || !videoArchivo) return;
    setProcesandoAvatar(true);
    setMensajeAvatar("Procesando tu vídeo…");
    try {
      // 1) Fotograma de referencia + subida del vídeo en paralelo.
      const [fotograma, subidaVideo] = await Promise.all([
        extraerFotograma(videoArchivo),
        (async () => {
          const form = new FormData();
          form.append("ownerId", owner.ownerId);
          form.append("video", videoArchivo, videoArchivo.name || "avatar.mp4");
          const res = await fetch("/api/profesionales/avatar/subir-video", { method: "POST", body: form });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error ?? "Error subiendo el vídeo.");
          return json.url as string;
        })(),
      ]);

      // 2) Subir el fotograma y fijarlo como avatar (alimenta ya el pipeline de vídeo V2 existente).
      const formFoto = new FormData();
      formFoto.append("ownerId", owner.ownerId);
      formFoto.append("foto", fotograma, "fotograma.jpg");
      const resFoto = await fetch("/api/profesionales/avatar/subir-lote", { method: "POST", body: formFoto });
      const jsonFoto = await resFoto.json();
      if (!resFoto.ok) throw new Error(jsonFoto.error ?? "Error subiendo el fotograma.");

      await fetch("/api/profesionales/avatar/guardar-foto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: owner.ownerId, avatarUrl: jsonFoto.url }),
      });

      // 3) Guardar la referencia del vídeo en el perfil.
      await fetch("/api/profesionales/avatar/guardar-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: owner.ownerId, videoUrl: subidaVideo }),
      });

      setOwner({ ...owner, avatarUrl: jsonFoto.url });
      setMensajeAvatar("Avatar guardado ✓ Intentando crear tu Photo Avatar de HeyGen…");

      // 4) Intento (opcional) de crear el Photo Avatar en HeyGen — si falla (p. ej. sin HEYGEN_API_KEY), no bloquea nada.
      try {
        const formHeygen = new FormData();
        formHeygen.append("ownerId", owner.ownerId);
        formHeygen.append("ownerName", owner.ownerName);
        formHeygen.append("foto", fotograma, "fotograma.jpg");
        const resHeygen = await fetch("/api/profesionales/heygen/photo-avatar", { method: "POST", body: formHeygen });
        const jsonHeygen = await resHeygen.json();
        if (resHeygen.ok && jsonHeygen.avatarId) {
          setOwner((o) => (o ? { ...o, heygenAvatarId: jsonHeygen.avatarId } : o));
          setMensajeAvatar("Avatar guardado ✓ y Photo Avatar de HeyGen creado ✓");
        } else {
          setMensajeAvatar(`Avatar guardado ✓ (HeyGen todavía no disponible: ${jsonHeygen.error ?? "sin configurar"})`);
        }
      } catch {
        setMensajeAvatar("Avatar guardado ✓ (HeyGen no disponible ahora mismo)");
      }
    } catch (e) {
      setMensajeAvatar(e instanceof Error ? e.message : "Error procesando el vídeo.");
    } finally {
      setProcesandoAvatar(false);
    }
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
          Graba un vídeo corto leyendo un guion y creamos tu avatar automáticamente.
        </p>

        {cargandoOwner && <p className="mt-6 text-sm text-[rgb(99,99,99)]">Cargando tu perfil...</p>}
        {errorOwner && <p className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-700">{errorOwner}</p>}

        {owner && (
          <div className="mt-6 space-y-6 text-left">
            <p className="text-sm text-[rgb(99,99,99)]">
              Perfil: <span className="font-semibold text-black">{owner.ownerName}</span>
            </p>

            <div className="space-y-3 rounded-xl border border-[#1abc9c]/40 p-4">
              <p className="text-sm font-semibold">1. Tu avatar · vídeo leyendo un guion</p>
              {owner.avatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={owner.avatarUrl} alt="Tu avatar" className="h-40 w-full rounded-lg object-cover" />
              )}
              <div className="rounded-lg bg-[#1abc9c]/[0.06] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0e6b57]">Lee esto en tu vídeo (15-20s)</p>
                <p className="mt-1 text-xs text-black">{GUION_LECTURA}</p>
              </div>
              <p className="text-xs text-[rgb(99,99,99)]">
                Graba con el móvil o la cámara del ordenador — buena luz, mirando a cámara, sin gafas de sol — y sube
                aquí el archivo. Se usa para crear tu avatar y, si tenéis HeyGen configurado, tu Photo Avatar
                automáticamente.
              </p>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#1abc9c]/40 bg-[#1abc9c]/[0.04] px-4 py-6 text-center hover:bg-[#1abc9c]/[0.08]">
                <span className="text-2xl">🎬</span>
                <span className="text-sm font-semibold text-black">
                  {videoArchivo ? videoArchivo.name : "Subir vídeo (15-20 segundos)"}
                </span>
                <span className="text-xs text-[rgb(120,120,120)]">MP4, MOV o WebM</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => elegirVideo(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </label>
              {videoPreviewUrl && (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video controls src={videoPreviewUrl} className="w-full rounded-lg" />
              )}
              <button
                onClick={procesarVideoAvatar}
                disabled={!videoArchivo || procesandoAvatar}
                className="w-full rounded-full bg-[#0e6b57] px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                {procesandoAvatar ? "Procesando…" : "Usar este vídeo para mi avatar →"}
              </button>
              {mensajeAvatar && <p className="text-xs text-[rgb(99,99,99)]">{mensajeAvatar}</p>}
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
