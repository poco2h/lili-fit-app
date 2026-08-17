"use client";

import { FACTURAS_DEMO, totalPendiente } from "@/lib/facturacion/data";

function descargar(f: (typeof FACTURAS_DEMO)[number]) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Factura ${f.numero}</title></head>
  <body style="font-family:sans-serif;padding:40px;">
    <h1>Factura ${f.numero}</h1>
    <p><b>Fecha:</b> ${new Date(f.fecha).toLocaleDateString("es-ES")}</p>
    <p><b>Concepto:</b> ${f.concepto}</p>
    <p><b>Importe:</b> ${f.importe.toFixed(2)} € (IVA incluido)</p>
    <p><b>Estado:</b> ${f.estado === "pagada" ? "Pagada" : "Pendiente de pago"}</p>
    <hr><p style="color:#888;font-size:12px;">Mindtwins · Lili Fit — Poco2h</p>
  </body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `factura-${f.numero}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Facturacion() {
  const pendiente = totalPendiente(FACTURAS_DEMO);

  return (
    <div className="space-y-4">
      <div className="mt-glass flex items-center justify-between p-4">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-white/40">Pendiente de pago</p>
          <p className="text-2xl font-bold text-[#1abc9c]">{pendiente.toFixed(2)} €</p>
        </div>
        <p className="max-w-xs text-right text-xs text-white/40">
          Tu licencia se cobra automáticamente cada mes. Las sesiones de tus clientes las paga cada cliente directamente — aquí solo ves tu licencia.
        </p>
      </div>

      <div className="space-y-2">
        {FACTURAS_DEMO.map((f) => (
          <div key={f.id} className="mt-glass flex items-center justify-between p-4">
            <div>
              <p className="font-semibold">{f.numero}</p>
              <p className="text-xs text-white/50">{f.concepto}</p>
              <p className="text-xs text-white/35">{new Date(f.fecha).toLocaleDateString("es-ES")}</p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={
                  "rounded-full px-2.5 py-1 text-[10px] font-bold " +
                  (f.estado === "pagada" ? "bg-[#1abc9c]/15 text-[#1abc9c]" : "bg-amber-500/15 text-amber-400")
                }
              >
                {f.estado === "pagada" ? "Pagada" : "Pendiente"}
              </span>
              <span className="w-16 text-right font-bold">{f.importe.toFixed(2)} €</span>
              <button onClick={() => descargar(f)} className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-black">
                Descargar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
