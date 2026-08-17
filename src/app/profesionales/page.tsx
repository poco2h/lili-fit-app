import Link from "next/link";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import IncomeCalculator from "@/components/landing/IncomeCalculator";
import ConversarPreview from "@/components/landing/ConversarPreview";

const CANALES = [
  { canal: "💬 Texto", p20: "2,83 €", p40: "2,91 €", p60: "2,99 €" },
  { canal: "🎙️ Voz", p20: "6,17 €", p40: "9,59 €", p60: "13,01 €" },
  { canal: "🎥 Videoconferencia", p20: "13,87 €", p40: "24,98 €", p60: "36,09 €" },
];

const SECCIONES = [
  { nombre: "Conversar", desc: "Tu gemelo atiende a todos tus clientes en texto, voz y videoconferencia — 24/7, en su idioma, con tu psicología y tu metodología." },
  { nombre: "Mis Fuentes", desc: "Alimenta tu gemelo con tu conocimiento: artículos, protocolos, estudios, PDFs o cualquier contenido que uses en consulta." },
  { nombre: "Mi Cerebro", desc: "Tu perfil completo visualizado: EGO ID, GUT ID y la voz clonada activa. Ves exactamente cómo tu gemelo te representa." },
  { nombre: "Mis Hábitos", desc: "Define los hábitos que recomiendas a tus clientes según su perfil. Tu gemelo los propone, hace seguimiento y ajusta." },
  { nombre: "Mis Vídeos", desc: "Genera Reels y TikToks con tu avatar digital hablando a cámara, o vídeos de acción con tu cuerpo completo." },
  { nombre: "Mis Marcas", desc: "Gestiona un catálogo de marcas que recomiendas. Tu gemelo las menciona de forma orgánica en conversaciones relevantes." },
  { nombre: "Mis Clientes", desc: "Dashboard de tus clientes: rachas, alertas, minutos consumidos y billing. Sin acceso al contenido de sus conversaciones." },
  { nombre: "Mi School", desc: "Explica a tus clientes qué es el EGO ID, el GUT ID y cómo funciona tu MindTwin — contenido estático, sin coste." },
];

