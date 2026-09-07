import { notFound } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import ContactarForm from "@/components/forms/ContactarForm";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ContactarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();
  if (!supabase) notFound();

  // Los owners dados de alta antes de que existiera `slug` no tienen uno real
  // guardado — el buscador enlaza aquí con su id (UUID) como respaldo.
  const query = supabase.from("owners").select("id, name, especialidad, ciudad").eq("mindtwin_status", "active");
  const { data: profesional } = UUID_RE.test(slug)
    ? await query.eq("id", slug).maybeSingle()
    : await query.eq("slug", slug).maybeSingle();

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
          {profesional.especialidad}
          {profesional.ciudad && ` · ${profesional.ciudad}`}
        </p>
        <h1 className="mt-2 font-serif text-3xl">{profesional.name}</h1>
        <p className="mt-4 rounded-lg bg-[#f9f9f9] p-4 text-sm text-black/60">
          Al contactar, {profesional.name.split(" ")[0]} te responderá por email con sus
          tarifas exactas y un link de pago. Lili Fit no fija ni muestra precios aquí — los
          fija cada profesional.
        </p>
        <ContactarForm slug={slug} />
      </main>
    </div>
  );
}
