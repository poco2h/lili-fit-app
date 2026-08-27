"use client";

import { useState } from "react";
import type { Sources } from "@/lib/demo/localTwin";
import { calcularFidelidadDemo } from "@/lib/fidelity/calcularDemo";
import { useTwin } from "@/lib/session/useTwin";

/**
 * Rebuild literal de REF_MisFuentes_LOADED.html/EMPTY.html + el contenido
 * completo de la doc "MindTwins · Arquitectura Mis Fuentes · v1.0"
 * (resonant-sprinkles-3fa0bc.netlify.app) — textos de "qué captura" y
 * "filósofos que calibra" copiados de esa fuente, no inventados.
 */

const MILESTONES = ["S1", "S2", "S3+Voz", "+Email", "+Docs", "95%"];

function Card({ children, activo = true }: { children: React.ReactNode; activo?: boolean }) {
  return (
    <div className={"rounded-xl border p-3.5 " + (activo ? "border-[#1abc9c]/25" : "border-white/10")} style={{ background: "rgba(0,0,0,0.22)" }}>
      {children}
    </div>
  );
}

function EstadoDot({ estado }: { estado: "done" | "n3" | "n4" | "empty" }) {
  const color = { done: "#1abc9c", n3: "#fbbf24", n4: "#f87171", empty: "rgba(255,255,255,0.15)" }[estado];
  return <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: color, boxShadow: estado !== "empty" ? `0 0 8px ${color}` : "none" }} />;
}

