import MisAlumnos from "@/components/app/MisAlumnos";

export default function AlumnosPage() {
  return (
    <div className="mt-app">
      <div className="relative z-10 mx-auto max-w-4xl px-4 py-10">
        <h1 className="mb-6 text-xl font-bold">Mis Alumnos</h1>
        <MisAlumnos />
      </div>
    </div>
  );
}
