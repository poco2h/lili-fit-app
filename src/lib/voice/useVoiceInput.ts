"use client";

import { useCallback, useRef, useState } from "react";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

/**
 * Entrada de voz real (STT) vía Web Speech API — arregla "Voz no funciona":
 * antes solo había síntesis de salida (TTS), nunca reconocimiento de
 * entrada. Sin soporte del navegador, degrada con un mensaje claro en vez
 * de fallar en silencio.
 */
export function useVoiceInput(onResultado: (texto: string) => void) {
  const [escuchando, setEscuchando] = useState(false);
  const [soportado, setSoportado] = useState(true);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  const alternar = useCallback(() => {
    if (escuchando) {
      recRef.current?.stop();
      setEscuchando(false);
      return;
    }

    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setSoportado(false);
      return;
    }

    const rec = new Ctor();
    rec.lang = "es-ES";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const texto = e.results[0]?.[0]?.transcript;
      if (texto) onResultado(texto);
    };
    rec.onerror = () => setEscuchando(false);
    rec.onend = () => setEscuchando(false);
    recRef.current = rec;
    rec.start();
    setEscuchando(true);
  }, [escuchando, onResultado]);

  return { escuchando, soportado, alternar };
}
