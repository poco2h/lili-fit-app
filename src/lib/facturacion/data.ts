export type Factura = {
  id: string;
  numero: string;
  fecha: string; // ISO
  concepto: string;
  importe: number;
  estado: "pagada" | "pendiente";
};

/**
 * Mi Facturación — facturas reales (licencia mensual + sesiones de tus
 * clientes), no el contador de sesión en vivo (eso vive en Conversar).
 * Demo: en producción se genera automáticamente cada mes desde Stripe.
 */
export const FACTURAS_DEMO: Factura[] = [
  { id: "f1", numero: "MT-2026-08", fecha: "2026-08-01", concepto: "Licencia mensual Mylili · Agosto 2026", importe: 49, estado: "pagada" },
  { id: "f2", numero: "MT-2026-07", fecha: "2026-07-01", concepto: "Licencia mensual Mylili · Julio 2026", importe: 49, estado: "pagada" },
  { id: "f3", numero: "MT-2026-06", fecha: "2026-06-01", concepto: "Licencia mensual Mylili · Junio 2026", importe: 49, estado: "pagada" },
  { id: "f4", numero: "MT-2026-09-ANTICIPO", fecha: "2026-09-01", concepto: "Licencia mensual Mylili · Septiembre 2026", importe: 49, estado: "pendiente" },
];

export function totalPendiente(facturas: Factura[]): number {
  return facturas.filter((f) => f.estado === "pendiente").reduce((sum, f) => sum + f.importe, 0);
}
