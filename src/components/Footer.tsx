import LogoHormiga from "./LogoHormiga";

type Props = { dark?: boolean };

export default function Footer({ dark = true }: Props) {
  return (
    <footer
      className={
        "flex items-center justify-center gap-2 border-t px-6 py-6 " +
        (dark ? "border-white/10 bg-black" : "border-black/10")
      }
    >
      <LogoHormiga size={22} dark={dark} />
      <a
        href="https://mylili.org"
        target="_blank"
        rel="noopener noreferrer"
        className={"text-xs font-semibold " + (dark ? "text-white/60 hover:text-white" : "text-[rgb(99,99,99)] hover:text-black")}
      >
        mylili.org
      </a>
    </footer>
  );
}
