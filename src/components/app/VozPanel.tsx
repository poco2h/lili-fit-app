"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { who: "MindTwin" | "Tú"; text: string };

/**
 * Llamada de voz Follower — misma estructura que VideollamadaPanel, pero con
 * la voz clonada del profesional (ElevenLabs) en vez de Tavus CVI.
 * STT: Web Speech API del navegador (gratis, solo Chrome/Edge de escritorio).
 * TTS: /api/conversar/tts con el voice_id guardado en twin_profiles.
 * Sin voice_id todavía clonado para este owner, muestra el aviso de siempre.
 */
export default function VozPanel({ ownerName, ownerId, role = "follower" }: { ownerName: string; ownerId?: string; role?: "owner" | "follower" }) {
  const [voiceId, setVoiceId] = useState<string | null | undefined>(undefined);
  const [escuchando, setEscuchando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [mensajes, setMensajes] = useState<Msg[]>([]);
  const [errorMic, setErrorMic] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!ownerId) {
      setVoiceId(null);
      return;
    }
    fetch(`/api/twin/voice?ownerId=${encodeURIComponent(ownerId)}`)
      .then((r) => r.json())
      .then((d) => setVoiceId(d.voiceId ?? null))
      .catch(() => setVoiceId(null));
  }, [ownerId]);

  async function hablarRespuesta(texto: string) {
    if (!voiceId) return;
    const res = await fetch("/api/conversar/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto, voiceId }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    if (audioRef.current) {
      audioRef.current.src = url;
      await audioRef.current.play().catch(() => {});
    }
  }

  async function enviarMensaje(texto: string) {
    setMensajes((m) => [...m, { who: "Tú", text: texto }]);
    setProcesando(true);
    try {
      const res = await fetch("/api/conversar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensaje: texto,
          role,
          ownerName,
          marcas: [],
          marcaYaMencionada: false,
          historial: mensajes,
        }),
      });
      const data = await res.json();
      const respuesta = data.respuesta ?? "No he podido responder.";
      setMensajes((m) => [...m, { who: "MindTwin", text: respuesta }]);
      await hablarRespuesta(respuesta);
    } finally {
      setProcesando(false);
    }
  }

  function iniciarEscucha() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMic("Tu navegador no soporta reconocimiento de voz (usa Chrome o Edge de escritorio).");
      return;
    }
    setErrorMic(null);
    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e: any) => {
      const texto = e.results[0][0].transcript;
      if (texto?.trim()) enviarMensaje(texto.trim());
    };
    recognition.onerror = () => setErrorMic("No se ha podido capturar el audio del micrófono.");
    recognition.onend = () => setEscuchando(false);
    recognitionRef.current = recognition;
    setEscuchando(true);
    recognition.start();
  }

  function detenerEscucha() {
    recognitionRef.current?.stop();
    setEscuchando(false);
  }

  if (voiceId === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-white/40">Cargando...</div>
    );
  }

  if (!voiceId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#1abc9c]/10 text-3xl">🎙️</div>
        <p className="text-sm text-white/70">Llamada de voz en tiempo real con la voz clonada de {ownerName}.</p>
        <p className="max-w-sm rounded-lg bg-amber-500/10 p-3 text-xs text-amber-400">
          Este profesional todavía no ha clonado su voz — hazlo en /profesionales/voz para activar este canal.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className={"flex h-24 w-24 items-center justify-center rounded-full bg-[#1abc9c]/10 text-3xl " + (escuchando ? "animate-pulse" : "")}>
        🎙️
      </div>
      <p className="text-sm text-white/70">Llamada de voz con la voz clonada de {ownerName}.</p>

      <div className="w-full max-w-sm space-y-2 text-left">
        {mensajes.map((m, i) => (
          <div key={i} className={"rounded-xl px-3 py-2 text-xs " + (m.who === "Tú" ? "bg-white/10 text-white" : "bg-[#1abc9c]/10 text-white/90")}>
            <span className="font-bold">{m.who}: </span>{m.text}
          </div>
        ))}
        {procesando && <p className="text-xs text-white/40">Pensando y generando audio…</p>}
      </div>

      <button
        onClick={escuchando ? detenerEscucha : iniciarEscucha}
        disabled={procesando}
        className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black disabled:opacity-50"
      >
        {escuchando ? "Escuchando... (pulsa para parar)" : "Pulsa para hablar"}
      </button>
      {errorMic && <p className="max-w-sm text-xs text-red-400">{errorMic}</p>}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
