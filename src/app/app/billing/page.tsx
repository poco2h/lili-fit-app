import Facturacion from "@/components/app/Facturacion";

export default function BillingPage() {
  return (
    <div className="mt-app">
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-6 text-xl font-bold">Mi Facturación</h1>
        <Facturacion />
      </div>
    </div>
  );
}