export default function ProfesionalesLanding() {
  return (
    <div className="mt-landing min-h-screen">
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between border-b border-black/10 bg-white/95 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Logo size={34} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold leading-tight">Mindtwins · Lili Fit</span>
              <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-600">
                Demo
              </span>
            </div>
            <div className="text-[10px] leading-tight text-[rgb(99,99,99)]">Para profesionales</div>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-[11px] text-[rgb(99,99,99)]">
          <a href="#sistema" className="hover:text-black">El sistema</a>
          <a href="#proceso" className="hover:text-black">Cómo funciona</a>
          <a href="#precios" className="hover:text-black">Precios</a>
          <Link href="/app/fuentes" className="font-bold text-[#1abc9c] hover:text-black">Ver demo del app →</Link>
          <Link href="/" className="hover:text-black">Versión cliente →</Link>
        </nav>
        <Link
          href="/profesionales/contratar"
          className="rounded-full bg-black px-[30px] py-[13px] text-[10px] font-semibold text-white hover:bg-[#1abc9c] transition-colors"
        >
          Crear mi MindTwin
        </Link>
      </header>

      <main className="pt-24">
        {/* HERO */}
        <section className="mx-auto max-w-5xl px-6 py-20 text-center">
          <p className="text-[10px] text-[rgb(99,99,99)]">
            Para nutricionistas · entrenadores · coaches
          </p>
          <h1 className="mt-8 font-serif text-[42px] leading-[1.05] font-normal text-black md:text-[64px] md:leading-[1.05] lg:text-[79.2px] lg:leading-[83.16px]">
            Tu doble digital.
            <br />
            <em className="font-normal not-italic text-[rgb(99,99,99)]">Sin límite de clientes.</em>
          </h1>
          <p className="mx-auto mt-11 max-w-2xl text-[15px] font-light leading-[26.25px] text-[rgb(99,99,99)]">
            Lili Fit crea tu gemelo cerebral entrenado con tu psicología, tu voz y tu
            metodología. Atiende a todos tus clientes 24/7 en texto, voz y vídeo — sin que
            estés presente.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/profesionales/contratar"
              className="rounded-full bg-black px-[30px] py-[13px] text-[11px] font-semibold text-white hover:bg-[#1abc9c] transition-colors"
            >
              Crear mi MindTwin →
            </Link>
            <a
              href="#proceso"
              className="rounded-full border border-black/20 px-[30px] py-[13px] text-[11px] font-semibold text-black hover:border-black"
            >
              Ver cómo funciona
            </a>
          </div>
          <div className="mt-14 grid grid-cols-3 gap-6 text-center">
            {[["24/7", "Disponibilidad"], ["50+", "Idiomas"], ["3×20'", "Para configurarlo"]].map(
              ([n, l]) => (
                <div key={l}>
                  <div className="text-3xl font-serif">{n}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-wide text-[rgb(99,99,99)]">{l}</div>
                </div>
              )
            )}
          </div>
        </section>

        {/* EL SISTEMA */}
        <section id="sistema" className="border-t border-black/10 bg-[#f9f9f9] px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(99,99,99)]">El sistema</p>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl">
              Creas tu gemelo cerebral. Tus clientes acceden a él 24/7.
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-black/10 bg-white p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-[#1abc9c]">
                  Tú · Owner · Profesional
                </p>
                <h3 className="mt-2 text-xl font-semibold">Creas tu MindTwin</h3>
                <p className="mt-2 text-sm text-[rgb(99,99,99)]">
                  Tres sesiones conversacionales de 20 minutos. El sistema aprende cómo
                  piensas, cómo hablas y cómo decides. Clona tu voz. Construye tu perfil
                  completo.
                </p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-[#1abc9c]">
                  Tus clientes · Followers
                </p>
                <h3 className="mt-2 text-xl font-semibold">Acceden a tu gemelo</h3>
                <p className="mt-2 text-sm text-[rgb(99,99,99)]">
                  Cada cliente habla con tu MindTwin cuando necesita. Texto, voz o vídeo en
                  tiempo real — tu metodología, tu tono, tus respuestas.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PREVIEW CONVERSAR — fondo átomos, igual a la referencia */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(99,99,99)]">Conversar</p>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl">
              Tu perfil habla por ti, en cualquier idioma, a cualquier hora.
            </h2>
          </div>
          <ConversarPreview />
        </section>

        {/* PROCESO */}
        <section id="proceso" className="border-t border-black/10 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(99,99,99)]">El proceso</p>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl">
              En solo tres sesiones, dispones de un gemelo mental para siempre.
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                { s: "Sesión 01 · 20 min", t: "EGO ID I", d: "Eneagrama, Big Five (OCEAN), valores y estilo de comunicación." },
                { s: "Sesión 02 · 20 min", t: "EGO ID II", d: "Estilo de apego, inteligencia emocional, perfil motivacional." },
                { s: "Sesión 03 · 20 min", t: "GUT ID + activación", d: "Microbioma (28 preguntas), grabas tu voz y un vídeo corto. Tu gemelo queda activo." },
              ].map((step) => (
                <div key={step.t} className="rounded-2xl border border-black/10 p-6">
                  <p className="text-xs uppercase tracking-wide text-[rgb(99,99,99)]">{step.s}</p>
                  <h3 className="mt-2 text-lg font-semibold">{step.t}</h3>
                  <p className="mt-2 text-sm text-[rgb(99,99,99)]">{step.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRECIOS */}
        <section id="precios" className="border-t border-black/10 bg-[#f9f9f9] px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(99,99,99)]">Precios</p>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl">Tú no pagas, pagan tus clientes.</h2>
            <p className="mt-3 max-w-2xl text-[rgb(99,99,99)]">
              Tu licencia mensual de Mylili te da acceso ilimitado al sistema. Tus clientes
              pagan por sesión según el canal y la duración elegida. Tú fijas el precio final
              de tu MindTwin.
            </p>

            <div className="mt-8 overflow-x-auto rounded-2xl border border-black/10 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-left text-[rgb(99,99,99)]">
                    <th className="p-4">Canal</th>
                    <th className="p-4">20 minutos</th>
                    <th className="p-4">40 minutos</th>
                    <th className="p-4">60 minutos</th>
                  </tr>
                </thead>
                <tbody>
                  {CANALES.map((row) => (
                    <tr key={row.canal} className="border-b border-black/5 last:border-0">
                      <td className="p-4 font-medium">{row.canal}</td>
                      <td className="p-4">{row.p20} <span className="text-[rgb(99,99,99)]">IVA incl.</span></td>
                      <td className="p-4">{row.p40} <span className="text-[rgb(99,99,99)]">IVA incl.</span></td>
                      <td className="p-4">{row.p60} <span className="text-[rgb(99,99,99)]">IVA incl.</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-[rgb(99,99,99)]">
              * Precios PVP finales con IVA incluido. Billing por minutos reales de sesión: si
              el cliente contrata 40 min y usa 28, paga por 28 minutos. Sin permanencia.
            </p>

            <IncomeCalculator />
          </div>
        </section>

        {/* SECCIONES APP */}
        <section className="border-t border-black/10 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(99,99,99)]">
              Tu MindTwin · lo que encuentras dentro
            </p>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl">
              Tu gemelo cerebral. Ocho espacios, una sola plataforma.
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {SECCIONES.map((s) => (
                <div key={s.nombre} className="rounded-2xl border border-black/10 p-6">
                  <h3 className="text-base font-semibold">{s.nombre}</h3>
                  <p className="mt-2 text-sm text-[rgb(99,99,99)]">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section id="cta" className="border-t border-black/10 bg-black px-6 py-20 text-center text-white">
          <h2 className="font-serif text-3xl md:text-4xl">Empieza hoy. Activo en 60 minutos.</h2>
          <Link
            href="/profesionales/contratar"
            className="mt-6 inline-block rounded-full bg-[#1abc9c] px-8 py-3 text-sm font-semibold text-black hover:opacity-90"
          >
            Crear mi MindTwin →
          </Link>
        </section>

        <footer className="flex flex-col items-center gap-4 px-6 py-10 text-sm text-[rgb(99,99,99)]">
          <div>Mindtwins · Lili Fit · © 2026 · Lili Fit es una marca de Poco2h</div>
          <Link href="/" className="underline">Versión cliente →</Link>
        </footer>
        <Footer dark={false} />
      </main>
    </div>
  );
}
