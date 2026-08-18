"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import LogoHormiga from "@/components/LogoHormiga";
import Footer from "@/components/Footer";
import ConversarPreview from "@/components/landing/ConversarPreview";

const SECCIONES = [
  { nombre: "Conversar", desc: "Tu gemelo atiende a todos tus clientes en texto, voz y videoconferencia — 24/7, en su idioma, con tu psicología y tu metodología." },
  { nombre: "Mis Fuentes", desc: "Alimenta tu gemelo con tu conocimiento: artículos, protocolos, estudios, PDFs o cualquier contenido que uses en consulta." },
  { nombre: "Mi Cerebro", desc: "Tu perfil completo visualizado: EGO ID, GUT ID. Ves exactamente cómo tu gemelo te representa." },
  { nombre: "Mis Hábitos", desc: "Define los hábitos que tu gemelo recomienda a tus clientes según su perfil. Tu gemelo los propone, hace seguimiento y ajusta." },
  { nombre: "Mis Vídeos", desc: "Genera Reels y TikToks con tu avatar digital hablando a cámara, o vídeos de acción con tu cuerpo completo." },
  { nombre: "Mis Clientes", desc: "Dashboard de tus clientes: rachas, alertas, minutos consumidos y facturación. Sin acceso al contenido de sus conversaciones." },
  { nombre: "Mi School", desc: "Explica a tus clientes qué es el EGO ID, el GUT ID y cómo funciona tu MindTwin — contenido estático, sin coste." },
];

export default function ProfesionalesLanding() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="mt-landing min-h-screen">
      <header className="fixed top-0 inset-x-0 z-50 border-b border-black/10 bg-white/95 px-6 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <Link href="/profesionales" className="flex items-center gap-3">
            <Logo size={30} />
            <span className="text-[10px] leading-tight text-[rgb(99,99,99)]">Para profesionales</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-[11px] text-[rgb(99,99,99)]">
            <a href="#sistema" className="hover:text-black">El sistema</a>
            <a href="#proceso" className="hover:text-black">Cómo funciona</a>
            <Link href="/app/fuentes" className="font-bold text-[#1abc9c] hover:text-black">Demo</Link>
            <Link href="/" className="hover:text-black">Versión cliente →</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/profesionales/contratar"
              className="hidden rounded-full bg-black px-[30px] py-[13px] text-[10px] font-semibold text-white hover:bg-[#1abc9c] transition-colors md:inline-block"
            >
              Crear mi MindTwin
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
            <a href="#sistema" onClick={() => setMenuAbierto(false)} className="text-black/70">El sistema</a>
            <a href="#proceso" onClick={() => setMenuAbierto(false)} className="text-black/70">Cómo funciona</a>
            <Link href="/app/fuentes" onClick={() => setMenuAbierto(false)} className="font-bold text-[#1abc9c]">Demo</Link>
            <Link href="/" onClick={() => setMenuAbierto(false)} className="text-black/70">Versión cliente →</Link>
            <Link
              href="/profesionales/contratar"
              onClick={() => setMenuAbierto(false)}
              className="rounded-full bg-black px-[30px] py-[13px] text-center text-[11px] font-semibold text-white"
            >
              Crear mi MindTwin
            </Link>
          </nav>
        )}
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
            <Link
              href="/app/school"
              className="rounded-full border border-black/20 px-[30px] py-[13px] text-[11px] font-semibold text-black hover:border-black"
            >
              Ver cómo funciona
            </Link>
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

        {/* SECCIONES APP */}
        <section className="border-t border-black/10 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(99,99,99)]">
              Tu MindTwin · lo que encuentras dentro
            </p>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl">
              Tu gemelo cerebral. Siete espacios, una sola plataforma.
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
          <div className="flex items-center gap-2">
            <LogoHormiga size={18} dark={false} />
            <span>Copyright@2026</span>
          </div>
          <Link href="/terminos" className="underline">Términos y condiciones</Link>
          <Link href="/" className="underline">Versión cliente →</Link>
        </footer>
        <Footer dark={false} />
      </main>
    </div>
  );
}
