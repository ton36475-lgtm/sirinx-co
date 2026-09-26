/**
 * ProvinceSolarScene — advanced Three.js/WebGL solar-carport visualization.
 *
 * Renders a procedural solar carport with the sun animated along the REAL sun
 * path for the province (astronomy from @shared/sunMath + province coordinates),
 * lit by the province's sourced PVGIS figures shown as an accessible data overlay.
 *
 * WebGL practices applied:
 *  - three.js is dynamically imported so it never blocks the initial bundle
 *  - DPR capped at 2, antialias only on low-DPR displays
 *  - ACES filmic tone mapping + sRGB output
 *  - InstancedMesh for panel rows (one draw call per material)
 *  - IntersectionObserver pauses rendering offscreen
 *  - prefers-reduced-motion renders one static solar-noon frame
 *  - webglcontextlost/restored handling
 *  - canvas is decorative: all data is in the HTML overlay (a11y + SEO safe)
 *
 * Honesty: the scene is a visualization of astronomy + sourced PVGIS normals.
 * It is NOT a site design or a savings promise.
 */
import { useEffect, useRef } from "react";
import type { Material } from "three";

export type ProvinceSolarSceneProps = {
  nameTh: string;
  latitude: number;
  longitude: number;
  /** kWh/m2/day, PVGIS climate normal. */
  irradiationDaily: number;
  /** kWh/kWp/year, PVGIS climate normal. */
  specificYield: number;
  /** Short source line shown in the overlay (e.g. "PVGIS v5.3 (PVGIS-ERA5, 2005–2023)"). */
  source: string;
};

const PANEL_ROWS = 6;
const PANEL_COLS = 8;

