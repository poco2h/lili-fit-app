type LogoProps = {
  variant?: "dark" | "light";
  size?: number;
};

/**
 * Logo de cabecera — solo la nube, blanco y negro, sin la hormiga (esa va
 * en el pie de página, ver LogoHormiga.tsx). Placeholder hasta que llegue
 * el export oficial del Canva de referencia.
 */
export default function Logo({ variant = "dark", size = 38 }: LogoProps) {
  const stroke = variant === "dark" ? "#000000" : "#ffffff";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="MindTwin"
    >
      <path
        d="M27 62c-8 0-14-6-14-13.5S19 35 27 35c1.6-7.8 8.5-13.5 16.8-13.5 8 0 14.8 5.2 17 12.4C69.6 34.3 76 40.6 76 48.3c0 7.5-6.1 13.7-13.7 13.7H27z"
        stroke={stroke}
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
