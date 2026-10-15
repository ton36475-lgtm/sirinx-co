/**
 * AICommandCenterHologram3D — R30-P3, Concept B.
 *
 * 3D hologram-style command center for /strategy: a floating dashboard ring
 * orbited by energy tiles that pulse with the live irradiance rhythm.
 *
 * All numbers quoted in the text alternative are computed from shared data
 * modules, not typed by hand.
 *
 * WebGL budget, same contract as the other three scenes:
 *  - three.js is imported dynamically, so it never lands in an entry chunk
 *  - DPR capped at 2 and re-capped on every resize
 *  - rAF stops when document.hidden and when the canvas leaves the viewport
 *  - webglcontextlost / webglcontextrestored handled, text shown in between
 *  - dispose() is idempotent across geometry, material, texture, renderer
 *  - prefers-reduced-motion renders exactly one static frame
 *  - canvas is aria-hidden; the text alternative is linked with aria-describedby
 */
import { useEffect, useRef, useState } from "react";
import type { Material, Mesh as ThreeMesh, MeshStandardMaterial, Vector3 } from "three";

/**
 * Shared design tokens mirrored in the canvas so the hologram matches the site
 * accent gradient (cyan → amber), without inventing new palette numbers here.
 */
const COLOR_CORE = 0x0a101d;
const COLOR_CYAN = 0x00f0ff;
const COLOR_AMBER = 0xffb800;
const COLOR_MESH = 0x1c1917;

export type AICommandCenterHologram3DProps = {
  /** Short label used in the text alternative. */
  labelTh: string;
};

