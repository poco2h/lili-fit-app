/**
 * Uso real de los scopes de Google concedidos en Mis Fuentes
 * (youtube.readonly + drive.readonly + gmail.readonly) — sin esto, la app
 * pedía permiso de Gmail/Drive/YouTube y nunca llegaba a leer nada, lo cual
 * bloquea la verificación de Google (exige que solo pidas scopes que usas
 * de verdad, y un vídeo de demo enseñando ese uso). Aquí se refresca el
 * token y se extrae una muestra real de texto — no se guarda contenido
 * completo, solo un extracto acotado para calibrar tono en Conversar.
 */

const MAX_MUESTRA_TOTAL = 4000;

export type TokensGoogle = { accessToken: string; refreshToken?: string; expiraEn: string };

export async function refrescarAccessToken(refreshToken: string): Promise<{ accessToken: string; expiraEn: string } | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) return null;
  const expiraEn = new Date(Date.now() + (data.expires_in ?? 3600) * 1000).toISOString();
  return { accessToken: data.access_token, expiraEn };
}

async function googleGet(url: string, accessToken: string): Promise<unknown | null> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return null;
  return res.json();
}

/** YouTube: título+descripción de los últimos vídeos propios — proxy real de "voz pública oral" (la API de captions requiere descarga/parseo de pistas, fuera de alcance de v1). */
async function muestraYoutube(accessToken: string): Promise<string> {
  const data = (await googleGet(
    "https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&maxResults=5&order=date",
    accessToken
  )) as { items?: Array<{ snippet?: { title?: string; description?: string } }> } | null;
  if (!data?.items?.length) return "";
  return data.items
    .map((it) => `${it.snippet?.title ?? ""} — ${(it.snippet?.description ?? "").slice(0, 300)}`)
    .join("\n");
}

/** Drive: texto plano exportado de hasta 3 Google Docs propios — "voz pública escrita". */
async function muestraDrive(accessToken: string): Promise<string> {
  const lista = (await googleGet(
    "https://www.googleapis.com/drive/v3/files?q=" +
      encodeURIComponent("mimeType='application/vnd.google-apps.document' and 'me' in owners") +
      "&pageSize=3&fields=files(id,name)",
    accessToken
  )) as { files?: Array<{ id: string; name: string }> } | null;
  if (!lista?.files?.length) return "";

  const textos = await Promise.all(
    lista.files.map(async (f) => {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}/export?mimeType=text/plain`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return "";
      const texto = await res.text();
      return `[${f.name}] ${texto.slice(0, 600)}`;
    })
  );
  return textos.filter(Boolean).join("\n");
}

/** Gmail: snippet de hasta 5 correos enviados recientes — "tono, vocabulario y patrones de comunicación". */
async function muestraGmail(accessToken: string): Promise<string> {
  const lista = (await googleGet(
    "https://www.googleapis.com/gmail/v1/users/me/messages?labelIds=SENT&maxResults=5",
    accessToken
  )) as { messages?: Array<{ id: string }> } | null;
  if (!lista?.messages?.length) return "";

  const textos = await Promise.all(
    lista.messages.map(async (m) => {
      const msg = (await googleGet(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject`,
        accessToken
      )) as { snippet?: string } | null;
      return msg?.snippet ?? "";
    })
  );
  return textos.filter(Boolean).join("\n");
}

/** Combina YouTube+Drive+Gmail en una única muestra de texto acotada (nunca se guarda el contenido completo). */
export async function extraerMuestraGoogle(accessToken: string): Promise<string> {
  const [youtube, drive, gmail] = await Promise.all([
    muestraYoutube(accessToken).catch(() => ""),
    muestraDrive(accessToken).catch(() => ""),
    muestraGmail(accessToken).catch(() => ""),
  ]);
  const bloques = [
    youtube && `--- YouTube ---\n${youtube}`,
    drive && `--- Drive ---\n${drive}`,
    gmail && `--- Gmail ---\n${gmail}`,
  ].filter(Boolean);
  return bloques.join("\n\n").slice(0, MAX_MUESTRA_TOTAL);
}
