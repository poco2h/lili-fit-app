import { LiveAvatarSession, SessionEvent } from "@heygen/liveavatar-web-sdk";

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

  /**
   * Adjunta el vídeo/audio del avatar a un <video> o <audio> ya montado en
   * el DOM. session.attach() del SDK es una foto fija — si los tracks
   * remotos aún no han llegado, no hace nada y no se reintenta solo. En la
   * práctica los tracks a veces ya llegan MIENTRAS `session.start()`
   * todavía está resolviendo (confirmado con logs en producción) — es
   * decir, SESSION_STREAM_READY puede dispararse antes de que este método
   * llegue siquiera a registrar el listener, y en ese caso nunca lo
   * recibiríamos. Por eso se comprueba el estado real de los tracks
   * (`_remoteVideoTrack`/`_remoteAudioTrack`, `private` en los tipos del
   * SDK pero accesibles en runtime) en vez de fiarse solo del evento.
   */
  attach(element: HTMLMediaElement, onListo?: () => void): void {
    if (!this.session) return;
    const session = this.session;
    const tracksListos = () => {
      const s = session as unknown as { _remoteVideoTrack: unknown; _remoteAudioTrack: unknown };
      return !!s._remoteVideoTrack && !!s._remoteAudioTrack;
    };
    if (tracksListos()) {
      session.attach(element);
      onListo?.();
      return;
    }
    session.on(SessionEvent.SESSION_STREAM_READY, () => {
      session.attach(element);
      onListo?.();
    });
  }

  /**
   * Hace que el avatar hable un audio ya generado. Tiene que ser PCM 16-bit
   * sin comprimir a 24kHz mono, en base64 — confirmado contra el servidor
   * real: mandarlo sin base64 devuelve "invalid base64 audio data" por el
   * websocket, y mandar otro formato (mp3, aunque vaya en base64 válido)
   * decodifica bien pero suena a ruido porque el contenido no es PCM.
   */
  speakAudio(pcm24kBase64: string): void {
    this.session?.repeatAudio(pcm24kBase64);
  }

  async stop(): Promise<void> {
    await this.session?.stop();
    this.session = null;
  }
}
