/**
 * SolarHeroScene — slide-aware Three.js hero for www.sirinx.co / .org.
 *
 * Design contract (2026-10-27):
 * - One sculpture per hero slide category (carport / rooftop / floating /
 *   BESS / hospitality / AI), built from primitives in
 *   `solarHeroSculptures.ts`. The WebGL layer used to be a generic energy core
 *   pinned over every slide, which fought the slide photo; now the layer shows
 *   the product the slide is talking about and lives on the right half of the
 *   viewport, so it never sits under the hero copy.
 * - anime.js drives the motion (intro, slide transition, idle core pulse);
 *   three.js owns the geometry. Reduced-motion users get the final frame with
 *   no timelines.
 * - Resource discipline is unchanged: dynamic `import("three")` keeps the
 *   engine out of the entry chunk, DPR is capped at 2, rAF stops when the
 *   hero is off-screen or the tab is hidden, and every geometry/material is
 *   disposed on unmount (including context loss).
 */

import { useEffect, useRef, useState } from "react";
import type { Material } from "three";
import { EnergyFlowShaderDef } from "./EnergyFlowShader";
import {
  createSculpture,
  type HeroAccent,
  type HeroSculptureKind,
  type Sculpture,
  type SculpturePalette,
} from "./solarHeroSculptures";

const PARTICLE_COUNT = 1200;
const PARTICLE_WRAP_MIN = -7;
const PARTICLE_WRAP_MAX = 7;
const PARTICLE_SPREAD_X = 14;
const PARTICLE_SPREAD_Z = 10;
const PARTICLE_FALL_SPEED = 0.45;

/** Where the sculpture lives in the scene (right half of the hero). */
const SCULPTURE_POSITION = { x: 1.95, y: 0.15 };

export interface SolarHeroSceneProps {
  category?: HeroSculptureKind;
  slideIndex?: number;
  accent?: HeroAccent;
}

