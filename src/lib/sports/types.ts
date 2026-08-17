export type SportsContext = {
  ultimoPartido: { fecha: string; rival: string; resultado: string; statsCeleb: string } | null;
  proximoPartido: { fecha: string; rival: string; competicion: string } | null;
  estadoFisico: "disponible" | "lesionado" | "duda";
  titularPrensa: { texto: string; fecha: string } | null;
  validoHasta: string; // ISO — TTL (V10 §7.2)
};
