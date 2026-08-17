import MisClientes from "@/components/app/MisClientes";

export default function ClientesPage() {
  return (
    <div className="mt-app">
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-6 text-xl font-bold">Mis Clientes</h1>
        <MisClientes />
      </div>
    </div>
  );
}
