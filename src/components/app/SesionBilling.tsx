"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  PRECIOS_BASE_PAQUETES,
  type Canal,
  type PaqueteMinutos,
} from "@/lib/billing/pricing";
import type { SessionBilling } from "@/lib/billing/store";

const CANALES: Array<{ key: Canal; label: string; icon: string }> = [
  { key: "texto", label: "Texto", icon: "💬" },
  { key: "voz", label: "Voz", icon: "🎙️" },
  { key: "video_rt", label: "Videoconferencia", icon: "🎬" },
];

export default function SesionBilling() {
  const [canal, setCanal] = useState<Canal>("voz");
  const [selectedMin, setSelectedMin] = useState<PaqueteMinutos>(40);
  const [walletBalanceSec, setWalletBalanceSec] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [simSpeed, setSimSpeed] = useState<number>(1); // 1 = 1s demo:1s real, 60 = 1s demo:1min real para pruebas rápidas
  const [resultado, setResultado] = useState<(SessionBilling & {
    walletBalanceMinutesExact?: number;
    canReenterDirectly?: boolean;
    actualMinDecimal?: number;
    message?: string;
  }) | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cargarSaldo = useCallback(async () => {
    try {
      const res = await fetch(`/api/billing/wallet?canal=${canal}`);
      if (res.ok) {
        const data = await res.json();
        setWalletBalanceSec(data.balanceSeconds ?? 0);
      }
    } catch {
      // ignore
    }
  }, [canal]);

  useEffect(() => {
    cargarSaldo();
  }, [cargarSaldo]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  async function comprarPaquete(minutos: PaqueteMinutos) {
    const precio = PRECIOS_BASE_PAQUETES[canal][minutos];
    const res = await fetch("/api/billing/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        canal,
        minutos,
        precioEur: precio,
        descripcion: `Compra paquete ${minutos} min`,
      }),
    });
    if (res.ok) {
      await cargarSaldo();
    }
  }

  async function iniciarSesion(forzarCompra: boolean = false) {
    setResultado(null);
    setElapsed(0);

    const res = await fetch("/api/billing/start-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        canal,
        selectedMin,
        forcePurchase: forzarCompra,
      }),
    });

    const data = await res.json();
    setSessionId(data.sessionBillingId);
    setWalletBalanceSec(data.availableSeconds ?? walletBalanceSec);

    intervalRef.current = setInterval(() => {
      setElapsed((e) => {
        const next = e + simSpeed;
        setWalletBalanceSec((w) => Math.max(0, w - simSpeed));
        return next;
      });
    }, 1000);
  }

  async function finalizarSesion() {
    if (!sessionId) return;
    if (intervalRef.current) clearInterval(intervalRef.current);

    const res = await fetch("/api/billing/end-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionBillingId: sessionId,
        elapsedSeconds: elapsed,
      }),
    });

    const data = await res.json();
    setResultado(data);
    setSessionId(null);
    await cargarSaldo();
  }

  const walletMinutes = Math.round((walletBalanceSec / 60) * 10) / 10;
  const hasBalance = walletBalanceSec > 0;

  return (
    <div className="space-y-6">
      {/* Selector de Canales */}
      <div className="flex flex-wrap gap-2">
        {CANALES.map((c) => (
          <button
            key={c.key}
            onClick={() => {
              if (!sessionId) setCanal(c.key);
            }}
            disabled={!!sessionId}
            className={
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition " +
              (canal === c.key
                ? "bg-white text-black shadow-lg"
                : "bg-white/10 text-white/70 hover:bg-white/15")
            }
          >
            <span>{c.icon}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Tarjeta de Bolsa de Minutos */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#1abc9c] font-bold">
              Bolsa de Minutos No Utilizados
            </span>
            <h3 className="text-xl font-bold text-white mt-1">
              Saldo disponible en {CANALES.find((c) => c.key === canal)?.label}
            </h3>
            <p className="text-xs text-white/50 mt-0.5">
              Si tu sesión termina antes, los minutos restantes se guardan aquí para tus siguientes entradas.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-3xl font-extrabold text-[#1abc9c]">
                {walletMinutes}
              </span>
              <span className="text-sm font-bold text-white/70 ml-1">min</span>
              <p className="text-[11px] text-white/40">({walletBalanceSec} seg)</p>
            </div>
          </div>
        </div>

        {/* Acceso a Sesión */}
        <div className="mt-6">
          {sessionId ? (
            <div className="text-center py-6 border border-[#1abc9c]/30 rounded-xl bg-[#1abc9c]/5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1abc9c]/20 text-[#1abc9c] text-xs font-bold mb-3 animate-pulse">
                <span>●</span> Sesión en curso (minutos reales)
              </div>
              <p className="text-5xl font-extrabold text-white tracking-tight">
                {Math.floor(elapsed / 60)}′ {(elapsed % 60).toString().padStart(2, "0")}″
              </p>
              <p className="text-xs text-white/50 mt-1">
                Tiempo real consumido · Saldo restante en bolsa: {Math.max(0, Math.round((walletBalanceSec / 60) * 10) / 10)} min
              </p>

              <div className="mt-5 flex justify-center gap-3">
                <button
                  onClick={finalizarSesion}
                  className="rounded-full bg-red-500 hover:bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition"
                >
                  Finalizar sesión ahora
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {hasBalance ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                  <div>
                    <span className="text-xs font-bold text-emerald-400">
                      ✓ Saldo disponible detectado
                    </span>
                    <p className="text-sm text-white/90">
                      Puedes entrar a conversar directamente sin pagar más.
                    </p>
                  </div>
                  <button
                    onClick={() => iniciarSesion(false)}
                    className="w-full sm:w-auto rounded-full bg-[#1abc9c] hover:bg-[#16a085] px-6 py-3 text-sm font-bold text-black shadow-lg transition"
                  >
                    Entrar directamente ({walletMinutes} min disponibles) →
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                  <p className="text-sm text-white/70">
                    No tienes minutos en tu bolsa de {CANALES.find((c) => c.key === canal)?.label}. Selecciona un paquete para comenzar:
                  </p>
                </div>
              )}

              {/* Selector de Paquetes para Recarga o Primera Compra */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-white/60 uppercase tracking-wider">
                    {hasBalance ? "O recargar más minutos a tu bolsa:" : "Paquetes oficiales de minutos:"}
                  </span>
                  <span className="text-xs text-white/40">Tarifas oficiales IVA incl.</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([20, 40, 60] as PaqueteMinutos[]).map((m) => {
                    const price = PRECIOS_BASE_PAQUETES[canal][m];
                    const isSelected = selectedMin === m;
                    return (
                      <div
                        key={m}
                        onClick={() => setSelectedMin(m)}
                        className={
                          "cursor-pointer rounded-xl border p-4 transition text-left " +
                          (isSelected
                            ? "border-[#1abc9c] bg-[#1abc9c]/10"
                            : "border-white/10 bg-white/5 hover:border-white/20")
                        }
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-lg font-bold text-white">{m} min</span>
                          <span className="text-base font-extrabold text-[#1abc9c]">{price.toFixed(2)} €</span>
                        </div>
                        <p className="text-[11px] text-white/40 mt-1">
                          {((price / m)).toFixed(2)} €/min efectivo
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            comprarPaquete(m);
                          }}
                          className="mt-3 w-full rounded-lg bg-white/10 hover:bg-white/20 py-1.5 text-xs font-bold text-white transition"
                        >
                          + Añadir a bolsa
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Control de velocidad para simulación / testing */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-white/40 gap-2">
          <span>Modo de prueba rápida del timer:</span>
          <div className="flex gap-2">
            {[
              { val: 1, label: "1s real = 1s" },
              { val: 10, label: "1s = 10s" },
              { val: 60, label: "1s = 1 min" },
            ].map((s) => (
              <button
                key={s.val}
                onClick={() => setSimSpeed(s.val)}
                className={
                  "px-2.5 py-1 rounded-md text-[11px] font-semibold transition " +
                  (simSpeed === s.val ? "bg-[#1abc9c]/20 text-[#1abc9c] border border-[#1abc9c]/40" : "bg-white/5 text-white/50")
                }
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recibo / Resultado tras finalizar sesión */}
      {resultado && (
        <div className="rounded-2xl border border-[#1abc9c]/40 bg-[#1abc9c]/10 p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 text-[#1abc9c] font-bold text-sm mb-2">
            <span>✓</span> {resultado.message ?? "Sesión finalizada con éxito"}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/10 text-sm">
            <div>
              <span className="text-xs text-white/40 block">Tiempo real usado</span>
              <span className="text-lg font-bold text-white">
                {resultado.actualMinDecimal ?? resultado.actualMin} min
              </span>
            </div>
            <div>
              <span className="text-xs text-white/40 block">Coste real liquidado</span>
              <span className="text-lg font-bold text-[#1abc9c]">
                {resultado.finalPriceEur?.toFixed(2)} €
              </span>
            </div>
            <div>
              <span className="text-xs text-white/40 block">Restante en bolsa</span>
              <span className="text-lg font-bold text-white">
                {resultado.walletBalanceMinutesExact ?? 0} min
              </span>
            </div>
            <div>
              <span className="text-xs text-white/40 block">Próxima entrada</span>
              <span className="text-xs font-bold text-emerald-400 block mt-1">
                {resultado.canReenterDirectly ? "Sin coste adicional" : "Requiere recarga"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
