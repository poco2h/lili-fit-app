"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import LogoHormiga from "@/components/LogoHormiga";
import Footer from "@/components/Footer";
import ConversarPreview from "@/components/landing/ConversarPreview";
import { MI_SCHOOL } from "@/lib/habitos/data";

const PASOS = [
  { n: "01", t: "El profesional publica su gemelo cerebral", d: "En 3 sesiones de 20 min, tu entrenador o nutricionista construye su MindTwin: EGO ID, GUT ID, voz clonada y avatar." },
  { n: "02", t: "Tú contratas el servicio Mindtwins", d: "Encuentras a tu profesional en Lili Fit y activas el acceso a su gemelo. Pagas solo las sesiones que uses." },
  { n: "03", t: "Generas tu propio gemelo cerebral", d: "En 3 conversaciones de 20 min construyes tu Mi MindTwin: EGO ID y voz, para respuestas 100% personalizadas." },
  { n: "04", t: "Ambos gemelos conversan entre ellos", d: "El gemelo de tu profesional conoce tu EGO ID y tu microbioma. Cada sesión es para ti — no genérica." },
];

const CANALES = [
  { t: "Texto", d: "Chat disponible siempre. Pregunta, recibe un plan, revisa tu progreso.", tag: "RESPUESTA INSTANTÁNEA · 24/7" },
  { t: "Voz", d: "Habla con tu profesional — con su voz real. Sin esperas, sin agenda, en tiempo real.", tag: "VOZ REAL · TIEMPO REAL · 24/7" },
  { t: "Videoconferencia", d: "Videollamada en tiempo real con el avatar digital de tu profesional.", tag: "VIDEOLLAMADA REAL · SIN AGENDA" },
];

const SECCIONES = [
  { t: "Conversar", d: "El espacio principal de sesiones. Texto, voz o videoconferencia — disponible 24/7, adaptado a tu perfil." },
  { t: "Mis Fuentes", d: "El conocimiento de tu profesional para ti: artículos, vídeos y planes que tu gemelo te recomienda." },
  { t: "Mi Cerebro", d: "Tu perfil completo visualizado: EGO ID y GUT ID. Ves quién eres — y cómo tu gemelo te ve." },
  { t: "Mis Hábitos", d: "Seguimiento de hábitos diseñados para tu perfil: entrenamiento, nutrición, sueño y recuperación." },
  { t: "Tu propio gemelo cerebral", d: "Clon del gemelo mental del profesional." },
];

