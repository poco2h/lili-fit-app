"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ConversarChat from "@/components/app/ConversarChat";
import { OWNER_NOMBRE_DEMO } from "@/components/app/AppHeader";
import { useTwin } from "@/lib/session/useTwin";

function ConversarPageInner() {
  const searchParams = useSearchParams();
  const { twin, owner } = useTwin();
  const ownerId = owner?.ownerId ?? searchParams.get("ownerId") ?? undefined;
  const ownerName = owner?.ownerName ?? OWNER_NOMBRE_DEMO;

  return (
    <div className="mt-app">
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-104px)] max-w-3xl flex-col p-4">
        {!twin && (
          <div className="mt-glass mb-3 flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-white/60">
              Las sesiones S1-S3 de tu EGO ID se hacen aquí, conversando de forma natural.
            </span>
            <Link href="/app/onboarding" className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black">
              Empezar →
            </Link>
          </div>
        )}
        <ConversarChat ownerName={ownerName} role="owner" ownerId={ownerId} />
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
