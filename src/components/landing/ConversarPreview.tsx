import ParticleBackground from "@/components/app/LazyParticleBackground";

const MESSAGES = [
  { who: "MindTwin", time: "09:14", text: "Hola. Soy tu MindTwin. ¿En qué trabajamos hoy?" },
  {
    who: "María",
    time: "09:15",
    text: "Tengo una sesión con un deportista en 2 horas y noto que estoy dispersa.",
  },
  {
    who: "MindTwin",
    time: "09:15",
    text: "Cuando hay dispersión antes de una sesión importante, no suele faltar tiempo — hay demasiados frentes abiertos compitiendo por el foco.",
  },
];

/**
 * Preview embebido de la pantalla Conversar dentro de la landing pública (observación 4):
 * mismo fondo de átomos de https://deluxe-cupcake-34d211.netlify.app, visible bajo las burbujas.
 */
export default function ConversarPreview() {
  return (
    <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-3xl border border-black/10 shadow-2xl">
      {/* transform crea un "containing block" para el hijo position:fixed del fondo,
          confinándolo a esta tarjeta en vez de cubrir toda la pantalla (bug real). */}
      <div className="relative h-[420px] bg-[#000003] [transform:translateZ(0)]">
        <ParticleBackground />
        <div className="relative z-10 flex h-full flex-col gap-3 overflow-hidden p-6">
          {MESSAGES.map((m, i) => {
            const isTwin = m.who === "MindTwin";
            return (
              <div key={i} className={isTwin ? "flex flex-col items-start" : "flex flex-col items-end"}>
                <span
                  className={
                    "mb-1 text-[10px] font-extrabold " + (isTwin ? "text-[#1abc9c]" : "text-white")
                  }
                >
                  {m.who} <span className="ml-1 font-normal text-white/30">{m.time}</span>
                </span>
                <div
                  className={
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed " +
                    (isTwin
                      ? "rounded-bl-sm bg-[#1abc9c]/[0.07] text-white/90"
                      : "rounded-br-sm bg-white/[0.11] text-white")
                  }
                >
                  {m.text}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
