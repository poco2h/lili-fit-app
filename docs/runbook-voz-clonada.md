# Runbook: clonar y probar la voz del profesional (MindTwin)

## Qué es esto

Flujo para que un profesional (owner) suba una muestra de su voz, la
clonemos con ElevenLabs, y pueda probarla con texto libre antes de que
se use en el canal de Voz real (`VozPanel.tsx`) cara al follower.

Estado del resto del stack (para que no se dé por hecho más de lo que hay):

| Pieza | Estado |
|---|---|
| `ELEVENLABS_API_KEY` (Vercel prod) | ✅ configurada |
| Clonación + prueba de voz (`/profesionales/voz`) | ✅ implementado en este runbook |
| Canal de Voz real con el follower (`VozPanel.tsx`) | ⏳ sigue siendo placeholder — no usa el `voice_id` guardado todavía |
| `TAVUS_API_KEY` (avatar videollamada) | ❌ no configurada |
| `HIGGSFIELD_API_KEY` (avatar vídeos RRSS) | ✅ configurada, sin flujo construido |

## Piezas nuevas

- [`src/app/profesionales/voz/page.tsx`](../src/app/profesionales/voz/page.tsx) — UI: sube audio, clona, prueba.
- [`src/app/api/profesionales/voz/resolver-owner/route.ts`](../src/app/api/profesionales/voz/resolver-owner/route.ts) — dado el token de sesión (Supabase Auth del gate `/profesionales/acceso`), busca el owner por email en la tabla `owners`.
- [`src/app/api/profesionales/voz/clonar/route.ts`](../src/app/api/profesionales/voz/clonar/route.ts) — llama a ElevenLabs `POST /v1/voices/add` con el audio, guarda `voice_id` en `twin_profiles`.
- [`src/app/api/conversar/tts/route.ts`](../src/app/api/conversar/tts/route.ts) — ahora acepta un `voiceId` explícito en el body (antes solo leía `ELEVENLABS_VOICE_ID` de entorno), para poder probar antes de fijarlo como el de producción.

## Paso a paso (como profesional)

1. Ten ya una cuenta de "visitante" en `/profesionales/acceso` (email + contraseña) — es el gate de sesión que usa esta página para saber quién eres. Si no la tienes, "Date de alta" ahí primero.
2. Ten también tu alta de negocio hecha en `/profesionales/contratar` (tabla `owners`), **con el mismo email** que usas en el paso 1 — la resolución del owner es por email, no hay un login único todavía que enlace ambos sistemas.
3. Entra en `https://mindtwin-app.vercel.app/profesionales/voz`.
4. Sube un archivo de audio (mp3/wav/m4a) de tu voz — recomendado 1-2 minutos, sin música ni ruido de fondo, hablando de forma natural.
5. Pulsa **"Clonar mi voz →"**. Tarda unos segundos; ElevenLabs devuelve un `voice_id` que se guarda en `twin_profiles.voice_id` (fila con `owner_id` = tu owner, `follower_id` = null).
6. En la sección "Prueba y tunea", escribe cualquier texto y pulsa **"Reproducir con mi voz →"** — se genera el audio con ese `voice_id` y se reproduce en el navegador.
7. Repite el paso 4-5 con muestras distintas si el resultado no te convence — cada clonación crea una voz nueva en ElevenLabs (usa una "voice slot" de tu plan cada vez).

## Cómo tunearla

ElevenLabs no permite "editar" una voz clonada — para tunear:
- Prueba con **muestras de audio distintas** (mejor calidad de grabación, más variedad de entonación) y vuelve a pulsar "Clonar mi voz" — sobreescribe el `voice_id` guardado.
- Ajusta el **texto de prueba** para cubrir los casos reales que usará el follower (frases largas, preguntas, exclamaciones) y escucha cómo suena.
- Si ElevenLabs ofrece ajustes de *stability*/*similarity* en su dashboard (elevenlabs.io → Voices), se pueden tocar ahí directamente sobre el mismo `voice_id` — no hace falta volver a clonar para eso.

## Lo que falta para producción real

- **Conectar `VozPanel.tsx`** (llamada de voz en tiempo real con el follower) al `voice_id` guardado en `twin_profiles`, en vez de mostrar el aviso de "falta configurar". Hoy solo el endpoint de prueba (`/profesionales/voz`) usa el `voice_id` real.
- **Límite de tamaño de archivo**: las funciones serverless de Vercel tienen un límite de payload (~4.5 MB en el plan actual) — una muestra de audio larga o sin comprimir puede superarlo. Si falla la subida, prueba con un archivo más corto o comprimido.
- **Cuota de voces de ElevenLabs**: cada "Clonar mi voz" gasta una voice slot del plan — revisa el dashboard de ElevenLabs antes de clonar muchas veces con audio de prueba.
