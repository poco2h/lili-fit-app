"use client";

import dynamic from "next/dynamic";

/**
 * Carga diferida de Three.js (rendimiento): el bundle de partículas solo se
 * descarga y ejecuta en el navegador, nunca en el servidor, y no bloquea el
 * primer render del resto de la pantalla mientras se prepara.
 */
const ParticleBackground = dynamic(() => import("./ParticleBackground"), { ssr: false });

export default ParticleBackground;
