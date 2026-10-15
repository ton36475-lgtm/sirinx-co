/**
 * SolarHeroScene — Cinematic 3D Art Engineering & Motion Graphic Hero.
 *
 * Integrated Three.js + WebGL Canvas with:
 * - Real-time animated Solar Core & Procedural Photovoltaic Energy Mesh
 * - EnergyFlowShader GLSL stream integration
 * - Interactive mouse-parallax camera drift with lerp damping
 * - Strict WebGL resource management, DPR capping, and IntersectionObserver
 * - Zero LCP regression (Dynamic lazy import)
 *
 * R30-P1 merged the one unique feature of the duplicate `hero-solar-core`
 * module into this component: the 1,200-point solar dust flow. Everything
 * else in that module (its own class lifecycle, distortion/Fresnel core
 * shader, preview page and stylesheet) was rejected — see
 * `docs/3d/HERO_DUPLICATE_DECISION_20260928.md`. The duplicate files stay on
 * disk until `APPROVE_HERO_DUPLICATE_DELETE` is granted.
 */

import { useEffect, useRef, useState } from "react";
import type { Material } from "three";
import { EnergyFlowShaderDef } from "./EnergyFlowShader";

/**
 * Solar dust flow, merged from `hero-solar-core` (R30-P1). One
 * `THREE.Points` draw call; the per-frame cost is a single 14.4 KB position
 * upload inside the chunk that already carries three.js, so it adds no entry
 * chunk weight and no new network request.
 */
const PARTICLE_COUNT = 1200;
/** Particles wrap from below this y back to the top. */
const PARTICLE_WRAP_MIN = -7;
const PARTICLE_WRAP_MAX = 7;
/** X/Z spread multipliers, preserved from the source module's tuning. */
const PARTICLE_SPREAD_X = 14;
const PARTICLE_SPREAD_Z = 10;
/** Per-second fall speed, preserved from the source module. */
const PARTICLE_FALL_SPEED = 0.45;

