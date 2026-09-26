/**
 * ProvinceYieldChart3D — 3D infographic of the real PVGIS dataset.
 *
 * One column per province (77), positioned at the province's REAL latitude /
 * longitude so the chart reads as a map of Thailand. Column height and colour
 * encode specificYield (kWh/kWp/yr) from shared/provinceEnergyData.ts; the
 * current province is highlighted. Every figure in the HTML overlay is derived
 * from shared/provinceEnergyStats.ts and carries the PVGIS source line — this
 * is deliberate GEO citation bait: an original, sourced dataset presented
 * visibly for both crawlers and readers.
 *
 * Honesty: PVGIS values are climate normals, not a savings promise.
 * Same WebGL budget as ProvinceSolarScene: dynamic three.js import, DPR cap,
 * offscreen pause, reduced-motion static frame, context-loss handling, dispose.
 */
import { useEffect, useRef } from "react";
import type { Material } from "three";
import { provinceEnergyData } from "@shared/provinceEnergyData";
import {
  nationalYieldStats,
  provinceYieldSummary,
  yieldExtremes,
} from "@shared/provinceEnergyStats";

export type ProvinceYieldChart3DProps = {
  slug: string;
  nameTh: string;
};

const SOURCE_LINE = "PVGIS v5.3 (PVGIS-ERA5, 2005–2023), EC Joint Research Centre";

export default function ProvinceYieldChart3D({ slug, nameTh }: ProvinceYieldChart3DProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;

    void import("three").then(async (THREE) => {
      if (disposed || !hostRef.current) return;
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      if (disposed) return;

      const summary = provinceYieldSummary(slug);
      const stats = nationalYieldStats();
      const width = host.clientWidth || 640;
      const height = host.clientHeight || 380;
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
      renderer.domElement.setAttribute("aria-hidden", "true");
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x0c0a09, 34, 90);

      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 200);
      camera.position.set(0, 17, 19);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = !reduceMotion;
      controls.enablePan = false;
      controls.minDistance = 12;
      controls.maxDistance = 42;
      controls.maxPolarAngle = Math.PI / 2 - 0.08;
      controls.target.set(0, 2.2, 0);
      controls.autoRotate = !reduceMotion;
      controls.autoRotateSpeed = 0.35;

      scene.add(new THREE.HemisphereLight(0x93c5fd, 0x1c1917, 0.9));
      const key = new THREE.DirectionalLight(0xfff2dd, 1.7);
      key.position.set(12, 22, 8);
      scene.add(key);

      // Base plate (gulf/landmass abstraction — decorative)
      const plate = new THREE.Mesh(
        new THREE.CircleGeometry(26, 56),
        new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.95 }),
      );
      plate.rotation.x = -Math.PI / 2;
      scene.add(plate);

      // ── 77 columns at REAL coordinates ────────────────────────────────────
      const LON0 = 100.5;
      const LAT0 = 13.2;
      const SX = 2.15; // x scale per degree lon
      const SZ = 1.05; // z scale per degree lat
      const entries = Object.entries(provinceEnergyData);
      const values = entries.map(([, f]) => f.specificYield);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const heightOf = (y: number) => 0.9 + ((y - min) / (max - min)) * 5.2;
      const colorOf = (y: number, out: { setHSL: (h: number, s: number, l: number) => void }) => {
        const t = (y - min) / (max - min);
        // cyan (low) → orange (high), the site's accent gradient
        out.setHSL(0.52 - t * 0.47, 0.78, 0.5 + t * 0.12);
      };

      const columnGeo = new THREE.BoxGeometry(0.85, 1, 0.85);
      const columnMat = new THREE.MeshStandardMaterial({
        roughness: 0.42,
        metalness: 0.18,
      });
      const columns = new THREE.InstancedMesh(columnGeo, columnMat, entries.length);
      const matrix = new THREE.Matrix4();
      const quat = new THREE.Quaternion();
      const scale = new THREE.Vector3();
      const color = new THREE.Color();
      entries.forEach(([key_, fact], i) => {
        const h = heightOf(fact.specificYield);
        const x = (fact.lon - LON0) * SX;
        const z = -(fact.lat - LAT0) * SZ;
        if (key_ === slug) {
          scale.set(1.35, h, 1.35);
          color.setHSL(0.075, 0.86, 0.56); // SIRINX accent orange
        } else {
          scale.set(1, h, 1);
          colorOf(fact.specificYield, color);
        }
        matrix.compose(new THREE.Vector3(x, h / 2, z), quat, scale);
        columns.setMatrixAt(i, matrix);
        columns.setColorAt(i, color);
      });
      columns.instanceMatrix.needsUpdate = true;
      if (columns.instanceColor) columns.instanceColor.needsUpdate = true;
      scene.add(columns);

      // Height reference ring at the national mean
      const meanHeight = heightOf(stats.mean);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(13.5, 0.045, 8, 72),
        new THREE.MeshBasicMaterial({ color: 0x57534e, transparent: true, opacity: 0.55 }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = meanHeight;
      scene.add(ring);

      // ── Render loop (paused offscreen / static under reduced motion) ──────
      let visible = true;
      const observer = new IntersectionObserver((entries_) => {
        visible = entries_[0]?.isIntersecting ?? true;
      });
      observer.observe(host);

      const onContextLost = (e: Event) => e.preventDefault();
      renderer.domElement.addEventListener("webglcontextlost", onContextLost);

      let raf = 0;
      const tick = () => {
        raf = requestAnimationFrame(tick);
        if (!visible && !reduceMotion) return;
        controls.update();
        renderer.render(scene, camera);
      };
      tick();

      const onResize = () => {
        const w = host.clientWidth || 640;
        const h = host.clientHeight || 380;
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
        columnGeo.dispose();
        columnMat.dispose();
        plate.geometry.dispose();
        (plate.material as Material).dispose();
        ring.geometry.dispose();
        (ring.material as Material).dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [slug]);

  const summary = provinceYieldSummary(slug);
  const stats = nationalYieldStats();
  const extremes = yieldExtremes(3);

  return (
    <figure className="relative overflow-hidden rounded-2xl border border-border-subtle bg-surface-elevated">
      <div ref={hostRef} className="h-[380px] w-full" />
      <figcaption className="absolute bottom-0 left-0 right-0 bg-background/88 p-4 text-sm backdrop-blur">
        <p className="font-semibold text-foreground">
          ผลผลิตไฟฟ้าเทียบทั้ง 77 จังหวัด — จังหวัด{nameTh}{" "}
          {summary ? `อยู่อันดับ ${summary.rank} จาก ${summary.count}` : ""}
        </p>
        {summary && (
          <p className="text-text-secondary">
            {summary.specificYield.toLocaleString()} kWh/kWp/ปี (
            {summary.vsMeanPct >= 0 ? "+" : ""}
            {summary.vsMeanPct}% เทียบค่าเฉลี่ยประเทศ {stats.mean.toLocaleString()}) ·
            รังสีเฉลี่ย {summary.irradiationDaily} kWh/m²/วัน
          </p>
        )}
        <p className="text-text-muted text-xs">
          สูงสุด: {extremes.top.map((t) => `${t.slug} ${t.specificYield.toLocaleString()}`).join(" · ")} —
          ต่ำสุด: {extremes.bottom.map((b) => `${b.slug} ${b.specificYield.toLocaleString()}`).join(" · ")}
          {" "}· ค่าปกติสภาพอากาศ ไม่ใช่คำสัญญาประหยัด · แหล่งข้อมูล: {SOURCE_LINE}
        </p>
      </figcaption>
    </figure>
  );
}
