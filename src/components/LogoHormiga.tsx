type Props = { size?: number; dark?: boolean };

/**
 * Logo de pie de página — nube + hormiga (diapositiva 3 del Canva de
 * referencia). Placeholder hasta que llegue el export oficial.
 */
export default function LogoHormiga({ size = 32, dark = true }: Props) {
  const antColor = "#1abc9c";
  const cloudStroke = dark ? "#ffffff" : "#000000";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="MindTwin">
      <path
        d="M27 62c-8 0-14-6-14-13.5S19 35 27 35c1.6-7.8 8.5-13.5 16.8-13.5 8 0 14.8 5.2 17 12.4C69.6 34.3 76 40.6 76 48.3c0 7.5-6.1 13.7-13.7 13.7H27z"
        stroke={cloudStroke}
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <g stroke={antColor} strokeWidth="2.4" strokeLinecap="round" fill="none">
        <path d="M40 58 L32 53" />
        <path d="M40 62 L30 62" />
        <path d="M40 66 L32 71" />
        <path d="M60 58 L68 53" />
        <path d="M60 62 L70 62" />
        <path d="M60 66 L68 71" />
        <path d="M46 46 L42 39" />
        <path d="M54 46 L58 39" />
      </g>
      <g fill={antColor}>
        <ellipse cx="50" cy="49" rx="5.5" ry="5" />
        <ellipse cx="50" cy="60" rx="7" ry="6.5" />
        <ellipse cx="50" cy="72" rx="8.5" ry="8" />
      </g>
    </svg>
  );
}
