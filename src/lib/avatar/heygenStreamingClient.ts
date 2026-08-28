import { LiveAvatarSession } from "@heygen/liveavatar-web-sdk";

/**
 * Envoltorio del SDK @heygen/liveavatar-web-sdk para la videollamada RT.
 * Reemplaza a @heygen/streaming-avatar (descontinuado por HeyGen en favor
 * de LiveAvatar, ver comentario en api/heygen/videollamada/iniciar/route.ts).
 * init() no recibe la API key directamente — llama a ese endpoint, que
 * cambia HEYGEN_API_KEY (secreto de servidor) por un session_token de un
 * solo uso. Exponer la API key cruda en el navegador permitiría a
 * cualquiera generar sesiones con la cuenta, así que se evita.
 *
 * Sesión en modo LITE con voiceChat desactivado a propósito: mindtwin-app
 * ya tiene su propio pipeline de mic → STT del navegador (useVoiceInput),
 * así que el micrófono integrado del SDK no se usa — el audio que el
 * avatar reproduce se le manda ya generado (ElevenLabs) vía speakAudio(),
 * no con su propio TTS.
 */
export class HeyGenStreamingClient {
  private session: LiveAvatarSession | null = null;

  async init(ownerId?: string): Promise<{ avatarEsStock: boolean }> {
    const res = await fetch("/api/heygen/videollamada/iniciar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? `Error ${res.status} iniciando HeyGen`);

    this.session = new LiveAvatarSession(data.token, {
      voiceChat: false,
      apiUrl: "https://api.liveavatar.com",
    });
    await this.session.start();

    return { avatarEsStock: !!data.avatarEsStock };
  }

  /** Adjunta el vídeo/audio del avatar a un <video> o <audio> ya montado en el DOM. */
  attach(element: HTMLMediaElement): void {
    this.session?.attach(element);
  }

  /** Hace que el avatar hable un audio ya generado (mp3 en base64, sin el prefijo data:). */
  speakAudio(audioBase64: string): void {
    this.session?.repeatAudio(audioBase64);
  }

  async stop(): Promise<void> {
    await this.session?.stop();
    this.session = null;
  }
}
