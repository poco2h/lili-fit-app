import { MI_SCHOOL } from "@/lib/habitos/data";

export default function SchoolPage() {
  return (
    <div className="mt-app">
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-6 text-xl font-bold">Mi School</h1>
        <p className="mb-4 text-sm text-white/50">100% estático, sin LLM — coste ~€0.</p>
        <div className="space-y-3">
          {MI_SCHOOL.map((item) => (
            <div key={item.pregunta} className="mt-glass p-4">
              <p className="font-semibold text-[#1abc9c]">{item.pregunta}</p>
              <p className="mt-1 whitespace-pre-line text-sm text-white/70">{item.respuesta}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