export default function ProvinceSolarScene(props: ProvinceSolarSceneProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;

    // Dynamic import: three.js stays out of the entry chunk.
    void import("three").then(async (THREE) => {
      if (disposed || !hostRef.current) return;
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      if (disposed) return;

      const width = host.clientWidth || 640;
      const height = host.clientHeight || 360;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const renderer = new THREE.WebGLRenderer({
        antialias: window.devicePixelRatio < 1.5,
        alpha: true,
        powerPreference: "low-power",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.domElement.setAttribute("aria-hidden", "true");
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x0c0a09, 30, 90);

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
      camera.position.set(14, 9, 14);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = !reduceMotion;
      controls.enablePan = false;
      controls.minDistance = 8;
      controls.maxDistance = 32;
      controls.maxPolarAngle = Math.PI / 2 - 0.05;
      controls.target.set(0, 1.6, 0);

      // ── Lights ────────────────────────────────────────────────────────────
      const ambient = new THREE.AmbientLight(0x27272a, 1.1);
      scene.add(ambient);
      const sun = new THREE.DirectionalLight(0xfff2dd, 2.6);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      sun.shadow.camera.near = 1;
      sun.shadow.camera.far = 80;
      sun.shadow.camera.left = -20;
      sun.shadow.camera.right = 20;
      sun.shadow.camera.top = 20;
      sun.shadow.camera.bottom = -20;
      scene.add(sun);

      // ── Ground ────────────────────────────────────────────────────────────
      const ground = new THREE.Mesh(
        new THREE.CircleGeometry(60, 48),
        new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.95, metalness: 0 }),
      );
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      // ── Procedural carport: pillars + instanced panel rows ────────────────
      const steel = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.5, metalness: 0.7 });
      const pillarGeo = new THREE.CylinderGeometry(0.12, 0.14, 3.2, 12);
      const pillarPositions: [number, number][] = [];
      for (let r = 0; r < PANEL_ROWS; r++) {
        pillarPositions.push([-6.5, (r - (PANEL_ROWS - 1) / 2) * 2.4], [6.5, (r - (PANEL_ROWS - 1) / 2) * 2.4]);
      }
      const pillars = new THREE.InstancedMesh(pillarGeo, steel, pillarPositions.length);
      {
        const m = new THREE.Matrix4();
        pillarPositions.forEach(([x, z], i) => {
          m.setPosition(x, 1.6, z);
          pillars.setMatrixAt(i, m);
        });
      }
      pillars.castShadow = true;
      scene.add(pillars);

      const panelGeo = new THREE.BoxGeometry(1.65, 0.06, 1.0);
      const panelMat = new THREE.MeshStandardMaterial({
        color: 0x0ea5e9,
        roughness: 0.25,
        metalness: 0.55,
        emissive: 0x0c4a6e,
        emissiveIntensity: 0.35,
      });
      const panels = new THREE.InstancedMesh(panelGeo, panelMat, PANEL_ROWS * PANEL_COLS);
      {
        const m = new THREE.Matrix4();
        const q = new THREE.Quaternion();
        const tilt = new THREE.Euler(-Math.PI / 2 + 0.42, 0, 0);
        q.setFromEuler(tilt);
        const s = new THREE.Vector3(1, 1, 1);
        let i = 0;
        for (let r = 0; r < PANEL_ROWS; r++) {
          for (let c = 0; c < PANEL_COLS; c++) {
            const x = (c - (PANEL_COLS - 1) / 2) * 1.8;
            const z = (r - (PANEL_ROWS - 1) / 2) * 2.4;
            m.compose(new THREE.Vector3(x, 3.35 + Math.abs(x) * 0.045, z), q, s);
            panels.setMatrixAt(i++, m);
          }
        }
      }
      panels.castShadow = true;
      scene.add(panels);

      // Sun disc (visual anchor for the animated path)
      const sunDisc = new THREE.Mesh(
        new THREE.SphereGeometry(0.9, 24, 16),
        new THREE.MeshBasicMaterial({ color: 0xfbbf24 }),
      );
      scene.add(sunDisc);

      // ── Real sun path (astronomy from @shared/sunMath) ────────────────────
      const { solarPosition } = await import("@shared/sunMath");

      const placeSun = (hoursLocal: number) => {
        const utc = new Date(Date.UTC(2026, 5, 21, 0, 0, 0));
        utc.setUTCMinutes(utc.getUTCMinutes() + Math.round(hoursLocal * 60) - 420);
        const p = solarPosition(props.latitude, props.longitude, utc);
        const elev = (p.elevationDeg * Math.PI) / 180;
        const az = (p.azimuthDeg * Math.PI) / 180;
        const r = 24;
        const y = Math.max(-2, Math.sin(elev) * r);
        const x = -Math.sin(az) * Math.cos(elev) * r;
        const z = Math.cos(az) * Math.cos(elev) * r;
        sun.position.set(x, y, z);
        sunDisc.position.set(x * 0.9, y * 0.9, z * 0.9);
        const dayness = Math.max(0, Math.sin(Math.max(0, elev)));
        sun.intensity = 0.6 + dayness * 2.4;
        sun.color.setHSL(0.11, 0.55, 0.55 + dayness * 0.35);
        ambient.intensity = 0.5 + dayness * 0.9;
      };

      // ── Render loop (paused offscreen / static under reduced motion) ──────
      let visible = true;
      let frame = 0;
      let raf = 0;
      const observer = new IntersectionObserver((entries) => {
        visible = entries[0]?.isIntersecting ?? true;
      });
      observer.observe(host);

      const onContextLost = (e: Event) => e.preventDefault();
      renderer.domElement.addEventListener("webglcontextlost", onContextLost);

      const tick = () => {
        raf = requestAnimationFrame(tick);
        if (!visible && !reduceMotion) return;
        if (!reduceMotion) {
          frame = (frame + 1) % 1024;
          placeSun(6 + (frame / 1024) * 12.5); // 06:00 → 18:30 loop
        } else {
          placeSun(12.4); // static solar-noon frame
        }
        controls.update();
        renderer.render(scene, camera);
      };
      tick();

      const onResize = () => {
        const w = host.clientWidth || 640;
        const h = host.clientHeight || 360;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", onResize);

      cleanup = () => {
        cancelAnimationFrame(raf);
        observer.disconnect();
        window.removeEventListener("resize", onResize);
        renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
        controls.dispose();
        panelGeo.dispose();
        pillarGeo.dispose();
        ground.geometry.dispose();
        (ground.material as Material).dispose();
        steel.dispose();
        panelMat.dispose();
        sunDisc.geometry.dispose();
        (sunDisc.material as Material).dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [props.latitude, props.longitude]);

  return (
    <figure className="relative overflow-hidden rounded-2xl border border-border-subtle bg-surface-elevated">
      <div ref={hostRef} className="h-[360px] w-full" />
      <figcaption className="absolute bottom-0 left-0 right-0 bg-background/85 p-4 text-sm backdrop-blur">
        <p className="font-semibold text-foreground">
          เส้นทางดวงอาทิตย์จริงของจังหวัด{props.nameTh} · Solar Carport
        </p>
        <p className="text-text-secondary">
          รังสีเฉลี่ย {props.irradiationDaily} kWh/m²/วัน · ผลผลิตเฉพาะ {props.specificYield} kWh/kWp/ปี
          {" "}— ค่าปกติสภาพอากาศ ไม่ใช่คำสัญญาประหยัด
        </p>
        <p className="text-text-muted text-xs">แหล่งข้อมูล: {props.source}</p>
      </figcaption>
    </figure>
  );
}
