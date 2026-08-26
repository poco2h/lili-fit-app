"use client";

import { Suspense } from "react";
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

const LINKS_FOLLOWER = [
  { href: "/app/conversar?role=follower", label: "Mis Conversaciones", icon: "💬" },
  { href: "/app/fuentes?role=follower", label: "Mis Fuentes", icon: "📂" },
  { href: "/app/cerebro?role=follower", label: "Mi Cerebro", icon: "🧠" },
  { href: "/app/habitos?role=follower", label: "Mis Hábitos", icon: "💚" },
  { href: "/app/school?role=follower", label: "Mi School", icon: "🎓" },
];

function AppNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFollower = searchParams.get("role") === "follower";
  const links = isFollower ? LINKS_FOLLOWER : LINKS_OWNER;

  return (
    <nav className="relative z-10 flex flex-wrap items-center justify-center gap-1 border-b border-[#1abc9c]/18 bg-black/55 px-3 py-2 backdrop-blur-md">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={
            "rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide whitespace-nowrap " +
            (pathname === l.href.split("?")[0] ? "bg-[#1abc9c]/10 text-[#1abc9c]" : "text-white/70 hover:text-white")
          }
        >
          {l.icon} {l.label}
        </Link>
      ))}
    </nav>
  );
}

export default function AppNav() {
  return (
    <Suspense>
      <AppNavInner />
    </Suspense>
  );
}
