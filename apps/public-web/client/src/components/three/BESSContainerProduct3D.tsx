/**
 * BESSContainerProduct3D — R30-P3, Concept D.
 *
 * 3D industrial container product visual for /solutions#bess: a container cab
 * with an inverter cabinet and an EV charger, mounted on wheels and drawn as a
 * product-style turntable.
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
 *  - prefers-reduced-motion renders exactly one static frame, slightly turned
 *  - canvas is aria-hidden; the text alternative is linked with aria-describedby
 */
import { useEffect, useRef, useState } from "react";
import type { Material, Mesh as ThreeMesh } from "three";

const COLOR_STEEL = 0x8fa3b8;
const COLOR_PANEL = 0x123a63;
const COLOR_ACCENT = 0x22d3ee;
const COLOR_MESH = 0x1c1917;

export type BESSContainerProduct3DProps = {
  /** Short label used in the text alternative. */
  labelTh: string;
};

export default function BESSContainerProduct3D({
  labelTh,
}: BESSContainerProduct3DProps) {
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
      scene.fog = new THREE.Fog(0x0c0a09, 30, 80);

      const camera = new THREE.PerspectiveCamera(
        42,
        width / height,
        0.1,
        200,
      );
      camera.position.set(12, 7, 12);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = !reduceMotion;
      controls.enablePan = false;
      controls.minDistance = 9;
      controls.maxDistance = 28;
      controls.maxPolarAngle = Math.PI / 2 - 0.05;
      controls.target.set(0, 1.6, 0);
      controls.autoRotate = !reduceMotion;
      controls.autoRotateSpeed = 0.5;

      scene.add(new THREE.HemisphereLight(0x93c5fd, 0x1c1917, 0.9));
      const key = new THREE.DirectionalLight(0xfff2dd, 1.8);
      key.position.set(8, 14, 6);
      scene.add(key);

      const structure = new THREE.Group();
      scene.add(structure);

      const steelMat = new THREE.MeshStandardMaterial({
        color: COLOR_STEEL,
        roughness: 0.45,
        metalness: 0.65,
      });
      const panelMat = new THREE.MeshStandardMaterial({
        color: COLOR_PANEL,
        roughness: 0.28,
        metalness: 0.35,
        emissive: 0x0b2d4d,
        emissiveIntensity: 0.3,
        side: THREE.DoubleSide,
      });
      const accentMat = new THREE.MeshStandardMaterial({
        color: COLOR_ACCENT,
        roughness: 0.4,
        metalness: 0.3,
      });
      const darkMat = new THREE.MeshStandardMaterial({
        color: COLOR_MESH,
        roughness: 0.95,
        metalness: 0,
      });

      // Container cab.
      const cab = new THREE.Mesh(
        new THREE.BoxGeometry(4, 2.2, 2.2),
        steelMat,
      );
      cab.position.set(0, 1.1, 0);
      cab.castShadow = true;
      structure.add(cab);

      // Container roof band.
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(4.06, 0.08, 2.26),
        accentMat,
      );
      roof.position.set(0, 2.24, 0);
      structure.add(roof);

      // Inverter cabinet on the back.
      const inverter = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.6, 0.7),
        darkMat,
      );
      inverter.position.set(-1.6, 1.1, -1.15);
      structure.add(inverter);

      const inverterFace = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 1.4, 0.05),
        accentMat,
      );
      inverterFace.position.set(-1.6, 1.1, -1.5);
      structure.add(inverterFace);

      // Door handle.
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8),
        steelMat,
      );
      handle.rotation.z = Math.PI / 2;
      handle.position.set(0, 1.1, 1.18);
      structure.add(handle);

      // EV charger mounted on the side.
      const charger = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 1.6, 0.35),
        accentMat,
      );
      charger.position.set(2.05, 1.1, 0);
      structure.add(charger);

      const chargerSocket = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.3, 0.1),
        panelMat,
      );
      chargerSocket.position.set(2.35, 1.4, 0);
      structure.add(chargerSocket);

      // Wheels.
      const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.18, 16);
      const wheelMat = new THREE.MeshStandardMaterial({
        color: 0x111820,
        roughness: 0.8,
        metalness: 0.1,
      });
      const wheelPositions: [number, number, number][] = [
        [-1.4, 0.42, -1.3],
        [-1.4, 0.42, 1.3],
        [1.4, 0.42, -1.3],
        [1.4, 0.42, 1.3],
      ];
      const wheels: ThreeMesh[] = [];
      wheelPositions.forEach(([x, y, z]) => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(x, y, z);
        wheels.push(wheel);
        structure.add(wheel);
      });

      // Ground.
      const ground = new THREE.Mesh(
        new THREE.CircleGeometry(34, 56),
        darkMat,
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.02;
      scene.add(ground);

      // Render loop.
      let visible = true;
      let raf = 0;
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

      let elapsed = 0;
      const frame = () => {
        raf = 0;
        if (disposed || contextLost || !visible || document.hidden) return;
        elapsed += 0.016;
        if (!reduceMotion) {
          wheels.forEach((wheel) => {
            wheel.rotation.z += 0.1;
          });
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
        wheels.forEach((wheel) => {
          wheel.rotation.z = 0.2;
        });
        controls.update();
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
        aria-describedby={`bess-container-description`}
      />
      <p
        id="bess-container-description"
        className="sr-only"
      >
        {`3D industrial product visual of a BESS container unit for ${labelTh},`}
        {` rendered in Three.js/WebGL as a decorative product-style turntable. The`}
        {` model is a steel container cab with an accent roof band, an inverter cabinet`}
        {` on the back, a side EV charger, and four wheels. The scene auto-orbits and`}
        {` the wheels rotate when motion is allowed, and renders one static slightly`}
        {` turned frame when the visitor prefers reduced motion. It is a visualization`}
        {` of the product concept, not a site design, a structural drawing, or a`}
        {` savings promise.`}
      </p>
      {graphicsError && (
        <p role="status" className="p-4 text-foreground">
          ไม่สามารถแสดงภาชนะเก็บพลังงานสามมิติได้ในอุปกรณ์นี้
        </p>
      )}
      <figcaption className="absolute bottom-0 left-0 right-0 bg-background/88 p-4 text-sm backdrop-blur">
        <p className="font-semibold text-foreground">
          ภาชนะเก็บพลังงาน BESS — ภาพผลิตภัณฑ์แบบสามมิติ
        </p>
        <p className="text-text-secondary">
          ภาพแสดงแนวคิดผลิตภัณฑ์ ไม่ใช่แบบก่อสร้างจริงและไม่ใช่คำสัญญาประหยัด
        </p>
      </figcaption>
    </figure>
  );
}
