"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const LINKS_OWNER = [
  { href: "/app/conversar", label: "Mis Conversaciones", icon: "💬" },
  { href: "/app/fuentes", label: "Mis Fuentes", icon: "📂" },
  { href: "/app/cerebro", label: "Mi Cerebro", icon: "🧠" },
  { href: "/app/habitos", label: "Mis Hábitos", icon: "💚" },
  { href: "/app/videos", label: "Mis Vídeos", icon: "🎬" },
  { href: "/app/clientes", label: "Mis Clientes", icon: "👥" },
  { href: "/app/school", label: "Mi School", icon: "🎓" },
];

type Grupo = "canales" | "mindtwin" | "school";

const GRUPOS_FOLLOWER: Array<{
  key: Grupo;
  label: string;
  icon: string;
  hijos: Array<{ href: string; label: string; icon: string; match: (pathname: string, search: URLSearchParams) => boolean }>;
}> = [
  {
    key: "canales",
    label: "Mis Canales",
    icon: "💬",
    hijos: [
      { href: "/app/conversar?role=follower&canal=texto", label: "Texto", icon: "💬", match: (p, s) => p === "/app/conversar" && (s.get("canal") ?? "texto") === "texto" },
      { href: "/app/conversar?role=follower&canal=voz", label: "Voz", icon: "🎙️", match: (p, s) => p === "/app/conversar" && s.get("canal") === "voz" },
      { href: "/app/conversar?role=follower&canal=video", label: "Vídeo", icon: "🎬", match: (p, s) => p === "/app/conversar" && s.get("canal") === "video" },
    ],
  },
  {
    key: "mindtwin",
    label: "Mi MindTwin",
    icon: "🧠",
    hijos: [
      { href: "/app/conversaciones?role=follower", label: "Mis Conversaciones", icon: "🗂️", match: (p) => p === "/app/conversaciones" },
      { href: "/app/fuentes?role=follower", label: "Mis Fuentes", icon: "📂", match: (p) => p === "/app/fuentes" },
      { href: "/app/cerebro?role=follower", label: "Mi Cerebro", icon: "🧠", match: (p) => p === "/app/cerebro" },
      { href: "/app/habitos?role=follower", label: "Mis Hábitos", icon: "💚", match: (p) => p === "/app/habitos" },
    ],
  },
  {
    key: "school",
    label: "Mi School",
    icon: "🎓",
    hijos: [{ href: "/app/school?role=follower", label: "Preguntas frecuentes", icon: "🎓", match: (p) => p === "/app/school" }],
  },
];

function grupoActivoDesdeUrl(pathname: string, search: URLSearchParams): Grupo {
  for (const g of GRUPOS_FOLLOWER) {
    if (g.hijos.some((h) => h.match(pathname, search))) return g.key;
  }
  return "canales";
}

function AppNavFollower({ pathname, search }: { pathname: string; search: URLSearchParams }) {
  const [grupoAbierto, setGrupoAbierto] = useState<Grupo>(() => grupoActivoDesdeUrl(pathname, search));
  const grupo = GRUPOS_FOLLOWER.find((g) => g.key === grupoAbierto)!;

  return (
    <nav className="relative z-10 flex flex-col border-b border-[#1abc9c]/18 bg-black/55 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-center gap-1 px-3 py-2">
        {GRUPOS_FOLLOWER.map((g) => (
          <button
            key={g.key}
            onClick={() => setGrupoAbierto(g.key)}
            className={
              "rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide whitespace-nowrap " +
              (grupoAbierto === g.key ? "bg-[#1abc9c]/10 text-[#1abc9c]" : "text-white/70 hover:text-white")
            }
          >
            {g.icon} {g.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1 border-t border-white/5 px-3 py-1.5">
        {grupo.hijos.map((h) => (
          <Link
            key={h.href}
            href={h.href}
            className={
              "rounded-full px-3 py-1 text-[10.5px] font-bold whitespace-nowrap " +
              (h.match(pathname, search) ? "bg-white text-black" : "text-white/50 hover:text-white/80")
            }
          >
            {h.icon} {h.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function AppNavOwner({ pathname }: { pathname: string }) {
  return (
    <nav className="relative z-10 flex flex-wrap items-center justify-center gap-1 border-b border-[#1abc9c]/18 bg-black/55 px-3 py-2 backdrop-blur-md">
      {LINKS_OWNER.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={
            "rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide whitespace-nowrap " +
            (pathname === l.href ? "bg-[#1abc9c]/10 text-[#1abc9c]" : "text-white/70 hover:text-white")
          }
        >
          {l.icon} {l.label}
        </Link>
      ))}
    </nav>
  );
}

function AppNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFollower = searchParams.get("role") === "follower";

  return isFollower ? <AppNavFollower pathname={pathname} search={searchParams} /> : <AppNavOwner pathname={pathname} />;
}

export default function AppNav() {
  return (
    <Suspense>
      <AppNavInner />
    </Suspense>
  );
}