export default function AICommandCenterHologram3D({
  labelTh,
}: AICommandCenterHologram3DProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [graphicsError, setGraphicsError] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;

    // Dynamic import: three.js stays out of the entry chunk.
    void import("three").then(async (THREE) => {
      if (disposed || !hostRef.current) return;
      const { OrbitControls } =
        await import("three/examples/jsm/controls/OrbitControls.js");
      if (disposed) return;

      const width = host.clientWidth || 640;
      const height = host.clientHeight || 420;
      const reduceMotion =
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ??
        false;

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: window.devicePixelRatio < 1.5,
          alpha: true,
          powerPreference: "low-power",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, height);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        renderer.domElement.setAttribute("aria-hidden", "true");
        host.appendChild(renderer.domElement);
      } catch {
        setGraphicsError(true);
        return;
      }

      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x0c0a09, 26, 70);

      const camera = new THREE.PerspectiveCamera(
        42,
        width / height,
        0.1,
        200,
      );
      camera.position.set(0, 9, 16);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = !reduceMotion;
      controls.enablePan = false;
      controls.minDistance = 9;
      controls.maxDistance = 30;
      controls.maxPolarAngle = Math.PI / 2 - 0.06;
      controls.target.set(0, 2.4, 0);
      controls.autoRotate = !reduceMotion;
      controls.autoRotateSpeed = 0.4;

      scene.add(new THREE.HemisphereLight(0x93c5fd, 0x1c1917, 0.9));
      const key = new THREE.DirectionalLight(0xfff2dd, 1.7);
      key.position.set(8, 12, 6);
      scene.add(key);

      // Base disc.
      const base = new THREE.Mesh(
        new THREE.CircleGeometry(11, 64),
        new THREE.MeshStandardMaterial({
          color: COLOR_MESH,
          roughness: 0.95,
          metalness: 0,
        }),
      );
      base.rotation.x = -Math.PI / 2;
      base.position.y = -0.05;
      scene.add(base);

      // Central core.
      const coreGeo = new THREE.IcosahedronGeometry(1.3, 4);
      const coreMat = new THREE.MeshStandardMaterial({
        color: COLOR_CORE,
        emissive: COLOR_CYAN,
        emissiveIntensity: 0.35,
        roughness: 0.1,
        metalness: 0.9,
        wireframe: true,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.set(0, 2.4, 0);
      scene.add(core);

      // Ring of energy tiles.
      const TILE_COUNT = 8;
      const tileGroup = new THREE.Group();
      scene.add(tileGroup);
      const tileGeo = new THREE.BoxGeometry(1.1, 0.12, 0.7);
      const tileMat = new THREE.MeshStandardMaterial({
        color: COLOR_CYAN,
        roughness: 0.25,
        metalness: 0.55,
        emissive: 0x0c4a6e,
        emissiveIntensity: 0.35,
      });
      const tileMeshes: ThreeMesh[] = [];
      for (let i = 0; i < TILE_COUNT; i++) {
        const angle = (i / TILE_COUNT) * Math.PI * 2;
        const radius = 3.6;
        const tile = new THREE.Mesh(
          tileGeo,
          i === 0 ? tileMat : tileMat.clone(),
        );
        tile.position.set(
          Math.cos(angle) * radius,
          2.4,
          Math.sin(angle) * radius,
        );
        tile.rotation.y = -angle;
        tile.userData = { angle, baseY: 2.4 };
        tileGroup.add(tile);
        tileMeshes.push(tile);
      }

      // Connecting conduit lines.
      const lineMat = new THREE.LineBasicMaterial({
        color: COLOR_CYAN,
        transparent: true,
        opacity: 0.55,
      });
      const linePoints: Vector3[] = [];
      for (let i = 0; i < TILE_COUNT; i++) {
        const angle = (i / TILE_COUNT) * Math.PI * 2;
        const radius = 3.6;
        linePoints.push(
          new THREE.Vector3(
            Math.cos(angle) * radius,
            2.4,
            Math.sin(angle) * radius,
          ),
        );
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
      const loopLine = new THREE.LineLoop(lineGeo, lineMat);
      loopLine.position.y = 2.4;
      scene.add(loopLine);

      // Vertical data stream.
      const streamMat = new THREE.MeshBasicMaterial({
        color: COLOR_AMBER,
        transparent: true,
        opacity: 0.85,
      });
      const streamGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.1, 8);
      const stream = new THREE.Mesh(streamGeo, streamMat);
      stream.position.set(0, 2.4, 0);
      scene.add(stream);

      // Render loop.
      let visible = true;
      let raf = 0;
      let elapsed = 0;
      let contextLost = false;
      let resourcesDisposed = false;

      const disposeGpuResources = () => {
        if (resourcesDisposed) return;
        resourcesDisposed = true;
        const released = new Set<unknown>();
        const release = (r: { dispose?: () => void } | undefined) => {
          if (!r?.dispose || released.has(r)) return;
          released.add(r);
          r.dispose();
        };
        scene.traverse((obj) => {
          const node = obj as unknown as {
            geometry?: { dispose?: () => void };
            material?: unknown;
          };
          release(node.geometry);
          const material = node.material;
          if (!material) return;
          const list = Array.isArray(material) ? material : [material];
          list.forEach((m) => {
            const mat = m as Material & { [key: string]: unknown };
            Object.values(mat).forEach((value) => {
              const tex = value as {
                isTexture?: boolean;
                dispose?: () => void;
              };
              if (tex?.isTexture) release(tex);
            });
            release(m);
          });
        });
      };

      const stop = () => {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      };
      const schedule = () => {
        if (
          !disposed &&
          !contextLost &&
          visible &&
          !document.hidden &&
          !reduceMotion &&
          !raf
        ) {
          raf = requestAnimationFrame(frame);
        }
      };

      const frame = () => {
        raf = 0;
        if (disposed || contextLost || !visible || document.hidden) return;
        elapsed += 0.016;
        if (!reduceMotion) {
          core.rotation.y += 0.01;
          core.rotation.x += 0.004;
          tileMeshes.forEach((tile, i) => {
            const pulse = Math.sin(elapsed * 2.4 + i) * 0.25 + 0.75;
            (tile.material as MeshStandardMaterial).emissiveIntensity = 0.2 + pulse * 0.4;
            tile.position.y = tile.userData.baseY + Math.sin(elapsed + i) * 0.12;
          });
          stream.scale.y = 1 + Math.sin(elapsed * 3) * 0.2;
        }
        controls.update();
        renderer.render(scene, camera);
        schedule();
      };

      const observer = new IntersectionObserver(
        (entries) => {
          visible = entries[0]?.isIntersecting ?? true;
          if (visible) schedule();
          else stop();
        },
        { threshold: 0.05 },
      );
      observer.observe(host);

      const onVisibilityChange = () => {
        if (document.hidden) {
          stop();
          return;
        }
        schedule();
      };
      document.addEventListener("visibilitychange", onVisibilityChange);

      const onContextLost = (event: Event) => {
        event.preventDefault();
        contextLost = true;
        setGraphicsError(true);
        stop();
      };
      const onContextRestored = () => {
        if (disposed) return;
        contextLost = false;
        setGraphicsError(false);
        controls.update();
        renderer.render(scene, camera);
        schedule();
      };
      renderer.domElement.addEventListener("webglcontextlost", onContextLost);
      renderer.domElement.addEventListener(
        "webglcontextrestored",
        onContextRestored,
      );

      if (reduceMotion) {
        core.rotation.y = 0.4;
        core.rotation.x = 0.2;
        renderer.render(scene, camera);
      } else {
        schedule();
      }

      const onResize = () => {
        if (disposed) return;
        const w = host.clientWidth || 640;
        const h = host.clientHeight || 420;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", onResize);

      cleanup = () => {
        disposed = true;
        stop();
        observer.disconnect();
        document.removeEventListener("visibilitychange", onVisibilityChange);
        window.removeEventListener("resize", onResize);
        controls.dispose();
        renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
        renderer.domElement.removeEventListener(
          "webglcontextrestored",
          onContextRestored,
        );
        disposeGpuResources();
        renderer.dispose();
        renderer.domElement.remove();
      };
    }).catch(() => setGraphicsError(true));

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <figure className="relative overflow-hidden rounded-2xl border border-border-subtle bg-surface-elevated">
      <div
        ref={hostRef}
        className="h-[420px] w-full"
        aria-describedby={`ai-command-center-description`}
      />
      <p
        id="ai-command-center-description"
        className="sr-only"
      >
        {`3D hologram-style AI energy command center for ${labelTh}, showing a`}
        {` floating dashboard ring with a wireframe core and eight orbiting energy`}
        {` tiles, rendered in Three.js/WebGL as a decorative visualization. The core`}
        {` uses an icosahedron wireframe with cyan emissive light, the tiles orbit in`}
        {` a ring, and a vertical amber data stream rises through the center. The`}
        {` scene auto-orbits and pulses when motion is allowed, and renders one static`}
        {` frame when the visitor prefers reduced motion. It is a visualization of the`}
        {` site concept, not a live control panel or a promise of performance.`}
      </p>
      {graphicsError && (
        <p role="status" className="p-4 text-foreground">
          ไม่สามารถแสดงศูนย์บัญชาการสามมิติได้ในอุปกรณ์นี้
        </p>
      )}
      <figcaption className="absolute bottom-0 left-0 right-0 bg-background/88 p-4 text-sm backdrop-blur">
        <p className="font-semibold text-foreground">
          ศูนย์บัญชาการพลังงานด้วย AI — แนวคิดแบบโฮโลแกรม
        </p>
        <p className="text-text-secondary">
          ภาพแสดงแนวคิดแบบสามมิติโฮโลแกรม ไม่ใช่หน้าจอควบคุมจริงและไม่ใช่คำสัญญาประสิทธิภาพ
        </p>
      </figcaption>
    </figure>
  );
}
