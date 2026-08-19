type LogoProps = {
  /** "light" (por defecto) = logo oficial a dos tonos, para fondos blancos. "dark" = variante en blanco/transparente, para fondos negros (headers de /app/*). */
  variant?: "dark" | "light";
  size?: number;
};

/** Logo oficial de MindTwin (dos nubes MIND/TWIN). */
export default function Logo({ variant = "light", size = 38 }: LogoProps) {
  const height = size;
  const width = Math.round(size * (618 / 267));
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={variant === "dark" ? "/mindtwin-logo-dark.png" : "/mindtwin-logo.png"}
      alt="MindTwin"
      width={width}
      height={height}
      style={{ height, width: "auto" }}
    />
  );
}
