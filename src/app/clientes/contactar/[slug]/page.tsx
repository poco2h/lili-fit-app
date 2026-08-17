import { notFound } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { PROFESIONALES } from "@/lib/data/profesionales";
import ContactarForm from "@/components/forms/ContactarForm";

export default async function ContactarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profesional = PROFESIONALES.find((p) => p.slug === slug);
  if (!profesional) notFound();

  return (
    <div className="mt-landing min-h-screen">
      <header className="flex items-center gap-3 border-b border-black/10 px-6 py-4">
        <Logo size={32} />
        <div className="text-sm font-bold">Mindtwins · Lili Fit</div>
        <Link href="/clientes/buscar" className="ml-auto text-sm text-black/50 hover:text-black">
          ← Volver a la búsqueda
        </Link>
      </header>
      <main className="mx-auto max-w-xl px-6 py-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#1abc9c]">
          {profesional.especialidad} · {profesional.ciudad}
        </p>
        <h1 className="mt-2 font-serif text-3xl">{profesional.nombre}</h1>
        <p className="mt-2 text-black/60">{profesional.bio}</p>
        <p className="mt-4 rounded-lg bg-[#f9f9f9] p-4 text-sm text-black/60">
          Al contactar, {profesional.nombre.split(" ")[0]} te responderá por email con sus
          tarifas exactas y un link de pago. Lili Fit no fija ni muestra precios aquí — los
          fija cada profesional.
        </p>
        <ContactarForm slug={profesional.slug} />
      </main>
    </div>
  );
}
