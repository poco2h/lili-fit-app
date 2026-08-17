"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { TALES_FILOSOFOS, type Filosofo } from "@/lib/ego/talesWeights";

type Props = {
  weights: Record<Filosofo, number>; // 0-1 -> tamaño
  data: Record<Filosofo, number>; // 0-1 -> color (verde=alto, gris=bajo)
};

/**
 * Mi Cerebro · Capa 2 — 9 esferas TALES orbitando (V10 §4.3 y §9):
 * tamaño = tales_weights[filósofo], color = tales_data[filósofo].
 * Three.js puro, sin LLM, coste ~€0. Clic en un nodo abre su tarjeta.
 */
export default function TalesSpheres({ weights, data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [seleccionado, setSeleccionado] = useState<Filosofo | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.set(0, 0, 26);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const group = new THREE.Group();
    scene.add(group);

    const meshes: Array<{ mesh: THREE.Mesh; filosofo: Filosofo; radius: number; speed: number; angle: number }> = [];

    TALES_FILOSOFOS.forEach((filosofo, i) => {
      const peso = weights[filosofo] ?? 0.3;
      const valor = data[filosofo] ?? 0.3;
      const size = 0.6 + peso * 1.6;
      const color = new THREE.Color().setHSL(0.42, 0.65, 0.25 + valor * 0.45); // gris-verde -> turquesa vivo

      const geometry = new THREE.SphereGeometry(size, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.4 + valor * 0.6,
        roughness: 0.4,
        metalness: 0.2,
      });
      const mesh = new THREE.Mesh(geometry, material);
      const orbitRadius = 8 + (i % 3) * 4;
      const angle = (i / TALES_FILOSOFOS.length) * Math.PI * 2;
      mesh.position.set(Math.cos(angle) * orbitRadius, Math.sin(angle * 1.3) * 3, Math.sin(angle) * orbitRadius);
      mesh.userData.filosofo = filosofo;
      group.add(mesh);
      meshes.push({ mesh, filosofo, radius: orbitRadius, speed: 0.08 + (i % 4) * 0.02, angle });
    });

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const point = new THREE.PointLight(0x1abc9c, 1.2, 100);
    point.position.set(10, 10, 10);
    scene.add(point);

    let frameId = 0;
    const animate = () => {
      meshes.forEach((m) => {
        m.angle += m.speed * 0.01;
        m.mesh.position.x = Math.cos(m.angle) * m.radius;
        m.mesh.position.z = Math.sin(m.angle) * m.radius;
      });
      group.rotation.y += 0.0015;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    function onVisibility() {
      if (document.hidden) cancelAnimationFrame(frameId);
      else animate();
    }
    document.addEventListener("visibilitychange", onVisibility);

    function onClick(e: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(group.children);
      if (hits.length > 0) {
        setSeleccionado(hits[0].object.userData.filosofo as Filosofo);
      } else {
        setSeleccionado(null);
      }
    }
    renderer.domElement.addEventListener("click", onClick);

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameId);
      document.removeEventListener("visibilitychange", onVisibility);
      renderer.domElement.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [weights, data]);

  return (
    <div className="relative h-[480px] w-full">
      <div ref={containerRef} className="h-full w-full" />
      {seleccionado && (
        <div className="mt-glass absolute bottom-4 left-4 right-4 p-4 md:left-4 md:right-auto md:w-72">
          <h3 className="text-base font-bold text-[#1abc9c]">{seleccionado}</h3>
          <p className="mt-1 text-sm text-white/70">
            Peso: {Math.round((weights[seleccionado] ?? 0) * 100)}% · Dato acumulado:{" "}
            {Math.round((data[seleccionado] ?? 0) * 100)}%
          </p>
          <button onClick={() => setSeleccionado(null)} className="mt-2 text-xs text-white/40 hover:text-white">
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}