export default function SolarHeroScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let animId = 0;
    let cleanup: (() => void) | undefined;
    const stop = () => {
      if (animId) cancelAnimationFrame(animId);
      animId = 0;
    };

    // Check WebGL availability
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) {
      setIsSupported(false);
      return;
    }

    // Dynamic import: three.js must stay out of the entry chunk. A static
    // `import * as THREE from "three"` would pull the whole engine into the
    // initial bundle and break the "Zero LCP regression" contract in the header
    // above. ProvinceSolarScene and ProvinceYieldChart3D do the same.
    void import("three").then((THREE) => {
      if (disposed || !containerRef.current) return;

      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

      // ── Renderer Setup ─────────────────────────────────────────────────────
      const renderer = new THREE.WebGLRenderer({
        antialias: window.devicePixelRatio < 1.5,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      renderer.domElement.setAttribute("aria-hidden", "true");
      renderer.domElement.style.position = "absolute";
      renderer.domElement.style.top = "0";
      renderer.domElement.style.left = "0";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.pointerEvents = "none";
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(0, 1.2, 8.5);

      // ── Energy Stream Flow Shaders ──────────────────────────────────────────
      const conduitGeo = new THREE.CylinderGeometry(0.04, 0.04, 9, 16, 32, true);
      const flowUniforms = {
        uTime: { value: 0 },
        uSpeed: { value: 1.4 },
        uFlowDirection: { value: 1.0 },
        uIrradiationIntensity: { value: 1.3 },
        uColorCore: { value: new THREE.Color(0xffb800) },
        uColorGlow: { value: new THREE.Color(0x00f0ff) },
        uAlpha: { value: 0.75 },
      };

      const flowMaterial = new THREE.ShaderMaterial({
        uniforms: flowUniforms,
        vertexShader: EnergyFlowShaderDef.vertexShader,
        fragmentShader: EnergyFlowShaderDef.fragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      // Ring of energy conduits converging into central battery buffer
      const conduitsGroup = new THREE.Group();
      const CONDUIT_COUNT = 8;
      for (let i = 0; i < CONDUIT_COUNT; i++) {
        const conduit = new THREE.Mesh(conduitGeo, flowMaterial);
        const angle = (i / CONDUIT_COUNT) * Math.PI * 2;
        const radius = 2.8;
        conduit.position.set(Math.cos(angle) * radius, -0.5, Math.sin(angle) * radius);
        conduit.rotation.z = Math.PI / 14 * Math.cos(angle);
        conduit.rotation.x = Math.PI / 14 * Math.sin(angle);
        conduitsGroup.add(conduit);
      }
      scene.add(conduitsGroup);

      // ── Central Solar Luminary Core ────────────────────────────────────────
      const coreGeo = new THREE.IcosahedronGeometry(1.4, 4);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x0a101d,
        emissive: 0x00d2ff,
        emissiveIntensity: 0.35,
        roughness: 0.1,
        metalness: 0.9,
        wireframe: true,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.position.set(0, 0, 0);
      scene.add(coreMesh);

      // Subtle ambient + volumetric rim
      const ambientLight = new THREE.AmbientLight(0x0c1524, 1.5);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xffb800, 2.2);
      keyLight.position.set(5, 8, 4);
      scene.add(keyLight);

      // ── Solar Dust Flow (merged from hero-solar-core, R30-P1) ──────────────
      const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particlePositions[i * 3] = (Math.random() - 0.5) * PARTICLE_SPREAD_X;
        particlePositions[i * 3 + 1] = PARTICLE_WRAP_MIN + Math.random() * (PARTICLE_WRAP_MAX - PARTICLE_WRAP_MIN);
        particlePositions[i * 3 + 2] = (Math.random() - 0.5) * PARTICLE_SPREAD_Z;
      }
      const particleAttr = new THREE.BufferAttribute(particlePositions, 3);
      const particleGeo = new THREE.BufferGeometry();
      particleGeo.setAttribute("position", particleAttr);
      const particleMat = new THREE.PointsMaterial({
        // Same cyan as flowUniforms.uColorGlow: the merge adds no palette token.
        color: 0x00f0ff,
        size: 0.035,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });
      const particles = new THREE.Points(particleGeo, particleMat);
      scene.add(particles);

      // ── Interactive Mouse Parallax ─────────────────────────────────────────
      let mouseX = 0;
      let mouseY = 0;
      let targetX = 0;
      let targetY = 0;

      const handleMouseMove = (e: MouseEvent) => {
        const halfW = window.innerWidth / 2;
        const halfH = window.innerHeight / 2;
        targetX = (e.clientX - halfW) / halfW;
        targetY = (e.clientY - halfH) / halfH;
      };

      if (!reduceMotion) {
        window.addEventListener("mousemove", handleMouseMove, { passive: true });
      }

      // ── Animation Loop ─────────────────────────────────────────────────────
      const clock = new THREE.Clock();
      let lastElapsed = 0;
      let isVisible = true;
      let contextLost = false;
      let resourcesDisposed = false;
      const disposeGpuResources = () => {
        if (resourcesDisposed) return;
        resourcesDisposed = true;
        scene.traverse((obj) => {
          // THREE.Points is not a Mesh; without this the 1,200-point solar dust
          // geometry and material survive unmount as a GPU leak.
          if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
            obj.geometry?.dispose();
            if (Array.isArray(obj.material)) obj.material.forEach((material: Material) => material.dispose());
            else obj.material?.dispose();
          }
        });
      };

      const schedule = () => {
        if (!disposed && !contextLost && isVisible && !document.hidden && !reduceMotion && !animId) {
          animId = requestAnimationFrame(animate);
        }
      };

      const observer = new IntersectionObserver(
        ([entry]) => {
          isVisible = entry.isIntersecting;
          if (isVisible) schedule();
          else stop();
        },
        { threshold: 0.05 }
      );
      observer.observe(container);

      const animate = () => {
        animId = 0;
        if (disposed || contextLost || !isVisible || document.hidden) return;

        const elapsedTime = clock.getElapsedTime();
        const delta = Math.min(elapsedTime - lastElapsed, 0.1);
        lastElapsed = elapsedTime;
        flowUniforms.uTime.value = elapsedTime;

        if (!reduceMotion) {
          // Smooth mouse lerping
          mouseX += (targetX - mouseX) * 0.04;
          mouseY += (targetY - mouseY) * 0.04;

          camera.position.x = mouseX * 0.8;
          camera.position.y = 1.2 - mouseY * 0.6;
          camera.lookAt(0, 0, 0);

          coreMesh.rotation.y = elapsedTime * 0.15;
          coreMesh.rotation.x = elapsedTime * 0.08;
          conduitsGroup.rotation.y = -elapsedTime * 0.05;

          // Solar dust falls at a frame-rate-independent speed. The source
          // module stepped a hardcoded 16 ms per frame, which ran at double
          // speed on a 120 Hz display.
          const fall = PARTICLE_FALL_SPEED * delta;
          for (let i = 1; i < particlePositions.length; i += 3) {
            let y = particlePositions[i] - fall;
            if (y < PARTICLE_WRAP_MIN) y += PARTICLE_WRAP_MAX - PARTICLE_WRAP_MIN;
            particlePositions[i] = y;
          }
          particleAttr.needsUpdate = true;
        }

        renderer.render(scene, camera);
        schedule();
      };
      const onContextLost = (event: Event) => {
        event.preventDefault();
        contextLost = true;
        stop();
        disposeGpuResources();
      };
      const onContextRestored = () => {
        if (disposed) return;
        contextLost = false;
        resourcesDisposed = false;
        // Three.js recompiles context state on restore; repaint and resume if eligible.
        renderer.render(scene, camera);
        schedule();
      };
      renderer.domElement.addEventListener("webglcontextlost", onContextLost);
      renderer.domElement.addEventListener("webglcontextrestored", onContextRestored);
      if (reduceMotion) animate();
      else schedule();

      const handleVisibilityChange = () => {
        if (document.hidden) stop();
        else schedule();
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);

      // ── Resize Observer ────────────────────────────────────────────────────
      const handleResize = () => {
        if (!containerRef.current || !renderer) return;
        const newW = containerRef.current.clientWidth || window.innerWidth;
        const newH = containerRef.current.clientHeight || window.innerHeight;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      };
      window.addEventListener("resize", handleResize);

      // ── Cleanup Routine ────────────────────────────────────────────────────
      cleanup = () => {
        disposed = true;
        stop();
        observer.disconnect();
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("resize", handleResize);
        renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
        renderer.domElement.removeEventListener("webglcontextrestored", onContextRestored);
        disposeGpuResources();
        renderer.dispose();
        renderer.domElement.remove();
      };
    }).catch(() => setIsSupported(false));

    return () => {
      disposed = true;
      stop();
      cleanup?.();
    };
  }, []);

  if (!isSupported) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden z-[1] opacity-75 mix-blend-screen"
      role="img"
      aria-label="Decorative animated solar energy visualization"
    />
  );
}
