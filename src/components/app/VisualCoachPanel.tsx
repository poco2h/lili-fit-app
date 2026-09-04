"use client";

import { useEffect, useRef, useState } from "react";
import { Conversation } from "@elevenlabs/client";
import { FilesetResolver, PoseLandmarker, type NormalizedLandmark } from "@mediapipe/tasks-vision";
import { computeJointAngles, evaluateDeviations, type JointDeviation, type JointName } from "@/lib/pose/angles";
import type { SportsProfile } from "@/app/api/profesionales/deporte/route";

const FEEDBACK_INTERVAL_MS = 8000;
const FEEDBACK_PREFIX = "SYSTEM_FEEDBACK_AUTOMATICO:";

/** Conexiones torso/brazos/piernas (índices del modelo MediaPipe Pose, 33 landmarks). */
const CONNECTIONS: Array<[number, number]> = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
];

const JOINT_LANDMARK: Partial<Record<JointName, number>> = {
  knee_left: 25,
  knee_right: 26,
  hip_left: 23,
  hip_right: 24,
  elbow_left: 13,
  elbow_right: 14,
  shoulder_left: 11,
  shoulder_right: 12,
  cervical_alignment: 0,
};

type ConversationInstance = Awaited<ReturnType<typeof Conversation.startSession>>;

/**
 * Sesión en vivo del alumno (Visual Coach): cámara propia + overlay
 * esquelético MediaPipe Pose, feedback automático hablado cada 8s (Gemini
 * para el análisis, ElevenLabs Conversational AI Agent para decirlo con la
 * voz del entrenador), y preguntas interrumpibles con el micro siempre
 * abierto (lo gestiona el propio agente, no hay STT/TTS manual aquí).
 *
 * El agente no tiene forma documentada de "decir este texto verbatim" — se
 * empuja vía sendUserMessage() con un prefijo (FEEDBACK_PREFIX) que el
 * system prompt del agente (buildAgentSystemPrompt) sabe tratar como nota
 * interna a transmitir, no como algo dicho por el alumno.
 */
