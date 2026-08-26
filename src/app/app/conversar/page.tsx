"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ConversarChat from "@/components/app/ConversarChat";
import { OWNER_NOMBRE_DEMO } from "@/components/app/AppHeader";
import { useTwin } from "@/lib/session/useTwin";

function ConversarPageInner() {
  const searchParams = useSearchParams();
  const { twin, owner } = useTwin();
  const role = searchParams.get("role") === "follower" ? "follower" : "owner";
  const ownerId = owner?.ownerId ?? searchParams.get("ownerId") ?? undefined;
  const ownerName = owner?.ownerName ?? OWNER_NOMBRE_DEMO;
  const canalParam = searchParams.get("canal");
  const canalInicial = canalParam === "voz" || canalParam === "video" ? canalParam : canalParam === "texto" ? "texto" : undefined;
  // Mientras el owner no haya terminado S1-S4, la propia conversación conduce
  // el onboarding (V10 §5.1 R1) — sin banners ni CTAs, solo texto conversacional.
  const onboardingCompleto = twin ? twin.sesion_actual === "completo" : role === "follower";
  const sesionActual = twin && twin.sesion_actual !== "completo" ? twin.sesion_actual : undefined;

  return (
    <div className="mt-app">
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-104px)] max-w-3xl flex-col p-4">
        <ConversarChat
          ownerName={ownerName}
          role={role}
          ownerId={ownerId}
          canalInicial={canalInicial}
          onboardingCompleto={onboardingCompleto}
          sesionActual={sesionActual}
        />
      </div>
    </div>
  );
}

export default function ConversarPage() {
  return (
    <Suspense>
      <ConversarPageInner />
    </Suspense>
  );
}
