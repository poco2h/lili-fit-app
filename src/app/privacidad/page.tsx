import Link from "next/link";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";

export default function PrivacidadPage() {
  return (
    <div className="mt-landing min-h-screen">
      <header className="flex items-center gap-3 border-b border-black/10 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={30} />
        </Link>
        <Link href="/" className="ml-auto text-sm text-black/50 hover:text-black">
          ← Volver
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="font-serif text-3xl">Política de privacidad</h1>
        <p className="mt-2 text-sm text-black/50">Última actualización: 28 de agosto de 2026.</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-black/70">
          <section>
            <h2 className="text-base font-semibold text-black">1. Quiénes somos</h2>
            <p className="mt-2">
              MindTwin (parte del ecosistema Mylili) es un servicio operado por Poco2h. Esta política
              cubre MindTwin · Lili Fit y, de forma general, el resto de aplicaciones de Mylili que
              comparten la misma infraestructura de autenticación. Para dudas sobre esta política,
              escribe a <a href="mailto:hola@poco2h.org" className="underline">hola@poco2h.org</a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-black">2. Qué datos recogemos</h2>
            <p className="mt-2">Según el rol y las fuentes que actives:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><b>Perfil psicológico (EGO ID)</b> — respuestas a tests de personalidad recogidas conversando en Mis Conversaciones.</li>
              <li><b>Perfil de microbiota (GUT ID)</b> — respuestas sobre hábitos digestivos y, si lo conectas, datos de tu proveedor N1.</li>
              <li><b>Voz</b> — si clonas tu voz, un vídeo/audio de referencia y la voz sintética generada (ElevenLabs).</li>
              <li><b>Avatar</b> — foto o vídeo para generar tu avatar visual (Higgsfield/Tavus/HeyGen).</li>
              <li><b>Conversaciones</b> — el historial de mensajes con tu MindTwin (owner) o con el MindTwin de tu profesional (follower).</li>
              <li><b>Datos deportivos y de hábitos</b> — los que aportes en Mis Hábitos, incluyendo wearables si conectas uno (Open Wearables).</li>
              <li><b>Fuentes externas que conectes voluntariamente</b> — Google (YouTube, Drive, Gmail), Instagram, TikTok, WhatsApp. Nunca son obligatorias.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-black">3. Datos de tu cuenta de Google</h2>
            <p className="mt-2">
              Si conectas tu cuenta de Google en Mis Fuentes, pedimos permiso de solo lectura sobre tres
              servicios, cada uno con un propósito concreto:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><b>YouTube (youtube.readonly)</b> — título y descripción de tus vídeos propios más recientes, como muestra de tu forma de expresarte en público.</li>
              <li><b>Drive (drive.readonly)</b> — el texto de hasta 3 documentos de Google Docs de tu propiedad, como muestra de tu forma de escribir.</li>
              <li><b>Gmail (gmail.readonly)</b> — el fragmento (snippet) de hasta 5 correos enviados recientes, como muestra de tu tono y vocabulario.</li>
            </ul>
            <p className="mt-2">
              Con esos extractos generamos una <b>muestra de texto acotada</b> (máximo ~4.000 caracteres)
              que tu MindTwin usa como referencia de estilo al conversar contigo o con tus clientes —
              nunca la reproducimos literalmente ni la mostramos a terceros. No leemos tu bandeja de
              entrada completa, ni tus contactos, ni archivos que no sean Google Docs de tu propiedad.
              Puedes desconectar tu cuenta de Google en cualquier momento desde Mis Fuentes — al hacerlo
              borramos los tokens de acceso y la muestra de texto guardada, y puedes revocar el permiso
              también desde{" "}
              <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="underline">
                myaccount.google.com/permissions
              </a>.
            </p>
            <p className="mt-2 font-medium">
              El uso y la transferencia a cualquier otra app de la información recibida de las APIs de
              Google por parte de MindTwin cumple con la Política de Datos de Usuario de los Servicios de
              API de Google, incluidos los requisitos de Uso Limitado (Limited Use).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-black">4. Con quién compartimos datos</h2>
            <p className="mt-2">
              No vendemos tus datos ni los compartimos con redes publicitarias o brokers de datos. Los
              compartimos únicamente con los proveedores que procesan cada función del servicio, actuando
              como encargados del tratamiento:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><b>Google Gemini</b> — genera las respuestas conversacionales de tu MindTwin.</li>
              <li><b>ElevenLabs</b> — clona y sintetiza tu voz.</li>
              <li><b>Higgsfield y Tavus</b> — generan tu avatar en vídeo y la videollamada en tiempo real.</li>
              <li><b>HeyGen</b> — variante opcional de avatar de máxima calidad, si el profesional la activa.</li>
              <li><b>Supabase</b> — almacena tu perfil y tus datos de forma persistente.</li>
              <li><b>Stripe</b> — procesa pagos y facturación.</li>
              <li><b>Zernio</b> — conecta Instagram, TikTok y WhatsApp.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-black">5. Cuánto tiempo guardamos tus datos</h2>
            <p className="mt-2">
              Mientras tu cuenta esté activa. Si desconectas una fuente externa, borramos inmediatamente
              lo asociado a ella (tokens, muestra de texto). Si eliminas tu cuenta, borramos tu perfil y
              tu historial de conversaciones; puedes pedirlo escribiendo a{" "}
              <a href="mailto:hola@poco2h.org" className="underline">hola@poco2h.org</a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-black">6. Tus derechos</h2>
            <p className="mt-2">
              Puedes acceder, corregir o borrar tus datos, y revocar cualquier fuente externa conectada,
              en cualquier momento desde la app o escribiéndonos. El profesional (Owner) nunca tiene
              acceso al contenido de las conversaciones ni a los tests psicológicos de sus clientes — solo
              a métricas agregadas de actividad y facturación (ver{" "}
              <Link href="/terminos" className="underline">Términos y condiciones</Link>).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-black">7. Contacto</h2>
            <p className="mt-2">
              Para cualquier consulta sobre esta política o tus datos, escribe a{" "}
              <a href="mailto:hola@poco2h.org" className="underline">hola@poco2h.org</a>.
            </p>
          </section>
        </div>
      </main>
      <Footer dark={false} />
    </div>
  );
}
