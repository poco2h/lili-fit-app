import { CLIENTES_DEMO, ordenarClientes, logroPrincipal, hitoSesiones } from "@/lib/clientes/data";

export default function MisClientes() {
  const clientes = ordenarClientes(CLIENTES_DEMO);

  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-white/5 p-3 text-xs text-white/50">
        Solo lectura, sin acceso al contenido de las conversaciones ni a los tests
        psicológicos del cliente (V10 §4.7) — solo sus logros y minutos consumidos.
      </p>
      {clientes.map((c) => {
        const logro = logroPrincipal(c);
        const hito = hitoSesiones(c);
        const minTotal = c.minutos.texto + c.minutos.voz + c.minutos.video;
        return (
          <div key={c.id} className="mt-glass p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{c.nombre}</p>
              {c.alertasActivas > 0 && (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                  {c.alertasActivas} alerta{c.alertasActivas > 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2 rounded-lg bg-[#1abc9c]/[0.07] px-3 py-2">
              <span className="text-lg">{logro.emoji}</span>
              <span className="text-sm font-semibold text-[#1abc9c]">{logro.titulo}</span>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {hito && (
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70">
                  {hito.emoji} {hito.titulo}
                </span>
              )}
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70">
                ⏱ {minTotal} min invertidos contigo
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
