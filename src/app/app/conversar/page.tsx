"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ConversarChat from "@/components/app/ConversarChat";
import { OWNER_NOMBRE_DEMO } from "@/components/app/AppHeader";
import { useTwin } from "@/lib/session/useTwin";
import { obtenerFollowerLocalId } from "@/lib/session/followerLocalId";
import type { DemoTwin } from "@/lib/demo/localTwin";

function ConversarPageInner() {
  const searchParams = useSearchParams();
  const { twin, owner } = useTwin();
  const role = searchParams.get("role") === "follower" ? "follower" : "owner";
  const ownerId = owner?.ownerId ?? searchParams.get("ownerId") ?? undefined;
  const ownerName = owner?.ownerName ?? OWNER_NOMBRE_DEMO;
  const canalParam = searchParams.get("canal");
  const canalInicial = canalParam === "voz" || canalParam === "video" ? canalParam : canalParam === "texto" ? "texto" : undefined;

  const [followerId, setFollowerId] = useState<string | undefined>(undefined);
  const [followerTwin, setFollowerTwin] = useState<DemoTwin | null>(null);

  // El Follower no tiene login todavía — su progreso de sesiones se guarda
  // contra un id local persistente por profesional (followerLocalId.ts).
  useEffect(() => {
    if (role !== "follower" || !ownerId) return;
    const id = obtenerFollowerLocalId(ownerId);
    setFollowerId(id);
    fetch(`/api/twin/follower-profile?ownerId=${encodeURIComponent(ownerId)}&followerId=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((d) => setFollowerTwin(d.twin ?? null));
  }, [role, ownerId]);

  // Mientras la persona no haya terminado sus sesiones (S1-S4 Owner, S1-S3
  // Follower), la propia conversación conduce el onboarding — sin banners
  // ni CTAs, solo texto conversacional.
  const twinActivo = role === "follower" ? followerTwin : twin;
  const onboardingCompleto = twinActivo ? twinActivo.sesion_actual === "completo" : false;
  const sesionActual = twinActivo && twinActivo.sesion_actual !== "completo" ? twinActivo.sesion_actual : undefined;

  return (
    <div className="mt-app">
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-104px)] max-w-3xl flex-col p-4">
        <ConversarChat
          ownerName={ownerName}
          role={role}
          ownerId={ownerId}
          followerId={followerId}
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
