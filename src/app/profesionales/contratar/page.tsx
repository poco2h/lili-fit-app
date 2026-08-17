import Link from "next/link";
import Logo from "@/components/Logo";
import ContratarForm from "@/components/forms/ContratarForm";

export default function ContratarPage() {
  return (
    <div className="mt-landing min-h-screen">
      <header className="flex items-center gap-3 border-b border-black/10 px-6 py-4">
        <Logo size={32} />
        <div className="text-sm font-bold">Mindtwins · Lili Fit</div>
        <Link href="/profesionales" className="ml-auto text-sm text-black/50 hover:text-black">
          ← Volver
        </Link>
      </header>
      <main className="mx-auto max-w-xl px-6 py-14">
        <h1 className="font-serif text-3xl">Crea tu MindTwin</h1>
        <p className="mt-2 text-black/60">
          Tu licencia de Mylili te da acceso ilimitado al sistema. Tras inscribirte, recibirás
          un email con tu magic link y el roadmap de las primeras sesiones (S1 crear tu perfil →
          S2 invitar clientes → S3 primer vídeo → S4 optimizar).
        </p>
        <ContratarForm />
      </main>
    </div>
  );
}