export default function FollowerLanding() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="mt-landing min-h-screen">
      <header className="fixed top-0 inset-x-0 z-50 border-b border-black/10 bg-white/95 px-6 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Logo size={30} />
            <span className="text-[10px] leading-tight text-[rgb(99,99,99)]">Para usuarios</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-[11px] text-[rgb(99,99,99)]">
            <a href="#school" className="hover:text-black">Cómo funciona</a>
            <a href="#canales" className="hover:text-black">Canales</a>
            <Link href="/app/fuentes" className="font-bold text-[#1abc9c] hover:text-black">Demo</Link>
            <Link href="/profesionales" className="hover:text-black">Soy profesional</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/clientes/buscar"
              className="hidden rounded-full bg-black px-[30px] py-[13px] text-[10px] font-semibold text-white hover:bg-[#1abc9c] transition-colors md:inline-block"
            >
              Encontrar mi profesional
            </Link>
            <button
              onClick={() => setMenuAbierto((v) => !v)}
              aria-label="Abrir menú"
              className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-lg border border-black/15 md:hidden"
            >
              <span className="h-[1.5px] w-5 bg-black" />
              <span className="h-[1.5px] w-5 bg-black" />
              <span className="h-[1.5px] w-5 bg-black" />
            </button>
          </div>
        </div>
        {menuAbierto && (
          <nav className="mt-3 flex flex-col gap-4 border-t border-black/10 pt-3 text-sm md:hidden">
            <a href="#school" onClick={() => setMenuAbierto(false)} className="text-black/70">Cómo funciona</a>
            <a href="#canales" onClick={() => setMenuAbierto(false)} className="text-black/70">Canales</a>
            <Link href="/app/fuentes" onClick={() => setMenuAbierto(false)} className="font-bold text-[#1abc9c]">Demo</Link>
            <Link href="/profesionales" onClick={() => setMenuAbierto(false)} className="text-black/70">Soy profesional</Link>
            <Link
              href="/clientes/buscar"
              onClick={() => setMenuAbierto(false)}
              className="rounded-full bg-black px-[30px] py-[13px] text-center text-[11px] font-semibold text-white"
            >
              Encontrar mi profesional
            </Link>
          </nav>
        )}
      </header>

      <main className="pt-24">
        {/* HERO */}
        <section className="mx-auto max-w-5xl px-6 py-20 text-center">
          <p className="text-[10px] text-[rgb(99,99,99)]">
            Tu entrenador · tu nutricionista · siempre contigo
          </p>
          <h1 className="mt-8 font-serif text-[42px] leading-[1.05] font-normal text-black md:text-[58px] md:leading-[1.05] lg:text-[72px] lg:leading-[74.16px]">
            Tu profesional fitness,
            <br />
            <em className="font-normal not-italic text-[rgb(99,99,99)]">sin horario.</em>
          </h1>
          <p className="mx-auto mt-11 max-w-2xl text-[15px] font-light leading-[26.25px] text-[rgb(99,99,99)]">
            Accede al gemelo cerebral de tu entrenador o nutricionista cuando lo necesites —
            en texto, con su voz o en videollamada. 24 horas, 7 días, 50 idiomas.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/clientes/buscar"
              className="rounded-full bg-black px-[30px] py-[13px] text-[11px] font-semibold text-white hover:bg-[#1abc9c] transition-colors"
            >
              Encontrar mi profesional →
            </Link>
            <a
              href="#school"
              className="rounded-full border border-black/20 px-[30px] py-[13px] text-[11px] font-semibold text-black hover:border-black"
            >
              Cómo funciona
            </a>
          </div>
        </section>

        {/* SCHOOL — cómo funciona, formato claro como en /clientes/buscar */}
        <section id="school" className="border-t border-black/10 px-6 py-20">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(99,99,99)]">
              Cómo funciona
            </p>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl">Mi School.</h2>
            <div className="mt-8 space-y-3">
              {MI_SCHOOL.map((item) => (
                <div key={item.pregunta} className="rounded-2xl border border-black/10 p-5">
                  <p className="font-semibold text-black">{item.pregunta}</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-[rgb(99,99,99)]">{item.respuesta}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PREVIEW CONVERSAR */}
        <section id="que-es" className="px-6 py-10">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(99,99,99)]">
              Una conversación real de Lili Fit
            </p>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl">
              Tu profesional te conoce de verdad — psicología + microbioma
            </h2>
          </div>
          <ConversarPreview />
        </section>

        {/* PASOS */}
        <section className="border-t border-black/10 bg-[#f9f9f9] px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(99,99,99)]">
              ¿Qué es Mindtwins · Lili Fit?
            </p>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl">
              Tu profesional fitness. Su gemelo cerebral, disponible 24/7.
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {PASOS.map((p) => (
                <div key={p.n} className="rounded-2xl border border-black/10 bg-white p-6">
                  <span className="text-xs font-bold text-[#1abc9c]">PASO {p.n}</span>
                  <h3 className="mt-2 text-lg font-semibold">{p.t}</h3>
                  <p className="mt-2 text-sm text-[rgb(99,99,99)]">{p.d}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-[rgb(99,99,99)]">
              Todo en menos de 2 horas de configuración · Activo para siempre
            </p>
          </div>
        </section>

        {/* CANALES */}
        <section id="canales" className="border-t border-black/10 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(99,99,99)]">Los canales</p>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl">Elige cómo quieres conectar hoy.</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {CANALES.map((c) => (
                <div key={c.t} className="rounded-2xl border border-black/10 p-6">
                  <h3 className="text-lg font-semibold">{c.t}</h3>
                  <p className="mt-2 text-sm text-[rgb(99,99,99)]">{c.d}</p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[#1abc9c]">
                    {c.tag}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECCIONES */}
        <section className="border-t border-black/10 bg-[#f9f9f9] px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(99,99,99)]">
              Mi MindTwin · lo que encuentras dentro
            </p>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl">
              Tu gemelo cerebral. Cinco espacios, una sola experiencia.
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {SECCIONES.map((s) => (
                <div key={s.t} className="rounded-2xl border border-black/10 bg-white p-6">
                  <h3 className="text-base font-semibold">{s.t}</h3>
                  <p className="mt-2 text-sm text-[rgb(99,99,99)]">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section id="cta" className="border-t border-black/10 bg-black px-6 py-20 text-center text-white">
          <h2 className="font-serif text-3xl md:text-4xl">Tu profesional. Hoy mismo.</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            Sin permanencia, sin suscripción. Pagas solo las sesiones que uses.
          </p>
          <Link
            href="/clientes/buscar"
            className="mt-6 inline-block rounded-full bg-[#1abc9c] px-8 py-3 text-sm font-semibold text-black hover:opacity-90"
          >
            Encontrar mi profesional →
          </Link>
        </section>

        <footer className="flex flex-col items-center gap-4 px-6 py-10 text-sm text-[rgb(99,99,99)]">
          <div className="flex items-center gap-2">
            <LogoHormiga size={18} dark={false} />
            <span>Copyright@2026</span>
          </div>
          <Link href="/terminos" className="underline">Términos y condiciones</Link>
          <Link href="/profesionales" className="underline">Para profesionales →</Link>
        </footer>
        <Footer dark={false} />
      </main>
    </div>
  );
}
