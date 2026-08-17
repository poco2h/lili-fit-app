"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Canal } from "./pricing";
import type { SessionBilling } from "./store";

export type EstadoBilling = {
  activa: boolean;
  elapsedSec: number;
  walletBalanceSec: number;
  walletBalanceMin: number;
  hasAvailableMinutes: boolean;
  cargandoWallet: boolean;
  resultado: (SessionBilling & {
    actualMinDecimal?: number;
    walletBalanceMinutesExact?: number;
    canReenterDirectly?: boolean;
    message?: string;
  }) | null;
};

/**
 * Hook del ciclo de vida del billing y la Bolsa de Minutos no utilizados:
 * - Detecta el saldo disponible en la bolsa para entrar sin pagar.
 * - Inicia contador al interactuar (texto/voz/video).
 * - Cierra y preserva los minutos no usados en la bolsa para la siguiente entrada.
 */
export function useSessionBilling(
  canal: Canal,
  followerId: string = "demo_follower",
  ownerId: string = "demo_owner"
) {
  const [estado, setEstado] = useState<EstadoBilling>({
    activa: false,
    elapsedSec: 0,
    walletBalanceSec: 0,
    walletBalanceMin: 0,
    hasAvailableMinutes: false,
    cargandoWallet: true,
    resultado: null,
  });

  const sessionIdRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);

  const consultarWallet = useCallback(async () => {
    try {
      setEstado((s) => ({ ...s, cargandoWallet: true }));
      const res = await fetch(
        `/api/billing/wallet?followerId=${encodeURIComponent(followerId)}&ownerId=${encodeURIComponent(
          ownerId
        )}&canal=${canal}`
      );
      if (res.ok) {
        const data = await res.json();
        setEstado((s) => ({
          ...s,
          walletBalanceSec: data.balanceSeconds ?? 0,
          walletBalanceMin: data.balanceMinutesExact ?? 0,
          hasAvailableMinutes: Boolean(data.hasAvailableMinutes),
          cargandoWallet: false,
        }));
      }
    } catch {
      setEstado((s) => ({ ...s, cargandoWallet: false }));
    }
  }, [canal, followerId, ownerId]);

  useEffect(() => {
    consultarWallet();
  }, [consultarWallet]);

  const finalizar = useCallback(async () => {
    if (!sessionIdRef.current) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    const id = sessionIdRef.current;
    sessionIdRef.current = null;

    try {
      const res = await fetch("/api/billing/end-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionBillingId: id, elapsedSeconds: elapsedRef.current }),
      });
      const data = await res.json();
      setEstado((s) => ({
        ...s,
        activa: false,
        elapsedSec: elapsedRef.current,
        resultado: data,
        walletBalanceSec: data.walletBalanceSeconds ?? s.walletBalanceSec,
        walletBalanceMin: data.walletBalanceMinutesExact ?? s.walletBalanceMin,
        hasAvailableMinutes: Boolean(data.canReenterDirectly),
      }));
    } catch {
      setEstado((s) => ({ ...s, activa: false }));
    }
  }, []);

  const asegurarSesion = useCallback(
    async (selectedMin: number = 20, forcePurchase: boolean = false) => {
      if (sessionIdRef.current) return;
      elapsedRef.current = 0;

      const res = await fetch("/api/billing/start-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canal,
          selectedMin,
          followerId,
          ownerId,
          forcePurchase,
        }),
      });

      const data = await res.json();
      sessionIdRef.current = data.sessionBillingId;

      setEstado((s) => ({
        ...s,
        activa: true,
        elapsedSec: 0,
        resultado: null,
        walletBalanceSec: data.availableSeconds ?? s.walletBalanceSec,
        walletBalanceMin: data.availableMinutes ?? s.walletBalanceMin,
        hasAvailableMinutes: true,
      }));

      intervalRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setEstado((s) => ({
          ...s,
          elapsedSec: elapsedRef.current,
          // Reflejo visual del saldo decreciendo si consume de la bolsa
          walletBalanceSec: Math.max(0, (s.walletBalanceSec || 0) - 1),
          walletBalanceMin: Math.max(0, Math.round(((s.walletBalanceSec || 0) - 1) / 6) / 10),
        }));
      }, 1000);
    },
    [canal, followerId, ownerId]
  );

  const recargarBolsa = useCallback(
    async (minutos: number, precioEur: number) => {
      const res = await fetch("/api/billing/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followerId,
          ownerId,
          canal,
          minutos,
          precioEur,
        }),
      });
      if (res.ok) {
        await consultarWallet();
      }
    },
    [canal, followerId, ownerId, consultarWallet]
  );

  // Al cambiar de canal cerramos la sesión previa
  useEffect(() => {
    return () => {
      finalizar();
    };
  }, [canal, finalizar]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    ...estado,
    asegurarSesion,
    finalizar,
    consultarWallet,
    recargarBolsa,
  };
}
