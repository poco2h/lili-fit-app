import {
  CLIENTES_DEMO,
  ordenarClientes,
  minutosMes,
  facturadoMes,
  type ClienteResumen,
} from "@/lib/clientes/data";

const DIAS = [
  ["lun", "Lun"],
  ["mar", "Mar"],
  ["mie", "Mié"],
  ["jue", "Jue"],
  ["vie", "Vie"],
] as const;

function celdaSesion(c: ClienteResumen, dia: (typeof DIAS)[number][0]) {
  const s = c.sesionesSemana[dia];
  if (!s) return <span className="text-white/20">—</span>;
  return (
    <span className="font-semibold text-[#1abc9c]">
      {s.canal} {s.minutos}&apos;
    </span>
  );
}

export default function MisClientes() {
  const clientes = ordenarClientes(CLIENTES_DEMO);
  const totalMin = clientes.reduce((acc, c) => acc + minutosMes(c), 0);
  const totalFacturado = clientes.reduce((acc, c) => acc + facturadoMes(c), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="mt-glass p-4">
          <p className="text-2xl font-bold text-white">{clientes.length}</p>
          <p className="text-[10px] uppercase tracking-wide text-white/40">Clientes activos</p>
        </div>
        <div className="mt-glass p-4">
          <p className="text-2xl font-bold text-[#1abc9c]">{totalMin} min</p>
          <p className="text-[10px] uppercase tracking-wide text-white/40">Este mes</p>
        </div>
        <div className="mt-glass p-4">
          <p className="text-2xl font-bold text-[#1abc9c]">{totalFacturado.toFixed(0)} €</p>
          <p className="text-[10px] uppercase tracking-wide text-white/40">Facturado mes</p>
        </div>
      </div>

      <div className="mt-glass overflow-x-auto p-4">
        <p className="mb-3 text-[10px] text-white/40">
          Sesiones esta semana · T=Texto ({(0.376).toFixed(3)} €/min) · V=Voz ({(0.746).toFixed(3)} €/min) · Vid=Videoconf. ({(1.166).toFixed(3)} €/min)
        </p>
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-white/40">
              <th className="py-2 pr-3 font-normal">Cliente</th>
              {DIAS.map(([key, label]) => (
                <th key={key} className="px-2 py-2 font-normal">{label}</th>
              ))}
              <th className="px-2 py-2 text-right font-normal">Min/mes</th>
              <th className="px-2 py-2 text-right font-normal">€/mes</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id} className="border-b border-white/5">
                <td className="py-2.5 pr-3">
                  <div className="font-semibold text-white">{c.nombre}</div>
                  <div className="text-[11px] text-white/40">{c.especialidad}</div>
                  {c.alertasActivas > 0 && (
                    <span className="mt-1 inline-block rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                      {c.alertasActivas} alerta{c.alertasActivas > 1 ? "s" : ""}
                    </span>
                  )}
                </td>
                {DIAS.map(([key]) => (
                  <td key={key} className="px-2 py-2.5">{celdaSesion(c, key)}</td>
                ))}
                <td className="px-2 py-2.5 text-right font-semibold text-white">{minutosMes(c)}</td>
                <td className="px-2 py-2.5 text-right font-semibold text-[#1abc9c]">{facturadoMes(c).toFixed(1)} €</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-white/10 font-bold">
              <td className="py-3 pr-3 text-[#1abc9c]">TOTAL</td>
              <td colSpan={5} />
              <td className="px-2 py-3 text-right text-white">{totalMin} min</td>
              <td className="px-2 py-3 text-right text-[#1abc9c]">{totalFacturado.toFixed(0)} €</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