export default function VisualCoachPanel({
  ownerId,
  followerId,
  sportsProfile,
  sessionBillingId,
}: {
  ownerId: string;
  followerId: string;
  sportsProfile: SportsProfile;
  sessionBillingId: string;
}) {
  const [ejercicioId, setEjercicioId] = useState(sportsProfile.exercises[0]?.id ?? "");
  const [estado, setEstado] = useState<"conectando" | "activa" | "error">("conectando");
  const [error, setError] = useState<string | null>(null);
  const [ultimoFeedback, setUltimoFeedback] = useState<string | null>(null);
  const [modoAgente, setModoAgente] = useState<"speaking" | "listening" | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [soloAudio, setSoloAudio] = useState(false);
  const [angulosEnVivo, setAngulosEnVivo] = useState<Partial<Record<JointName, JointDeviation>>>({});

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const latestLandmarksRef = useRef<NormalizedLandmark[] | null>(null);
  const feedbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const angulosIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const conversationRef = useRef<ConversationInstance | null>(null);
  const ejercicioRef = useRef(ejercicioId);
  const pausadoRef = useRef(pausado);
  const pendingFeedbackRef = useRef<{ exercise: string; jointAngles: Partial<Record<JointName, number>>; deviations: Partial<Record<JointName, JointDeviation>> } | null>(null);
  ejercicioRef.current = ejercicioId;
  pausadoRef.current = pausado;

  function logEvento(payload: Record<string, unknown>) {
    fetch("/api/pose/evento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId, followerId, sessionBillingId, ...payload }),
    }).catch(() => {});
  }

  async function pedirRespuesta(transcript: string): Promise<string> {
    const res = await fetch("/api/ai/gemini-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, sport: sportsProfile.sport, knowledgeBase: sportsProfile.knowledge_base }),
    });
    if (!res.body) return "";
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let texto = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      texto += decoder.decode(value, { stream: true });
    }
    return texto.trim();
  }

  async function tickFeedback() {
    if (pausadoRef.current) return;
    const landmarks = latestLandmarksRef.current;
    const ejercicio = sportsProfile.exercises.find((e) => e.id === ejercicioRef.current);
    if (!landmarks || !ejercicio) return;

    const jointAngles = computeJointAngles(landmarks);
    const deviations = evaluateDeviations(jointAngles, ejercicio.joint_targets);
    const resumen = Object.entries(deviations)
      .map(
        ([joint, d]) =>
          `${joint}: ${Math.round(d!.angle)}° (objetivo ${d!.target[0]}-${d!.target[1]}°, ${d!.status === "ok" ? "correcto" : "fuera de rango"})`
      )
      .join("; ");
    if (!resumen) return;

    const contexto = `Estoy haciendo "${ejercicio.label}". Ángulos articulares medidos ahora mismo: ${resumen}. Dame feedback breve de mi técnica.`;

    if (conversationRef.current) {
      // La respuesta hablada llega async por onMessage — este contexto queda
      // pendiente para que se loguee como feedback_auto (no qa_coach) en cuanto llegue.
      pendingFeedbackRef.current = { exercise: ejercicio.id, jointAngles, deviations };
      conversationRef.current.sendUserMessage(`${FEEDBACK_PREFIX} ${contexto}`);
    } else {
      // Modo demo (sin ElevenLabs configurado): feedback en texto directo de Gemini, sin voz.
      const texto = await pedirRespuesta(contexto);
      if (!texto) return;
      setUltimoFeedback(texto);
      logEvento({ eventType: "feedback_auto", exercise: ejercicio.id, jointAngles, deviations, text: texto });
    }
  }

  useEffect(() => {
    let cancelado = false;

    function dibujarOverlay(canvas: HTMLCanvasElement, video: HTMLVideoElement, landmarks?: NormalizedLandmark[]) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!landmarks || pausadoRef.current) return;

      const ejercicio = sportsProfile.exercises.find((e) => e.id === ejercicioRef.current);
      const deviations = ejercicio ? evaluateDeviations(computeJointAngles(landmarks), ejercicio.joint_targets) : {};
      const puntosRojos = new Set<number>();
      for (const [joint, dev] of Object.entries(deviations)) {
        const idx = JOINT_LANDMARK[joint as JointName];
        if (dev?.status === "deviation" && idx !== undefined) puntosRojos.add(idx);
      }

      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 3;
      for (const [a, b] of CONNECTIONS) {
        const pa = landmarks[a];
        const pb = landmarks[b];
        if (!pa || !pb) continue;
        ctx.beginPath();
        ctx.moveTo(pa.x * canvas.width, pa.y * canvas.height);
        ctx.lineTo(pb.x * canvas.width, pb.y * canvas.height);
        ctx.stroke();
      }
      landmarks.forEach((lm, i) => {
        ctx.beginPath();
        ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 5, 0, Math.PI * 2);
        ctx.fillStyle = puntosRojos.has(i) ? "#ef4444" : "#eab308";
        ctx.fill();
      });
    }

    function loop() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;
      if (video && canvas && landmarker && video.readyState >= 2) {
        const result = landmarker.detectForVideo(video, performance.now());
        const landmarks = result.landmarks[0];
        latestLandmarksRef.current = landmarks ?? null;
        dibujarOverlay(canvas, video, landmarks);
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    async function conectarAgente() {
      try {
        const res = await fetch(`/api/profesionales/voz/agente/signed-url?ownerId=${encodeURIComponent(ownerId)}`);
        if (!res.ok) {
          setDemoMode(true);
          return;
        }
        const { signedUrl } = await res.json();
        const conversation = await Conversation.startSession({
          signedUrl,
          onModeChange: ({ mode }) => setModoAgente(mode),
          onMessage: ({ message, role }) => {
            if (role === "user") {
              if (message.startsWith(FEEDBACK_PREFIX)) return; // eco de nuestro propio empujón, no es habla real del alumno
              setUltimoFeedback(null);
              logEvento({ eventType: "qa_alumno", exercise: ejercicioRef.current, text: message });
              return;
            }
            setUltimoFeedback(message);
            const pendiente = pendingFeedbackRef.current;
            if (pendiente) {
              pendingFeedbackRef.current = null;
              logEvento({ eventType: "feedback_auto", exercise: pendiente.exercise, jointAngles: pendiente.jointAngles, deviations: pendiente.deviations, text: message });
            } else {
              logEvento({ eventType: "qa_coach", exercise: ejercicioRef.current, text: message });
            }
          },
          onError: () => {},
        });
        if (cancelado) {
          conversation.endSession();
          return;
        }
        conversationRef.current = conversation;
      } catch {
        if (!cancelado) setDemoMode(true);
      }
    }

    async function iniciar() {
      setEstado("conectando");
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (cancelado) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const fileset = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const landmarker = await PoseLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });
        if (cancelado) {
          landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker;

        rafRef.current = requestAnimationFrame(loop);
        feedbackIntervalRef.current = setInterval(tickFeedback, FEEDBACK_INTERVAL_MS);
        angulosIntervalRef.current = setInterval(() => {
          const landmarks = latestLandmarksRef.current;
          const ejercicio = sportsProfile.exercises.find((e) => e.id === ejercicioRef.current);
          if (!landmarks || !ejercicio) return;
          setAngulosEnVivo(evaluateDeviations(computeJointAngles(landmarks), ejercicio.joint_targets));
        }, 500);

        await conectarAgente();
        if (cancelado) return;
        setEstado("activa");
      } catch (e) {
        if (cancelado) return;
        setError(e instanceof Error ? e.message : "No se pudo acceder a la cámara o cargar el tracking de pose.");
        setEstado("error");
      }
    }

    iniciar();

    return () => {
      cancelado = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (feedbackIntervalRef.current) clearInterval(feedbackIntervalRef.current);
      if (angulosIntervalRef.current) clearInterval(angulosIntervalRef.current);
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      conversationRef.current?.endSession();
      conversationRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId, sessionBillingId]);

  return (
    <div className="flex flex-1 flex-col gap-3 p-4 md:flex-row">
      <div className="flex flex-1 flex-col gap-3">
        {sportsProfile.exercises.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {sportsProfile.exercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => setEjercicioId(ex.id)}
                className={
                  "rounded-full px-4 py-1.5 text-xs font-semibold transition " +
                  (ejercicioId === ex.id ? "bg-white text-black" : "bg-white/10 text-white/70 hover:bg-white/15")
                }
              >
                {ex.label}
              </button>
            ))}
          </div>
        )}

        <div className="relative w-full flex-1 overflow-hidden rounded-xl border border-white/10 bg-black">
          {!soloAudio && (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
              <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
            </>
          )}
          {soloAudio && (
            <div className="flex h-full items-center justify-center text-center text-sm text-white/50">
              Modo solo audio — sin esqueleto en pantalla
            </div>
          )}

          {estado === "conectando" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-center text-xs text-white/60">
              Activando cámara y cargando el tracking de pose…
            </div>
          )}
          {estado === "error" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-6 text-center">
              <p className="max-w-sm rounded-lg bg-red-500/10 p-3 text-xs text-red-400">{error}</p>
            </div>
          )}
          {modoAgente && (
            <div className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-[11px] font-semibold text-white">
              {modoAgente === "speaking" ? "🔊 El coach está hablando" : "🎙️ Escuchando…"}
            </div>
          )}
          {demoMode && (
            <div className="absolute left-3 top-3 rounded-full bg-amber-500/20 px-3 py-1 text-[11px] font-semibold text-amber-300">
              Modo demo — sin voz (falta configurar ElevenLabs)
            </div>
          )}
          {ultimoFeedback && (
            <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-black/70 p-3 text-sm text-white">{ultimoFeedback}</div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <button
            onClick={() => setPausado((p) => !p)}
            className="rounded-full bg-white/10 px-5 py-2 text-xs font-bold text-white hover:bg-white/15"
          >
            {pausado ? "▶️ Reanudar análisis" : "⏸️ Pausar análisis"}
          </button>
          <button
            onClick={() => setSoloAudio((s) => !s)}
            className="rounded-full bg-white/10 px-5 py-2 text-xs font-bold text-white hover:bg-white/15"
          >
            {soloAudio ? "📷 Mostrar esqueleto" : "🔈 Modo solo audio"}
          </button>
        </div>
      </div>

      <div className="w-full shrink-0 rounded-xl border border-white/10 bg-white/5 p-3 md:w-56">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/40">Ángulos en vivo</p>
        {Object.keys(angulosEnVivo).length === 0 ? (
          <p className="text-xs text-white/40">Esperando detección…</p>
        ) : (
          <div className="space-y-1.5">
            {Object.entries(angulosEnVivo).map(([joint, d]) => (
              <div key={joint} className="flex items-center justify-between text-xs">
                <span className="text-white/60">{joint}</span>
                <span className={d!.status === "ok" ? "font-bold text-[#eab308]" : "font-bold text-red-400"}>{Math.round(d!.angle)}°</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
