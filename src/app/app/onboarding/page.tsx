import OnboardingFlow from "@/components/app/OnboardingFlow";

export default function OnboardingPage() {
  return (
    <div className="mt-app">
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-6 text-xl font-bold">Crea tu perfil EGO ID + GUT ID</h1>
        <OnboardingFlow ownerName="tu MindTwin" />
      </div>
    </div>
  );
}
