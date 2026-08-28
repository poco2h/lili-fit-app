"use client";

import { useEffect, useRef, useState } from "react";
import { useVoiceInput } from "@/lib/voice/useVoiceInput";
import { HeyGenStreamingClient } from "@/lib/avatar/heygenStreamingClient";

const FRAME_INTERVAL_MS = 3000;
const FRASE_MIN_CHARS = 100;
const FRASE_FIN_RE = /[.?!]\s*$/;

/**
 * Videollamada Follower (V1) — pipeline propio en tiempo real, reemplaza
 * Tavus CVI (ver PROMPT VISION ARTIFICIAL / ARQUITECTURA VISION ARTIFICIAL):
 * STT Browser → Gemini Flash 2.5 (texto + visión) → ElevenLabs TTS →
 * HeyGen Streaming Avatar → WebRTC → usuario. Higgsfield/Tavus quedan fuera
 * de este flujo (Higgsfield sigue intacto para vídeos asíncronos V3/V4).
 */
export default function VideollamadaPanel({ ownerName, ownerId }: { ownerName: string; ownerId?: string }) {
  const [estado, setEstado] = useState<"idle" | "conectando" | "activa" | "error">("idle");
  const [avatarEsStock, setAvatarEsStock] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoAvatarRef = useRef<HTMLVideoElement | null>(null);
  const videoUsuarioRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const latestFrameRef = useRef<string | undefined>(undefined);
  const heygenRef = useRef<HeyGenStreamingClient | null>(null);
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const camaraStreamRef = useRef<MediaStream | null>(null);
  const fraseBufferRef = useRef("");

  async function procesarTranscript(transcript: string) {
    try {
      const res = await fetch("/api/ai/gemini-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, frameBase64: latestFrameRef.current }),
      });
      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      fraseBufferRef.current = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        fraseBufferRef.current += decoder.decode(value, { stream: true });

        while (FRASE_FIN_RE.test(fraseBufferRef.current) || fraseBufferRef.current.length >= FRASE_MIN_CHARS) {
          const frase = fraseBufferRef.current.trim();
          fraseBufferRef.current = "";
          if (frase) await hablarFrase(frase);
          break;
        }
      }

      const resto = fraseBufferRef.current.trim();
      fraseBufferRef.current = "";
      if (resto) await hablarFrase(resto);
    } catch {
      // Un fallo puntual de una respuesta no debe tumbar la llamada activa.
    }
  }

  async function hablarFrase(frase: string) {
    try {
      const res = await fetch(`/api/conversar/tts?optimize_streaming_latency=4`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: frase, ownerId }),
      });
      if (!res.ok) return;
      const audioBuffer = await res.arrayBuffer();
      const bytes = new Uint8Array(audioBuffer);
      let binario = "";
      for (let i = 0; i < bytes.length; i++) binario += String.fromCharCode(bytes[i]);
      heygenRef.current?.speakAudio(btoa(binario));
    } catch {
      // Si falla el TTS, seguimos con la siguiente frase en vez de romper la llamada.
    }
  }

  const { escuchando, soportado, alternar } = useVoiceInput(procesarTranscript);

  useEffect(() => {
    let cancelado = false;

    async function iniciar() {
      setEstado("conectando");
      setError(null);
      try {
        const heygen = new HeyGenStreamingClient();
        heygenRef.current = heygen;
        const { avatarEsStock: esStock } = await heygen.init(ownerId);
        if (cancelado) return;
        setAvatarEsStock(esStock);
        if (videoAvatarRef.current) heygen.attach(videoAvatarRef.current);

        const camaraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (cancelado) {
          camaraStream.getTracks().forEach((t) => t.stop());
          return;
        }
        camaraStreamRef.current = camaraStream;
        if (videoUsuarioRef.current) videoUsuarioRef.current.srcObject = camaraStream;

        frameIntervalRef.current = setInterval(() => {
          const video = videoUsuarioRef.current;
          const canvas = canvasRef.current;
          if (!video || !canvas || video.readyState < 2) return;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
          latestFrameRef.current = dataUrl.replace(/^data:image\/jpeg;base64,/, "");
        }, FRAME_INTERVAL_MS);

        setEstado("activa");
      } catch (e) {
        if (cancelado) return;
        setError(e instanceof Error ? e.message : "Error desconocido");
        setEstado("error");
      }
    }

    iniciar();

    return () => {
      cancelado = true;
      terminarSesion();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId]);

  function terminarSesion() {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    frameIntervalRef.current = null;
    camaraStreamRef.current?.getTracks().forEach((t) => t.stop());
    camaraStreamRef.current = null;
    heygenRef.current?.stop();
    heygenRef.current = null;
    setEstado("idle");
  }

  if (estado === "conectando") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-sm text-white/70">Conectando con el avatar de {ownerName}…</p>
      </div>
    );
  }

  if (estado === "error") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="max-w-sm rounded-lg bg-red-500/10 p-3 text-xs text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col items-center gap-2 p-4">
      {avatarEsStock && (
        <p className="max-w-sm text-center text-[11px] text-white/40">
          Este profesional aún no ha entrenado su avatar en HeyGen — estás hablando con un avatar de muestra.
        </p>
      )}

      <div className="relative w-full flex-1 overflow-hidden rounded-xl border border-white/10 bg-black">
        <video ref={videoAvatarRef} autoPlay playsInline className="h-full w-full object-cover" />
        <video
          ref={videoUsuarioRef}
          autoPlay
          playsInline
          muted
          className="absolute bottom-3 right-3 h-[90px] w-[120px] rounded-lg border border-white/20 object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={alternar}
          disabled={!soportado}
          className={
            "rounded-full px-6 py-2.5 text-sm font-bold disabled:opacity-50 " +
            (escuchando ? "bg-[#1abc9c] text-black" : "bg-white text-black")
          }
        >
          {escuchando ? "🎙️ Escuchando…" : "🎙️ Hablar"}
        </button>
        <button onClick={terminarSesion} className="rounded-full bg-white/10 px-6 py-2.5 text-sm font-bold text-white">
          Terminar
        </button>
      </div>
      {!soportado && (
        <p className="max-w-sm text-center text-[11px] text-amber-400">
          Tu navegador no soporta reconocimiento de voz (usa Chrome o Edge de escritorio).
        </p>
      )}
    </div>
  );
}
