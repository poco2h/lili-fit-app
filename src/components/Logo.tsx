type LogoProps = {
  variant?: "dark" | "light";
  size?: number;
};

/** Logo oficial de MindTwin (dos nubes MIND/TWIN). */
export default function Logo({ size = 38 }: LogoProps) {
  const height = size;
  const width = Math.round(size * (618 / 267));
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/mindtwin-logo.png"
      alt="MindTwin"
      width={width}
      height={height}
      style={{ height, width: "auto" }}
    />
  );
}