function LockBanner({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 rounded-lg bg-white/[0.04] p-2 text-[10px] text-white/40">🔒 {children}</p>;
}

const CONECTORES_EXTERNOS: Array<{
  key: keyof Sources; nombre: string; icon: string; queCaptura: string; mecanismo: string; filosofos: string; gain: string;
}> = [
  {
    key: "google", nombre: "Google Suite · YouTube + Drive + Gmail", icon: "🔷",
    queCaptura: "YouTube: transcripciones de vídeos y voz pública oral. Drive: documentos y voz pública escrita. Gmail: tono, vocabulario y patrones de comunicación.",
    mecanismo: "Un solo flujo OAuth conecta los 3 simultáneamente (scopes youtube.readonly + drive.readonly + gmail.readonly).",
    filosofos: "Gorgias +++ · Homero ++ · Aristóteles + · Platón + · Sócrates + · Séneca +",
    gain: "+10% (3-4% / 3% / 4%)",
  },
  {
    key: "instagram", nombre: "Instagram", icon: "📸",
    queCaptura: "Posts, stories y comentarios propios. Imagen pública, narrativa visual, tono en comunicación corta.",
    mecanismo: "Automático vía Zernio (proxy) — Meta no ofrece API pública para cuentas personales.",
    filosofos: "Gorgias ++ · Homero ++",
    gain: "+2–3%",
  },
  {
    key: "tiktok", nombre: "TikTok", icon: "🎵",
    queCaptura: "Vídeos, transcripciones, captions y patrones de contenido. Idiolecto real en registro informal.",
    mecanismo: "Conector pendiente de definir (Creator API / Zernio / exportación GDPR).",
    filosofos: "Gorgias +++ · Homero ++ · Heráclito +",
    gain: "+3–4%",
  },
  {
    key: "whatsapp", nombre: "WhatsApp", icon: "💬",
    queCaptura: "Mensajes privados y de grupo. Idiolecto real en registro íntimo: vocabulario, emojis, patrones horarios.",
    mecanismo: "v1 manual: exportar .txt desde WhatsApp. v2 automática: pendiente confirmar cobertura Zernio.",
    filosofos: "Sócrates ++ · Heráclito ++",
    gain: "+4%",
  },
  {
    key: "wearables", nombre: "Wearables", icon: "⌚",
    queCaptura: "Sleep quality, HRV, actividad física y recovery score — datos fisiológicos diarios en tiempo real.",
    mecanismo: "100% automático vía Terra API — un solo conector agrega Fitbit, Garmin, Apple Health, Oura y Whoop.",
    filosofos: "Heráclito + · Platón +",
    gain: "+1–2%",
  },
];

type CampoConector = {
  tipo: "text" | "email" | "tel" | "select" | "file";
  label: string;
  placeholder?: string;
  opciones?: string[];
  ayuda?: string;
};

/** Qué información pedimos al pulsar "Conectar" — no hay OAuth real todavía para ninguna de estas fuentes, así que recogemos el dato mínimo necesario para que el profesional pueda activar la sincronización manualmente. */
const CAMPOS_CONECTOR: Record<keyof Sources, CampoConector> = {
  google: { tipo: "email", label: "Tu cuenta de Google", placeholder: "tucorreo@gmail.com" },
  instagram: { tipo: "text", label: "Tu usuario de Instagram", placeholder: "@tuusuario" },
  tiktok: { tipo: "text", label: "Tu usuario de TikTok", placeholder: "@tuusuario" },
  whatsapp: {
    tipo: "file",
    label: "Exporta tu chat y súbelo aquí",
    ayuda: "WhatsApp → Chat → ⋮ → Más → Exportar chat → Sin multimedia. Sube el .txt resultante.",
  },
  wearables: {
    tipo: "select",
    label: "Tu dispositivo",
    opciones: ["Fitbit", "Garmin", "Apple Health", "Oura", "Whoop"],
    ayuda: "Además del dispositivo, déjanos tu email de contacto para activar la sincronización.",
  },
};

function ConectarModal({
  sourceKey,
  nombre,
  onClose,
  onConectado,
  ownerId,
}: {
  sourceKey: keyof Sources;
  nombre: string;
  onClose: () => void;
  onConectado: (detalle: string, fileUrl?: string) => void;
  ownerId: string | undefined;
}) {
  const campo = CAMPOS_CONECTOR[sourceKey];
  const [valor, setValor] = useState(campo.tipo === "select" ? campo.opciones?.[0] ?? "" : "");
  const [email, setEmail] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmar() {
    setError(null);
    if (campo.tipo === "file" && !archivo) {
      setError("Sube el archivo .txt exportado de WhatsApp.");
      return;
    }
    if (campo.tipo !== "file" && !valor.trim()) {
      setError("Rellena este campo para continuar.");
      return;
    }
    setEnviando(true);
    try {
      let fileUrl: string | undefined;
      if (archivo) {
        const form = new FormData();
        form.append("ownerId", ownerId ?? "demo");
        form.append("sourceKey", sourceKey);
        form.append("archivo", archivo);
        const res = await fetch("/api/fuentes/subir-archivo", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Error subiendo el archivo.");
        fileUrl = json.url as string;
      }
      const detalle =
        campo.tipo === "file"
          ? archivo!.name
          : campo.tipo === "select"
            ? `${valor}${email ? ` · ${email}` : ""}`
            : valor.trim();
      onConectado(detalle, fileUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo falló conectando esta fuente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-[#1abc9c]/25 bg-[#0a0f0e] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-1 text-sm font-bold text-white">Conectar {nombre}</p>
        <p className="mb-4 text-[11px] text-white/40">
          Necesitamos este dato para activar la sincronización — todavía no hay autenticación automática para esta fuente.
        </p>

        {campo.tipo === "select" ? (
          <>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-white/50">{campo.label}</label>
            <select
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="mb-3 w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
            >
              {campo.opciones?.map((o) => (
                <option key={o} value={o} className="bg-[#0a0f0e]">
                  {o}
                </option>
              ))}
            </select>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-white/50">Tu email de contacto</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              className="mb-1 w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none"
            />
          </>
        ) : campo.tipo === "file" ? (
          <>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-white/50">{campo.label}</label>
            <input
              type="file"
              accept=".txt"
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
              className="mb-1 w-full rounded-lg bg-white/5 px-3 py-2 text-xs text-white file:mr-2 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:text-white"
            />
          </>
        ) : (
          <>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-white/50">{campo.label}</label>
            <input
              type={campo.tipo}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder={campo.placeholder}
              className="mb-1 w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none"
            />
          </>
        )}
        {campo.ayuda && <p className="mb-3 mt-1 text-[10px] text-white/35">{campo.ayuda}</p>}
        {error && <p className="mb-3 text-[11px] text-red-400">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/60">
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={enviando}
            className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black disabled:opacity-50"
          >
            {enviando ? "Conectando…" : "Conectar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MisFuentes() {
  const { twin, guardar, ownerId } = useTwin();
  const [modalKey, setModalKey] = useState<keyof Sources | null>(null);

  if (!twin) {
    return (
      <div className="mt-glass p-6 text-sm text-white/60">
        Completa primero tu{" "}
        <a href="/app/onboarding" className="text-[#1abc9c] underline">EGO ID + GUT ID</a>.
      </div>
    );
  }

  const fidelidad = calcularFidelidadDemo(twin);
  const fidPct = Math.round(fidelidad * 100);
  const egoCompleto = twin.sesion_actual === "completo";
  const gutCompleto = twin.gut.gut_baseline_score !== null || twin.gut.n1_connected;
  const internasAvanzadas = egoCompleto && gutCompleto;

  function desconectar(key: keyof Sources) {
    if (!twin) return;
    const { [key]: _fuera, ...restoData } = twin.sources_data ?? {};
    guardar({ ...twin, sources: { ...twin.sources, [key]: false }, sources_data: restoData });
  }

  function conectar(key: keyof Sources, detalle: string, fileUrl?: string) {
    if (!twin) return;
    guardar({
      ...twin,
      sources: { ...twin.sources, [key]: true },
      sources_data: {
        ...twin.sources_data,
        [key]: { detalle, fileUrl, conectadoEn: new Date().toISOString() },
      },
    });
    setModalKey(null);
  }

  const CON_OAUTH_ZERNIO = new Set<keyof Sources>(["instagram", "tiktok", "whatsapp"]);

  function endpointConectorReal(key: keyof Sources, ownerId: string): string | null {
    if (CON_OAUTH_ZERNIO.has(key)) return `/api/fuentes/zernio/conectar?ownerId=${encodeURIComponent(ownerId)}&plataforma=${key}`;
    if (key === "google") return `/api/fuentes/google/conectar?ownerId=${encodeURIComponent(ownerId)}`;
    if (key === "wearables") return `/api/fuentes/terra/conectar?ownerId=${encodeURIComponent(ownerId)}`;
    return null;
  }

  async function abrirConector(key: keyof Sources) {
    const endpoint = ownerId ? endpointConectorReal(key, ownerId) : null;
    if (endpoint) {
      try {
        const res = await fetch(endpoint);
        const json = await res.json();
        if (res.ok && json.url) {
          window.location.href = json.url;
          return;
        }
      } catch {
        // sigue al formulario manual
      }
    }
    setModalKey(key);
  }

  const activasExternas = CONECTORES_EXTERNOS.filter((c) => twin.sources[c.key]).length;

  return (
    <div className="space-y-5">
      {/* BANNER FIDELIDAD */}
      <div className="rounded-2xl border border-[#1abc9c]/40 p-4" style={{ background: "rgba(0,0,0,0.22)" }}>
        <div className="mb-2.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-white/50">Fidelidad del MindTwin</p>
            <p className="text-[10px] text-white/35">Todas las fuentes activas</p>
          </div>
          <div className="text-right">
            <p className="text-[28px] font-extrabold leading-none text-[#1abc9c]">{fidPct}%</p>
            <p className="text-[10px] text-white/35">Techo del sistema: 95%</p>
          </div>
        </div>
        <div className="h-1.5 rounded bg-white/[0.06]">
          <div className="h-full rounded bg-gradient-to-r from-[#1abc9c] to-[#0ed4b5]" style={{ width: `${fidPct}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between">
          {MILESTONES.map((m, i) => (
            <span key={m} className={"text-[9px] " + (i * 15 < fidPct ? "text-[#1abc9c]" : "text-white/25")}>
              {m}
              {i * 15 < fidPct && i < 5 ? " ✓" : ""}
            </span>
          ))}
        </div>
      </div>

      {/* BANNER IMPACTO CONVERSAR */}
      <div className="rounded-xl border border-[#1abc9c]/25 p-3.5" style={{ background: "linear-gradient(135deg, rgba(26,188,156,0.08), rgba(108,127,255,0.05))" }}>
        <p className="mb-2.5 text-[10px] font-bold uppercase tracking-wide text-[#1abc9c]">🧩 Impacto en Conversar · Cerebro activo</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-black/30 p-2 text-center">
            <p className="text-lg font-extrabold text-[#1abc9c]">70%</p>
            <p className="text-[9px] text-white/40">Caché semántica<br />Sin tokens LLM</p>
          </div>
          <div className="rounded-lg bg-black/30 p-2 text-center">
            <p className="text-lg font-extrabold text-indigo-400">15%</p>
            <p className="text-[9px] text-white/40">Determinista<br />Reglas EGO ID</p>
          </div>
          <div className="rounded-lg bg-black/30 p-2 text-center">
            <p className="text-lg font-extrabold text-amber-400">15%</p>
            <p className="text-[9px] text-white/40">Respuesta IA<br />~€0.001/min</p>
          </div>
        </div>
      </div>

      {/* BANNER FORMULA MI CEREBRO */}
      <div className="rounded-xl border border-[#1abc9c]/18 p-3.5" style={{ background: "rgba(26,188,156,0.04)" }}>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[#1abc9c]">🧠 Mi Cerebro · Fórmula de peso activa</p>
        <div className="rounded-md bg-black/35 p-2.5 font-mono text-[11px] text-slate-300">
          peso_efectivo[i] = <span className="text-indigo-400">tales_weights[i]</span> × (1 + tales_state[i]) × (1.0 + <span className="text-[#1abc9c]">tales_data[i]</span> × 0.2)
        </div>
        <p className="mt-1.5 text-[10px] text-white/40">
          tales_data_factor amplifica progresivamente los filósofos más relevantes conforme conversas más con tu MindTwin.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {twin.tales_weights &&
            Object.entries(twin.tales_weights)
              .filter(([f]) => f !== "Kant")
              .sort((a, b) => b[1] - a[1])
              .slice(0, 4)
              .map(([f, w]) => (
                <span key={f} className="rounded-full bg-[#1abc9c]/15 px-2.5 py-1 text-[10px] font-semibold text-[#1abc9c]">
                  {f} {Math.round(w * 100)}%
                </span>
              ))}
          <span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold text-amber-400">Kant = 1.0 (fijo)</span>
        </div>
      </div>

      {/* CATEGORÍA 1 · INTERNAS */}
      <div>
        <div className="mb-2.5 flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] px-2.5 py-2">
          <span>🧬</span>
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-400">Internas automáticas</span>
          <span className="ml-auto rounded-full bg-emerald-400/15 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
            {[egoCompleto, gutCompleto, internasAvanzadas, internasAvanzadas, internasAvanzadas].filter(Boolean).length} de 5 activas
          </span>
        </div>
        <div className="space-y-2">
          <Card activo={egoCompleto}>
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🧠</span>
              <div className="flex-1">
                <p className="text-sm font-bold">EGO ID — Perfil psicológico</p>
                <p className="text-[10px] text-white/35">6 tests · 120 ítems en 3 sesiones de máx. 20 min</p>
              </div>
              <EstadoDot estado={egoCompleto ? "done" : "empty"} />
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-white/45">
              Se captura conversando de forma natural en Conversar durante S1/S2/S3 — no perciibes que estás haciendo un test.
              Calibra: Demócrito, Sócrates, Aristóteles, Epicuro, Platón, Séneca, Heráclito, Gorgias, Homero, Kant (fijo).
            </p>
            {egoCompleto && (
              <div className="mt-2 border-t border-white/[0.06] pt-2 text-[10px] leading-relaxed">
                <b className="text-white/70">{twin.ego.serialized}</b>
              </div>
            )}
          </Card>

          <Card activo={gutCompleto}>
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🦠</span>
              <div className="flex-1">
                <p className="text-sm font-bold">GUT ID — Perfil de microbiota</p>
                <p className="text-[10px] text-white/35">28 preguntas + 1 cribado · 7 dimensiones (Z/Y/X/W/V/U/T)</p>
              </div>
              <EstadoDot estado={gutCompleto ? "done" : "empty"} />
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-white/45">
              Si tienes N1 activo se importa automáticamente desde Supabase; si no, se integra conversacionalmente en S1-S3.
              El P28 (cribado ardor/dolor) nunca diagnostica — solo activa la alerta &quot;consulta con un profesional de salud&quot;.
            </p>
            {gutCompleto && (
              <div className="mt-2 border-t border-white/[0.06] pt-2 text-[10px]">
                Score base: <b className="text-white/70">{twin.gut.gut_baseline_score}/1000</b>
                {twin.gut.bacterias_dominantes.length > 0 && <> · Dominantes: {twin.gut.bacterias_dominantes.join(", ")}</>}
              </div>
            )}
          </Card>

          <Card activo={internasAvanzadas}>
            <div className="flex items-center gap-2.5">
              <span className="text-lg">📊</span>
              <div className="flex-1">
                <p className="text-sm font-bold">Autoevaluaciones de hábitos</p>
                <p className="text-[10px] text-white/35">4 autoevaluaciones progresivas · Mindstatusness</p>
              </div>
              <EstadoDot estado={internasAvanzadas ? "done" : "empty"} />
            </div>
            {internasAvanzadas ? (
              <p className="mt-2 text-[10px] text-white/45">Recalibra tu score_EGO incrementalmente — detecta cambios de estrés, energía y tolerancia a la rutina.</p>
            ) : (
              <LockBanner>Se activa cuando completes tu EGO ID y GUT ID.</LockBanner>
            )}
          </Card>

          <Card activo={internasAvanzadas}>
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🔄</span>
              <div className="flex-1">
                <p className="text-sm font-bold">Bucle diario alimentario</p>
                <p className="text-[10px] text-white/35">Alimentos + wearable (Terra API)</p>
              </div>
              <EstadoDot estado={internasAvanzadas ? "done" : "empty"} />
            </div>
            {internasAvanzadas ? (
              <p className="mt-2 text-[10px] text-white/45">HRV y recovery score calibran la intensidad de Heráclito y Platón — el twin siempre conoce tu estado físico actual.</p>
            ) : (
              <LockBanner>Se activa al completar el GUT ID.</LockBanner>
            )}
          </Card>

          <Card activo={internasAvanzadas}>
            <div className="flex items-center gap-2.5">
              <span className="text-lg">💬</span>
              <div className="flex-1">
                <p className="text-sm font-bold">Historial de conversaciones</p>
                <p className="text-[10px] text-white/35">Cada sesión de Conversar suma conocimiento</p>
              </div>
              <EstadoDot estado={internasAvanzadas ? "done" : "empty"} />
            </div>
            {internasAvanzadas ? (
              <p className="mt-2 text-[10px] text-white/45">tales_data_factor[i] = 1.0 + (tales_data[i] × 0.2) — cuanto más conversas, más precisa la calibración filosófica.</p>
            ) : (
              <LockBanner>Completa S2 y S3 en Conversar para activar.</LockBanner>
            )}
          </Card>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* CATEGORÍA 2 · EXTERNAS */}
      <div>
        <div className="mb-2.5 flex items-center gap-2 rounded-lg border border-indigo-400/25 bg-indigo-400/[0.06] px-2.5 py-2">
          <span>🌐</span>
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-indigo-400">Externas automatizadas</span>
          <span className="ml-auto rounded-full bg-indigo-400/15 px-2 py-0.5 text-[9px] font-bold text-indigo-400">
            {activasExternas} de {CONECTORES_EXTERNOS.length} conectadas
          </span>
        </div>
        <p className="mb-2 text-[10px] text-white/35">
          Cada fuente suma entre +1% y +10% de fidelidad. Se conectan tras completar S3 del EGO ID — a tu ritmo, no es obligatorio.
        </p>
        <div className="space-y-2">
          {CONECTORES_EXTERNOS.map((c) => {
            const activo = twin.sources[c.key];
            const datos = twin.sources_data?.[c.key];
            return (
              <Card key={c.key} activo={activo}>
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{c.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{c.nombre}</p>
                    <p className="text-[10px] text-white/35">{c.queCaptura}</p>
                  </div>
                  <EstadoDot estado={activo ? "done" : "empty"} />
                  <button
                    onClick={() => (activo ? desconectar(c.key) : abrirConector(c.key))}
                    className={"rounded-full px-3 py-1.5 text-[10px] font-bold " + (activo ? "bg-white/10 text-white/50" : "bg-white text-black")}
                  >
                    {activo ? "Desconectar" : "Conectar"}
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-white/40">{c.mecanismo}</p>
                {activo && datos && (
                  <p className="mt-1.5 text-[10px] text-[#1abc9c]/80">✓ Conectado · {datos.detalle}</p>
                )}
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[10px] text-white/35">{c.filosofos}</span>
                  {activo && <span className="text-[9px] font-bold text-[#1abc9c]">{c.gain} fidelidad</span>}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {modalKey && (
        <ConectarModal
          sourceKey={modalKey}
          nombre={CONECTORES_EXTERNOS.find((c) => c.key === modalKey)!.nombre}
          onClose={() => setModalKey(null)}
          onConectado={(detalle, fileUrl) => conectar(modalKey, detalle, fileUrl)}
          ownerId={ownerId}
        />
      )}

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* CATEGORÍA 3 · MANUALES */}
      <div>
        <div className="mb-2.5 flex items-center gap-2 rounded-lg border border-amber-400/25 bg-amber-400/[0.07] px-2.5 py-2">
          <span>🏥</span>
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-amber-400">Manuales · Carga del profesional</span>
          <span className="ml-auto rounded-full bg-amber-400/15 px-2 py-0.5 text-[9px] font-bold text-amber-400">0 de 2 activas</span>
        </div>
        <p className="mb-2 text-[10px] text-white/35">Activan los niveles N3 y N4 — máxima precisión diagnóstica. El MindTwin nunca interpreta clínicamente estos datos.</p>
        <div className="space-y-2">
          <Card activo={false}>
            <div className="flex items-center gap-2.5">
              <span className="text-lg">⚖️</span>
              <div className="flex-1">
                <p className="text-sm font-bold">Bioimpedancia</p>
                <p className="text-[10px] text-white/35">Masa muscular, masa grasa, agua corporal, metabolismo basal · N3</p>
              </div>
              <EstadoDot estado="empty" />
              <button className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-black">Cargar datos</button>
            </div>
            <p className="mt-2 text-[10px] text-white/40">
              El profesional sube el PDF/CSV del dispositivo de medición desde el Dashboard Clientes. Enriquece el score_base del GUT ID.
            </p>
          </Card>
          <Card activo={false}>
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🔬</span>
              <div className="flex-1">
                <p className="text-sm font-bold">Test de microbioma (heces) · Laboratorio</p>
                <p className="text-[10px] text-white/35">Análisis metagenómico real · N4</p>
              </div>
              <EstadoDot estado="empty" />
              <button className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-black">Cargar informe</button>
            </div>
            <p className="mt-2 text-[10px] text-white/40">
              Transforma el GUT ID de &quot;estimado por preguntas&quot; a &quot;confirmado por laboratorio&quot;. Desbloquea derivación a GUT ID Advisor certificado.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
