# Runbook: voz clonada y avatar del profesional (MindTwin)

## Qué es esto

Flujo para que un profesional (owner) suba una muestra de su voz y una
foto de referencia, se clonen con ElevenLabs (voz) e Higgsfield
(vídeo), y pueda probarlas — voz en el canal de Voz real del follower,
foto en un vídeo V2 de prueba — antes de darlas por buenas.

Estado del resto del stack (para que no se dé por hecho más de lo que hay):

| Pieza | Estado |
|---|---|
| `ELEVENLABS_API_KEY` (Vercel prod) | ✅ configurada |
| Clonación + prueba de voz (`/profesionales/voz`) | ✅ |
| Canal de Voz real con el follower (`VozPanel.tsx`) | ✅ conectado — STT navegador + `/api/conversar` + TTS con el `voice_id` real. Se activa pasando `ownerId` (ver más abajo); sin él sigue en modo placeholder para no romper la demo. |
| `TAVUS_API_KEY` (avatar videollamada V1) | ❌ no configurada — `VideollamadaPanel.tsx` sigue siendo placeholder |
| `HIGGSFIELD_API_KEY` (avatar vídeos RRSS V3/V4) | ✅ configurada |
| Subida de foto + vídeo V2 de prueba (`/profesionales/avatar`) | ✅ |
| V3 (hablar a cámara, lipsync) y "combo" | ❌ Higgsfield no publica todavía un modelo de lipsync documentado — siguen dando error explícito |

## Piezas nuevas — voz

- [`src/app/profesionales/voz/page.tsx`](../src/app/profesionales/voz/page.tsx) — UI: sube audio, clona, prueba.
- [`src/app/api/profesionales/voz/resolver-owner/route.ts`](../src/app/api/profesionales/voz/resolver-owner/route.ts) — dado el token de sesión (Supabase Auth del gate `/profesionales/acceso`), busca el owner por email en la tabla `owners` y devuelve también `voiceId`/`avatarUrl` si ya existen.
- [`src/app/api/profesionales/voz/clonar/route.ts`](../src/app/api/profesionales/voz/clonar/route.ts) — llama a ElevenLabs `POST /v1/voices/add` con el audio, guarda `voice_id` en `twin_profiles`.
- [`src/app/api/conversar/tts/route.ts`](../src/app/api/conversar/tts/route.ts) — acepta un `voiceId` explícito en el body (antes solo leía `ELEVENLABS_VOICE_ID` de entorno).
- [`src/components/app/VozPanel.tsx`](../src/components/app/VozPanel.tsx) — canal de Voz real: si recibe `ownerId` y ese owner tiene `voice_id`, activa micrófono (Web Speech API, solo Chrome/Edge de escritorio) → `/api/conversar` → TTS con ese `voice_id`, reproducido automáticamente.
- Para probarlo con tu propio MindTwin: `https://mindtwin-app.vercel.app/app/conversar?ownerId=<tu owner_id>` → pestaña "🎙️ Voz".

## Piezas nuevas — avatar

- Bucket público **`avatars`** creado en Supabase Storage (proyecto MindTwin, `zjeouwjwohdkfrogxpge`).
- [`src/app/profesionales/avatar/page.tsx`](../src/app/profesionales/avatar/page.tsx) — UI: sube foto, genera vídeo V2 de prueba con esa foto.
- [`src/app/api/profesionales/avatar/subir/route.ts`](../src/app/api/profesionales/avatar/subir/route.ts) — sube la foto al bucket `avatars`, guarda la URL pública en `twin_profiles.avatar_soul_id`.
- [`src/lib/videos/pipeline.ts`](../src/lib/videos/pipeline.ts) `generarVideo()` — acepta un `ownerId` opcional; si el owner tiene `voice_id`/`avatar_soul_id` en `twin_profiles`, los usa en vez de los placeholders fijos (voz "Rachel" pública / foto de picsum.photos).

**Nota de diseño**: `avatar_soul_id` estaba pensado para un "Soul" real de Higgsfield (un concepto de personaje persistente), pero esa API no está documentada todavía — hoy esa columna guarda directamente la URL pública de la foto, que es lo que consume `image2video`. Cuando Higgsfield publique Souls, migrar esta columna a su ID real.

