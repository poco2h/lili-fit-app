import { Suspense } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { Starfield } from "@/components/starfield/Starfield";
import ContratarForm from "@/components/forms/ContratarForm";

export default function ContratarPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="flex items-center gap-3 border-b border-black/10 bg-white px-6 py-4">
        <Link href="/profesionales" className="flex items-center gap-3">
          <Logo size={28} />
        </Link>
        <Link href="/profesionales" className="ml-auto text-sm text-black/50 hover:text-black">
          ← Volver
        </Link>
      </header>
      <main className="relative overflow-hidden">
        <Starfield />
        <div className="relative z-10 mx-auto max-w-4xl px-6 py-14">
          <Suspense fallback={null}>
            <ContratarForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
