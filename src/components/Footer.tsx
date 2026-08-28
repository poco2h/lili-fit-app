import Link from "next/link";
import LogoHormiga from "./LogoHormiga";

type Props = { dark?: boolean };

export default function Footer({ dark = true }: Props) {
  const linkClass = "text-xs font-semibold " + (dark ? "text-white/60 hover:text-white" : "text-[rgb(99,99,99)] hover:text-black");
  return (
    <footer
      className={
        "flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t px-6 py-6 " +
        (dark ? "border-white/10 bg-black" : "border-black/10")
      }
    >
      <span className="flex items-center gap-2">
        <LogoHormiga size={22} dark={dark} />
        <a href="https://mylili.org" target="_blank" rel="noopener noreferrer" className={linkClass}>
          mylili.org
        </a>
      </span>
      <Link href="/privacidad" className={linkClass}>Privacidad</Link>
      <Link href="/terminos" className={linkClass}>Términos</Link>
    </footer>
  );
}
