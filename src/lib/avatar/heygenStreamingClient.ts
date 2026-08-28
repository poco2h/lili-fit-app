import StreamingAvatar, { AvatarQuality, StreamingEvents, TaskType } from "@heygen/streaming-avatar";

/**
 * Envoltorio del SDK @heygen/streaming-avatar para la videollamada RT.
 * init() no recibe la API key directamente (a diferencia de lo que pedía
 * el prompt original) — llama a /api/heygen/videollamada/iniciar, que
 * cambia HEYGEN_API_KEY (secreto de servidor) por un access token de un
 * solo uso. Exponer la API key cruda como NEXT_PUBLIC_HEYGEN_API_KEY
 * permitiría a cualquiera en el navegador generar vídeos con la cuenta,
 * así que se evita.
 */
export class HeyGenStreamingClient {
  private avatar: StreamingAvatar | null = null;
  private stream: MediaStream | null = null;

  async init(ownerId?: string): Promise<{ avatarEsStock: boolean }> {
    const res = await fetch("/api/heygen/videollamada/iniciar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? `Error ${res.status} iniciando HeyGen`);

    this.avatar = new StreamingAvatar({ token: data.token });
    this.avatar.on(StreamingEvents.STREAM_READY, (mediaStream: MediaStream) => {
      this.stream = mediaStream;
    });
    this.avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
      this.stream = null;
    });

    await this.avatar.createStartAvatar({
      quality: AvatarQuality.High,
      avatarName: data.avatarId,
    });

    return { avatarEsStock: !!data.avatarEsStock };
  }

  async speak(text: string): Promise<void> {
    if (!this.avatar) return;
    await this.avatar.speak({ text, task_type: TaskType.REPEAT });
  }

  getMediaStream(): MediaStream | null {
    return this.stream ?? this.avatar?.mediaStream ?? null;
  }

  async stop(): Promise<void> {
    await this.avatar?.stopAvatar();
    this.avatar = null;
    this.stream = null;
  }
}
