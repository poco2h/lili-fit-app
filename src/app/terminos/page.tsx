import Link from "next/link";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";

export default function TerminosPage() {
  return (
    <div className="mt-landing min-h-screen">
      <header className="flex items-center gap-3 border-b border-black/10 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={30} />
        </Link>
        <Link href="/" className="ml-auto text-sm text-black/50 hover:text-black">
          ← Volver
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="font-serif text-3xl">Términos y condiciones</h1>
        <p className="mt-2 text-sm text-black/50">Última actualización: 2026.</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-black/70">
          <section>
            <h2 className="text-base font-semibold text-black">1. Quiénes somos</h2>
            <p className="mt-2">
              Mindtwins · Lili Fit es un servicio operado por Poco2h. Al acceder o utilizar
              esta plataforma aceptas estos términos y condiciones.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-black">2. El servicio</h2>
            <p className="mt-2">
              Mindtwins permite a profesionales del fitness y la nutrición crear un gemelo
              cerebral (&quot;MindTwin&quot;) entrenado con su perfil psicológico y su voz, al que sus
              clientes acceden por texto, voz o videollamada. El MindTwin no sustituye el
              consejo médico o psicológico profesional.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-black">3. Cuentas y clave de acceso profesional</h2>
            <p className="mt-2">
              El alta como profesional requiere validar tu credencial mediante una clave de
              acceso de un solo uso. Esta clave es ilimitada en el tiempo — no caduca.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-black">4. Pagos y facturación</h2>
            <p className="mt-2">
              Los profesionales pagan una licencia mensual a Mylili y reciben los cobros de
              sus clientes a través de Stripe Connect, descontando la comisión de
              procesamiento de Stripe. Los precios finales que paga cada cliente los fija el
              profesional y se comunican de forma confidencial tras el alta.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-black">5. Privacidad</h2>
            <p className="mt-2">
              El profesional (Owner) nunca tiene acceso al contenido de las conversaciones ni
              a los tests psicológicos de sus clientes — solo a métricas agregadas de
              actividad y facturación.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-black">6. Contacto</h2>
            <p className="mt-2">
              Para cualquier consulta sobre estos términos, escribe a{" "}
              <a href="mailto:hola@poco2h.org" className="underline">hola@poco2h.org</a>.
            </p>
          </section>
        </div>
      </main>
      <Footer dark={false} />
    </div>
  );
}