## Paso a paso (como profesional)

1. Ten ya una cuenta de "visitante" en `/profesionales/acceso` (email + contraseña) — es el gate de sesión que usan estas páginas para saber quién eres. Si no la tienes, "Date de alta" ahí primero.
2. Ten también tu alta de negocio hecha en `/profesionales/contratar` (tabla `owners`), **con el mismo email** que usas en el paso 1 — la resolución del owner es por email, no hay un login único todavía que enlace ambos sistemas.
3. **Voz**: entra en `https://mindtwin-app.vercel.app/profesionales/voz`.
   - Sube un archivo de audio (mp3/wav/m4a) de tu voz — recomendado 1-2 minutos, sin música ni ruido de fondo, hablando de forma natural.
   - Pulsa **"Clonar mi voz →"**. Tarda unos segundos; ElevenLabs devuelve un `voice_id` que se guarda en `twin_profiles.voice_id`.
   - En "Prueba y tunea", escribe cualquier texto y pulsa **"Reproducir con mi voz →"**.
   - Repite con muestras distintas si el resultado no convence — cada clonación gasta una "voice slot" del plan de ElevenLabs.
4. **Avatar**: entra en `https://mindtwin-app.vercel.app/profesionales/avatar`.
   - Sube una foto tuya de referencia (buena luz, mirando a cámara).
   - Pulsa **"Subir mi foto →"** — se sube al bucket `avatars` y se guarda la URL en `twin_profiles.avatar_soul_id`.
   - Escribe un guion corto y pulsa **"Generar vídeo de prueba →"** (usa la variante V2 · cuerpo en acción, vía Higgsfield `dop/standard`). El resultado tarda uno o varios minutos — la página hace polling automático contra `/api/videos/estado`.
5. **Canal de Voz real con un follower**: ve a `https://mindtwin-app.vercel.app/app/conversar?ownerId=<tu owner_id>` (tu `owner_id` es el UUID de la tabla `owners`, visible en Supabase) → pestaña "🎙️ Voz" → "Pulsa para hablar" → habla en español → tu MindTwin responde en texto y con tu voz clonada.

## Cómo tunearla

ElevenLabs no permite "editar" una voz clonada — para tunear:
- Prueba con **muestras de audio distintas** (mejor calidad de grabación, más variedad de entonación) y vuelve a pulsar "Clonar mi voz" — sobreescribe el `voice_id` guardado.
- Ajusta el **texto de prueba** para cubrir los casos reales que usará el follower (frases largas, preguntas, exclamaciones) y escucha cómo suena.
- Si ElevenLabs ofrece ajustes de *stability*/*similarity* en su dashboard (elevenlabs.io → Voices), se pueden tocar ahí directamente sobre el mismo `voice_id` — no hace falta volver a clonar para eso.

## Lo que falta para producción real

- **Identidad real del owner en `/app/*`**: el "app" interior (Mis Vídeos, Conversar, etc.) todavía no lee la sesión del owner logueado — hoy se activa la voz/avatar reales pasando `ownerId` a mano por query string (`?ownerId=...`). Para producción hace falta que `/app/*` resuelva el owner real de la sesión (mismo trabajo pendiente que ya bloqueaba el guard de `middleware.ts`).
- **V1 (hablar a cámara) y "combo"** siguen sin funcionar — dependen de un modelo de lipsync que Higgsfield no ha publicado en su API documentada.
- **`TAVUS_API_KEY`** sigue sin configurar — la videollamada en tiempo real (V1, `VideollamadaPanel.tsx`) no tiene esto conectado.
- **Límite de tamaño de archivo**: las funciones serverless de Vercel tienen un límite de payload (~4.5 MB en el plan actual) — una muestra de audio/foto grande puede superarlo. Si falla la subida, prueba con un archivo más corto/comprimido.
- **Cuota de voces de ElevenLabs**: cada "Clonar mi voz" gasta una voice slot del plan — revisa el dashboard de ElevenLabs antes de clonar muchas veces con audio de prueba.
- **Reconocimiento de voz (STT) del canal Voz** usa la Web Speech API del navegador — solo funciona en Chrome/Edge de escritorio con micrófono, y requiere que el usuario dé permiso de micrófono la primera vez.
