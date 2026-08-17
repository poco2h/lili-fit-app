import Link from "next/link";
import Logo from "@/components/Logo";
import { buscarProfesionales, ordenarPorProximidad } from "@/lib/search/buscarProfesionales";
import { detectarCiudadPorIp } from "@/lib/geo/detectarCiudad";

export default async function BuscarProfesionalPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; especialidad?: string; ciudad?: string }>;
}) {
  const params = await searchParams;
  const ciudadDetectada = params.ciudad ? null : await detectarCiudadPorIp();
  const resultados = ordenarPorProximidad(buscarProfesionales(params), ciudadDetectada);

  return (
    <div className="mt-landing min-h-screen">
      <header className="flex items-center gap-3 border-b border-black/10 px-6 py-4">
        <Logo size={32} />
        <div className="text-sm font-bold">Mindtwins · Lili Fit</div>
        <Link href="/" className="ml-auto text-sm text-black/50 hover:text-black">
          ← Volver
        </Link>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-14">
        <h1 className="font-serif text-3xl">Encuentra a tu profesional</h1>
        <p className="mt-2 text-black/60">
          Búsqueda determinista por nombre, especialidad o ciudad — sin recomendaciones por IA,
          sin mostrar precios de Poco2h. El precio final lo fija cada profesional.
        </p>
        {ciudadDetectada && (
          <p className="mt-1 text-xs text-[#1abc9c]">
            Detectamos que estás cerca de {ciudadDetectada} — mostramos primero a los
            profesionales de tu zona.
          </p>
        )}

        <form className="mt-8 grid gap-3 md:grid-cols-4" method="get">
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Nombre o palabra clave"
            className="rounded-lg border border-black/15 px-3 py-2 md:col-span-2"
          />
          <input
            name="especialidad"
            defaultValue={params.especialidad ?? ""}
            placeholder="Especialidad (ej. nutricionista)"
            className="rounded-lg border border-black/15 px-3 py-2"
          />
          <input
            name="ciudad"
            defaultValue={params.ciudad ?? ""}
            placeholder="Ciudad"
            className="rounded-lg border border-black/15 px-3 py-2"
          />
          <button className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white md:col-span-4 md:w-fit">
            Buscar
          </button>
        </form>

        <div className="mt-10 grid gap-4">
          {resultados.length === 0 && (
            <p className="text-black/50">No hay profesionales que coincidan con esa búsqueda.</p>
          )}
          {resultados.map((p) => (
            <div key={p.slug} className="flex items-center justify-between rounded-2xl border border-black/10 p-5">
              <div>
                <h3 className="font-semibold">{p.nombre}</h3>
                <p className="text-sm text-[#1abc9c]">{p.especialidad} · {p.ciudad}</p>
                <p className="mt-1 text-sm text-black/60">{p.bio}</p>
              </div>
              <Link
                href={`/clientes/contactar/${p.slug}`}
                className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-[#1abc9c]"
              >
                Contactar
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
