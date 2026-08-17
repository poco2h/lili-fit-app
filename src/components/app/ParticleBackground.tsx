"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Fondo "universo neuronal" — reconstruido 1:1 a partir del shader real de
 * REF_MisFuentes_LOADED.html (carpeta MINDTWINS/MT MIS FUENTES), no
 * inventado: partículas HSL arcoíris + sinapsis pulsantes + cámara
 * orbitando. Debe verse en toda la pantalla, incluso detrás de los textos
 * (las cards usan fondo semitransparente, nunca opaco).
 */
export default function ParticleBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let W = window.innerWidth;
    let H = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(68, W / H, 0.5, 3000);
    camera.position.z = 390;

    const canvas = document.createElement("canvas");
    container.appendChild(canvas);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000003, 1);

    const onResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      renderer.setSize(W, H);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    const mobile = W < 600;
    const N = mobile ? 28000 : 65000;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const sz = new Float32Array(N);
    const pid = new Float32Array(N);
    const C = new THREE.Color();

    for (let i = 0; i < N; i++) {
      const r = Math.pow(Math.random(), 0.5) * 310;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      pid[i] = i;
      const h = Math.random();
      C.setHSL(h, 0.65 + Math.random() * 0.35, 0.4 + Math.random() * 0.4);
      col[i * 3] = C.r;
      col[i * 3 + 1] = C.g;
      col[i * 3 + 2] = C.b;
      sz[i] = Math.random() < 0.08 ? 2.8 + Math.random() * 3.2 : 0.3 + Math.random() * 1.1;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(sz, 1));
    geo.setAttribute("pid", new THREE.BufferAttribute(pid, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `attribute float size;attribute float pid;varying vec3 vC;varying float vA;uniform float time;void main(){vC=color;float t=time*0.11;float ph=pid*0.00038;vec3 p=position;p.x+=sin(t+ph)*2.4;p.y+=cos(t*0.71+ph*1.3)*2.4;p.z+=sin(t*0.58+ph*0.79)*2.4;vec4 mv=modelViewMatrix*vec4(p,1.0);gl_PointSize=size*(295.0/-mv.z);vA=1.0-smoothstep(110.0,370.0,-mv.z);gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `varying vec3 vC;varying float vA;void main(){vec2 uv=gl_PointCoord-0.5;float r=length(uv)*2.0;if(r>1.0)discard;float core=exp(-r*r*5.5);float halo=exp(-r*r*1.4)*0.42;float a=(core+halo)*vA*0.88;gl_FragColor=vec4(vC+vec3(core*0.22),a);}`,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      vertexColors: true,
    });
    scene.add(new THREE.Points(geo, mat));

    const SYN = mobile ? 200 : 500;
    const synP = new Float32Array(SYN * 3);
    const synSz = new Float32Array(SYN);
    const synAl = new Float32Array(SYN);
    const synCl = new Float32Array(SYN * 3);
    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute("position", new THREE.BufferAttribute(synP, 3));
    sGeo.setAttribute("size", new THREE.BufferAttribute(synSz, 1));
    sGeo.setAttribute("alpha", new THREE.BufferAttribute(synAl, 1));
    sGeo.setAttribute("color", new THREE.BufferAttribute(synCl, 3));
    const sMat = new THREE.ShaderMaterial({
      vertexShader: `attribute float size;attribute float alpha;varying vec3 vC;varying float vA;void main(){vC=color;vA=alpha;vec4 mv=modelViewMatrix*vec4(position,1.0);float ds=clamp(180.0/-mv.z,0.25,2.8);gl_PointSize=size*ds;gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `varying vec3 vC;varying float vA;void main(){vec2 uv=gl_PointCoord-0.5;float r=length(uv);if(r>0.5)discard;float sh=exp(-uv.y*uv.y*260.0)*exp(-abs(uv.x)*13.0);float sv=exp(-uv.x*uv.x*260.0)*exp(-abs(uv.y)*13.0);float sd1=exp(-(uv.x+uv.y)*(uv.x+uv.y)*180.0)*exp(-abs(uv.x-uv.y)*9.0);float sd2=exp(-(uv.x-uv.y)*(uv.x-uv.y)*180.0)*exp(-abs(uv.x+uv.y)*9.0);float core=exp(-r*r*50.0);float star=clamp(max(max(sh,sv),max(sd1,sd2))+core*2.0,0.0,1.0);gl_FragColor=vec4(vC+vec3(core*0.55),star*vA);}`,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      vertexColors: true,
    });
    scene.add(new THREE.Points(sGeo, sMat));

    const pairs: number[] = [];
    const PTGT = 2200;
    const D2 = 54 * 54;
    for (let att = 0; att < 700000 && pairs.length < PTGT; att++) {
      const a = (Math.random() * N) | 0;
      const b = (Math.random() * N) | 0;
      if (a === b) continue;
      const dx = pos[a * 3] - pos[b * 3];
      const dy = pos[a * 3 + 1] - pos[b * 3 + 1];
      const dz = pos[a * 3 + 2] - pos[b * 3 + 2];
      if (dx * dx + dy * dy + dz * dz < D2) pairs.push(a, b);
    }
    const synLife = new Float32Array(SYN);
    const synMax = new Float32Array(SYN);
    const synA = new Uint32Array(SYN);
    const synB = new Uint32Array(SYN);
    const synR = new Float32Array(SYN);
    const synG = new Float32Array(SYN);
    const synBl = new Float32Array(SYN);
    const PI2 = pairs.length / 2;

    function tickSynapses() {
      if (PI2 > 0) {
        for (let i = 0; i < SYN; i++) {
          if (synLife[i] <= 0) {
            const pi = ((Math.random() * PI2) | 0) * 2;
            synA[i] = pairs[pi];
            synB[i] = pairs[pi + 1];
            synMax[i] = synLife[i] = 18 + ((Math.random() * 28) | 0);
            C.setHSL(Math.random(), 0.15 + Math.random() * 0.2, 0.92);
            synR[i] = C.r;
            synG[i] = C.g;
            synBl[i] = C.b;
            break;
          }
        }
      }
      for (let i = 0; i < SYN; i++) {
        if (synLife[i] <= 0) {
          synP[i * 3] = 9999;
          synP[i * 3 + 1] = 9999;
          synP[i * 3 + 2] = 9999;
          synSz[i] = 0;
          synAl[i] = 0;
          continue;
        }
        const t = synLife[i] / synMax[i];
        const pulse = Math.sin(t * Math.PI);
        const ia = synA[i];
        const ib = synB[i];
        synP[i * 3] = (pos[ia * 3] + pos[ib * 3]) * 0.5;
        synP[i * 3 + 1] = (pos[ia * 3 + 1] + pos[ib * 3 + 1]) * 0.5;
        synP[i * 3 + 2] = (pos[ia * 3 + 2] + pos[ib * 3 + 2]) * 0.5;
        synSz[i] = 12 + pulse * 36;
        synAl[i] = pulse * 0.96;
        synCl[i * 3] = synR[i];
        synCl[i * 3 + 1] = synG[i];
        synCl[i * 3 + 2] = synBl[i];
        synLife[i]--;
      }
      sGeo.attributes.position.needsUpdate = true;
      sGeo.attributes.size.needsUpdate = true;
      sGeo.attributes.alpha.needsUpdate = true;
      sGeo.attributes.color.needsUpdate = true;
    }

    let camA = 0;
    let frameId = 0;
    function animate() {
      frameId = requestAnimationFrame(animate);
      const t = Date.now() * 0.001;
      mat.uniforms.time.value = t;
      camA += 0.00065;
      const camB = Math.sin(camA * 0.28) * 0.38;
      camera.position.x = Math.sin(camA) * 390 * Math.cos(camB);
      camera.position.y = Math.sin(camB) * 390;
      camera.position.z = Math.cos(camA) * 390 * Math.cos(camB);
      camera.lookAt(0, 0, 0);
      tickSynapses();
      renderer.render(scene, camera);
    }
    animate();

    // Rendimiento: para el bucle cuando la pestaña pierde el foco (fondo
    // inactivo consume GPU/CPU aunque no se vea) — se reanuda al volver.
    function onVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(frameId);
      } else {
        animate();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(frameId);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      geo.dispose();
      mat.dispose();
      sGeo.dispose();
      sMat.dispose();
      renderer.dispose();
      container.removeChild(canvas);
    };
  }, []);

  return <div ref={containerRef} className="mt-particle-canvas" aria-hidden="true" />;
}