export default function SolarHeroScene({
  category = "solar-carport",
  slideIndex = 0,
  accent = "sun",
}: SolarHeroSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const applySlideRef = useRef<((kind: HeroSculptureKind, accent: HeroAccent) => void) | null>(null);
  const slideRef = useRef({ category, accent, slideIndex });

  // Push slide changes into the live scene; queued until three.js is ready.
  useEffect(() => {
    slideRef.current = { category, accent, slideIndex };
    applySlideRef.current?.(category, accent);
  }, [category, accent, slideIndex]);

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

    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) {
      setIsSupported(false);
      return;
    }

    void Promise.all([import("three"), import("animejs")])
      .then(([THREE, anime]) => {
        if (disposed || !containerRef.current) return;

        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;
        const reduceMotion =
          window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

        // ── Renderer ────────────────────────────────────────────────────────
        const renderer = new THREE.WebGLRenderer({
          antialias: window.devicePixelRatio < 1.5,
          alpha: true,
          powerPreference: "high-performance",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, height);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        renderer.domElement.setAttribute("aria-hidden", "true");
        renderer.domElement.style.position = "absolute";
        renderer.domElement.style.top = "0";
        renderer.domElement.style.left = "0";
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        renderer.domElement.style.pointerEvents = "none";
        container.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
        camera.position.set(0, 0.9, 7.4);

        // ── Energy conduits (kept from the original hero, now accent-tinted) ─
        const conduitGeo = new THREE.CylinderGeometry(0.04, 0.04, 9, 16, 32, true);
        const flowUniforms = {
          uTime: { value: 0 },
          uSpeed: { value: 1.4 },
          uFlowDirection: { value: 1.0 },
          uIrradiationIntensity: { value: 1.3 },
          uColorCore: { value: new THREE.Color(0xffb800) },
          uColorGlow: { value: new THREE.Color(0x00f0ff) },
          uAlpha: { value: 0.55 },
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
        const conduitsGroup = new THREE.Group();
        const CONDUIT_COUNT = 8;
        for (let i = 0; i < CONDUIT_COUNT; i += 1) {
          const conduit = new THREE.Mesh(conduitGeo, flowMaterial);
          const angle = (i / CONDUIT_COUNT) * Math.PI * 2;
          const radius = 2.9;
          conduit.position.set(Math.cos(angle) * radius, -0.6, Math.sin(angle) * radius);
          conduit.rotation.z = (Math.PI / 14) * Math.cos(angle);
          conduit.rotation.x = (Math.PI / 14) * Math.sin(angle);
          conduitsGroup.add(conduit);
        }
        scene.add(conduitsGroup);

        scene.add(new THREE.AmbientLight(0x0c1524, 1.6));
        const keyLight = new THREE.DirectionalLight(0xffb800, 2.0);
        keyLight.position.set(5, 8, 4);
        scene.add(keyLight);
        const rimLight = new THREE.DirectionalLight(0x00f0ff, 1.1);
        rimLight.position.set(-6, 2, -4);
        scene.add(rimLight);

        // ── Solar dust ──────────────────────────────────────────────────────
        const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
        for (let i = 0; i < PARTICLE_COUNT; i += 1) {
          particlePositions[i * 3] = (Math.random() - 0.5) * PARTICLE_SPREAD_X;
          particlePositions[i * 3 + 1] =
            PARTICLE_WRAP_MIN + Math.random() * (PARTICLE_WRAP_MAX - PARTICLE_WRAP_MIN);
          particlePositions[i * 3 + 2] = (Math.random() - 0.5) * PARTICLE_SPREAD_Z;
        }
        const particleAttr = new THREE.BufferAttribute(particlePositions, 3);
        const particleGeo = new THREE.BufferGeometry();
        particleGeo.setAttribute("position", particleAttr);
        const particleMat = new THREE.PointsMaterial({
          color: 0x00f0ff,
          size: 0.035,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          sizeAttenuation: true,
        });
        const particles = new THREE.Points(particleGeo, particleMat);
        scene.add(particles);

        // ── Slide-aware sculpture ───────────────────────────────────────────
        const paletteFor = (accentKind: HeroAccent): SculpturePalette => {
          const accentColor = accentKind === "cyan" ? 0x00f0ff : 0xffb800;
          const softColor = accentKind === "cyan" ? 0x0a7d8c : 0x8a5a00;
          return {
            panel: new THREE.MeshStandardMaterial({
              color: 0x101b2e,
              emissive: 0x0b2a3a,
              emissiveIntensity: 0.35,
              metalness: 0.75,
              roughness: 0.3,
            }),
            frame: new THREE.MeshStandardMaterial({
              color: 0x9fb3c8,
              metalness: 0.9,
              roughness: 0.35,
            }),
            accent: new THREE.MeshStandardMaterial({
              color: accentColor,
              emissive: accentColor,
              emissiveIntensity: 1.25,
              metalness: 0.2,
              roughness: 0.4,
            }),
            accentSoft: new THREE.MeshStandardMaterial({
              color: softColor,
              emissive: accentColor,
              emissiveIntensity: 0.7,
              metalness: 0.1,
              roughness: 0.5,
            }),
            water: new THREE.MeshStandardMaterial({
              color: 0x0b3a55,
              transparent: true,
              opacity: 0.55,
              metalness: 0.4,
              roughness: 0.15,
            }),
            building: new THREE.MeshStandardMaterial({
              color: 0x18263c,
              metalness: 0.35,
              roughness: 0.6,
            }),
          };
        };

        let sculpture: Sculpture | null = null;
        let pulse: { pause?: () => void } | null = null;
        const timers: Array<{ pause?: () => void }> = [];

        const disposeSculpture = (target: Sculpture | null) => {
          if (!target) return;
          scene.remove(target.group as never);
          // Only the removed sculpture's own resources are disposed; the
          // particle field and the energy conduits keep theirs.
          target.group.traverse((obj) => {
            const candidate = obj as {
              geometry?: { dispose?: () => void };
              material?: Material | Material[];
            };
            candidate.geometry?.dispose?.();
            const material = candidate.material;
            if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
            else material?.dispose?.();
          });
        };

        // anime.js v4 types describe DOM/CSS targets; the scene animates
        // three.js objects (Vector3-style numeric props), so the params are
        // passed through one narrow, documented helper instead of casts at
        // every call site.
        const tween = (targets: unknown, params: Record<string, unknown>): { pause?: () => void } =>
          anime.animate(targets as never, params as never);

        const startPulse = (target: Sculpture) => {
          pulse?.pause?.();
          pulse = null;
          if (reduceMotion || target.cores.length === 0) return;
          pulse = tween(target.cores, {
            scale: [1, 1.16],
            duration: 1100,
            loop: true,
            alternate: true,
            delay: anime.stagger(140),
            ease: "inOutSine",
          });
        };

        const applySlide = (kind: HeroSculptureKind, accentKind: HeroAccent) => {
          const colour = accentKind === "cyan" ? 0x00f0ff : 0xffb800;
          ConduitAccent(flowUniforms, colour);
          const previous = sculpture;
          const next = createSculpture(THREE, kind, paletteFor(accentKind));
          sculpture = next;
          scene.add(next.group as never);
          timers.forEach((timer) => timer.pause?.());
          timers.length = 0;

          if (reduceMotion) {
            disposeSculpture(previous);
            next.group.position.set(SCULPTURE_POSITION.x, SCULPTURE_POSITION.y, 0);
            startPulse(next);
            return;
          }

          if (previous) {
            timers.push(
              tween(previous.group, {
                scale: 0.6,
                duration: 240,
                ease: "inQuad",
                onComplete: () => disposeSculpture(previous),
              })
            );
          }
          next.group.position.set(
            SCULPTURE_POSITION.x - 1.4,
            SCULPTURE_POSITION.y - 0.3,
            -1.2
          );
          next.group.scale.set(0.72, 0.72, 0.72);
          timers.push(
            tween(next.group, {
              position: { x: SCULPTURE_POSITION.x, y: SCULPTURE_POSITION.y, z: 0 },
              scale: 1,
              duration: 900,
              ease: "outCubic",
            })
          );
          // Panels pop in one after another; rotation is owned by the render
          // loop, so the timeline never animates the same property twice.
          next.panels.forEach((panel) => panel.scale.set(0.6, 0.6, 0.6));
          timers.push(
            tween(next.panels.map((panel) => panel.scale), {
              x: 1,
              y: 1,
              z: 1,
              duration: 700,
              delay: anime.stagger(55),
              ease: "outQuad",
            })
          );
          startPulse(next);
        };

        applySlideRef.current = applySlide;
        applySlide(slideRef.current.category, slideRef.current.accent);

        // ── Pointer parallax ────────────────────────────────────────────────
        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;
        const handleMouseMove = (e: MouseEvent) => {
          targetX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
          targetY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
        };
        if (!reduceMotion) window.addEventListener("mousemove", handleMouseMove, { passive: true });

        // ── Loop ────────────────────────────────────────────────────────────
        const clock = new THREE.Clock();
        let lastElapsed = 0;
        let isVisible = true;
        let contextLost = false;
        let resourcesDisposed = false;

        const disposeGpuResources = () => {
          if (resourcesDisposed) return;
          resourcesDisposed = true;
          scene.traverse((obj: unknown) => {
            const candidate = obj as { geometry?: { dispose?: () => void }; material?: Material | Material[] };
            if (candidate.geometry?.dispose) candidate.geometry.dispose();
            const material = candidate.material;
            if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
            else material?.dispose?.();
          });
          sculpture = null;
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

          mouseX += (targetX - mouseX) * 0.045;
          mouseY += (targetY - mouseY) * 0.045;
          camera.position.x = mouseX * 0.55;
          camera.position.y = 0.9 - mouseY * 0.45;
          camera.lookAt(0, 0, 0);

          conduitsGroup.rotation.y = -elapsedTime * 0.05;
          if (sculpture) {
            const group = sculpture.group as { rotation: { y: number } };
            group.rotation.y = 0.35 + Math.sin(elapsedTime * 0.25) * 0.12 + mouseX * 0.08;
          }

          const fall = PARTICLE_FALL_SPEED * delta;
          for (let i = 1; i < particlePositions.length; i += 3) {
            let y = particlePositions[i] - fall;
            if (y < PARTICLE_WRAP_MIN) y += PARTICLE_WRAP_MAX - PARTICLE_WRAP_MIN;
            particlePositions[i] = y;
          }
          particleAttr.needsUpdate = true;

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

        const handleResize = () => {
          if (!containerRef.current) return;
          const newW = containerRef.current.clientWidth || window.innerWidth;
          const newH = containerRef.current.clientHeight || window.innerHeight;
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        };
        window.addEventListener("resize", handleResize);

        cleanup = () => {
          disposed = true;
          stop();
          observer.disconnect();
          pulse?.pause?.();
          timers.forEach((timer) => timer.pause?.());
          document.removeEventListener("visibilitychange", handleVisibilityChange);
          window.removeEventListener("mousemove", handleMouseMove);
          window.removeEventListener("resize", handleResize);
          renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
          renderer.domElement.removeEventListener("webglcontextrestored", onContextRestored);
          disposeGpuResources();
          renderer.dispose();
          renderer.domElement.remove();
          applySlideRef.current = null;
        };
      })
      .catch(() => setIsSupported(false));

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
      className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] overflow-hidden opacity-90 mix-blend-screen md:block md:w-[52%] lg:w-[46%]"
      role="img"
      aria-label="Decorative animated 3D model of the solution on this slide"
      data-testid="solar-hero-scene"
    />
  );
}

/**
 * Retints the energy-flow uniforms without rebuilding the shader material.
 * Kept as a named function so a future accent change cannot forget one of the
 * two colour tokens.
 */
function ConduitAccent(
  uniforms: { uColorCore: { value: unknown }; uColorGlow: { value: unknown } },
  colour: number
) {
  const core = uniforms.uColorCore.value as { setHex?: (value: number) => void };
  const glow = uniforms.uColorGlow.value as { setHex?: (value: number) => void };
  core?.setHex?.(colour);
  glow?.setHex?.(colour === 0x00f0ff ? 0xffb800 : 0x00f0ff);
}
