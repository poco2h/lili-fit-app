"use client";

import { useEffect, useRef } from "react";

/**
 * Fondo de puntos tipo microorganismo para el flujo de registro
 * (contratar → pago → generando) — plano, en canvas 2D, sin líneas de
 * conexión entre partículas. Distinto a propósito del universo 3D de
 * Three.js que usa el panel del profesional/alumno (ParticleBackground):
 * ese se deja intacto, este solo vive en las pantallas de alta.
 */
const COLORS = [
  "#ffffff",
  "#ffffff",
  "#ffffff",
  "#e2e8f0",
  "#1abc9c",
  "#1abc9c",
  "#2dd4bf",
  "#6366f1",
  "#818cf8",
  "#f472b6",
  "#ec4899",
  "#f59e0b",
  "#4ade80",
];
const N = 380;

export function Starfield({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    let W = parent.offsetWidth || 1440;
    let H = parent.offsetHeight || 860;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles = Array.from({ length: N }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      angle: Math.random() * Math.PI * 2,
      speed: 0.07 + Math.random() * 0.24,
      r: Math.random() < 0.12 ? 2.2 + Math.random() * 1.8 : 0.35 + Math.random() * 1.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      baseAlpha: 0.18 + Math.random() * 0.62,
      phase: Math.random() * Math.PI * 2,
      freq: 0.005 + Math.random() * 0.013,
      turnRate: (Math.random() - 0.5) * 0.012,
    }));

    let raf: number;
    function tick() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        p.turnRate += (Math.random() - 0.5) * 0.0008;
        p.turnRate = Math.max(-0.02, Math.min(0.02, p.turnRate));
        p.angle += p.turnRate;
        p.x = (p.x + Math.cos(p.angle) * p.speed + W) % W;
        p.y = (p.y + Math.sin(p.angle) * p.speed + H) % H;
        p.phase += p.freq;
        const a = p.baseAlpha * (0.5 + 0.5 * Math.sin(p.phase));
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    }
    tick();

    const ro = new ResizeObserver(() => {
      const newW = parent.offsetWidth;
      const newH = parent.offsetHeight;
      // ResizeObserver invokes its callback once immediately on observe() —
      // reassigning canvas.width/height clears the bitmap even when the size
      // hasn't actually changed, which would blank the very first frame.
      if (newW === W && newH === H) return;
      W = newW;
      H = newH;
      canvas.width = W;
      canvas.height = H;
    });
    ro.observe(parent);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-0 ${className}`}
      aria-hidden="true"
    />
  );
}
