import AppHeader from "@/components/app/AppHeader";
import AppNav from "@/components/app/AppNav";
import Footer from "@/components/Footer";
import ParticleBackground from "@/components/app/LazyParticleBackground";

/**
 * ParticleBackground vive AQUÍ (una sola vez) y no en cada page.tsx: antes
 * cada navegación desmontaba y volvía a crear el contexto WebGL + 65k
 * partículas desde cero, lo que hacía la app sentirse lenta al cambiar de
 * pantalla. El layout de Next.js persiste entre rutas hijas, así que el
 * fondo ahora se crea una sola vez para toda la sesión /app/*.
 */
export default function AppSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <ParticleBackground />
      <AppHeader />
      <AppNav />
      {children}
      <Footer dark />
    </div>
  );
}
