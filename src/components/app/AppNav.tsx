"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/app/conversar", label: "Mis Conversaciones", icon: "💬" },
  { href: "/app/fuentes", label: "Mis Fuentes", icon: "📂" },
  { href: "/app/cerebro", label: "Mi Cerebro", icon: "🧠" },
  { href: "/app/habitos", label: "Mis Hábitos", icon: "💚" },
  { href: "/app/videos", label: "Mis Vídeos", icon: "🎬" },
  { href: "/app/clientes", label: "Mis Clientes", icon: "👥" },
  { href: "/app/school", label: "Mi School", icon: "🎓" },
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="relative z-10 flex flex-wrap items-center gap-1 border-b border-[#1abc9c]/18 bg-black/55 px-3 py-2 backdrop-blur-md">
      {LINKS.map((l) => (
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
