/**
 * Interactive Solar Carport viewer.
 *
 * A lazy Three.js island. It is never created until the block is scrolled into
 * view, it degrades to a text summary when WebGL is unavailable, and it renders a
 * single static frame when the visitor asks for reduced motion. The numbers it
 * shows come from the province's own PVGIS record and the solar geometry module,
 * so the 3D view and the written figures cannot disagree.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BoxGeometry,
  CylinderGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  WebGLRenderer,
  ACESFilmicToneMapping,
  PCFSoftShadowMap,
  SRGBColorSpace,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  dailyEnergyKwh,
  panelAreaForKwp,
  planeOfArrayIrradiance,
  solarPosition,
} from "@/lib/solarGeometry";
import { getProvinceSolarMonthly } from "@shared/provinceSolarMonthly";

export type ViewerInput = {
  slug: string;
  provinceNameTh: string;
  lat: number;
  /** Daily global horizontal irradiation for each month, kWh/m2/day. */
  monthlyGhi: readonly number[];
  systemKwp: number;
  moduleEfficiency: number;
  /** Approximate day of year for each month, used for the sun path. */
  labels: readonly string[];
  titleId: string;
  fallbackText: string;
  unitLabel: string;
  tiltLabel: string;
  energyLabel: string;
  noWebglLabel: string;
};

const MONTH_DAY_OF_YEAR = [17, 47, 75, 105, 135, 162, 198, 228, 258, 288, 318, 344];
const MODULE_W = 1.1;
const MODULE_H = 2.2;
const BAY_COUNT = 6;
const CANOPY_DEPTH = BAY_COUNT * 2.7;

function hasWebgl(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") || canvas.getContext("webgl")
    );
  } catch {
    return false;
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function SolarCarportViewer(props: ViewerInput) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [webgl, setWebgl] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);
  const [monthIndex, setMonthIndex] = useState(2);
  const [tilt, setTilt] = useState(12);

  const series = getProvinceSolarMonthly(props.slug);
  // Memoised so the scene effect does not tear down and rebuild on every render.
  const ghiByMonth = useMemo(
    () =>
      series && series.length === 12
        ? series.map(m => m.irradiationDaily)
        : props.monthlyGhi,
    [series, props.monthlyGhi]
  );
  const labels = props.labels.length === 12 ? props.labels : MONTH_DAY_OF_YEAR.map(String);

  useEffect(() => {
    setWebgl(hasWebgl());
    setReduced(prefersReducedMotion());
  }, []);

  // Scene lifecycle. This component only mounts after the visitor asks for the
  // 3D view, so the Three.js chunk is never fetched otherwise.
  useEffect(() => {
    if (!webgl) return;
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let frame = 0;
    let renderer: WebGLRenderer | null = null;
    let controls: OrbitControls | null = null;

    try {
      const scene = new Scene();
      scene.background = new Color("#0b1220");

      const camera = new PerspectiveCamera(42, 1, 0.1, 400);
      camera.position.set(16, 11, 18);

      renderer = new WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.outputColorSpace = SRGBColorSpace;
      renderer.toneMapping = ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = PCFSoftShadowMap;
      host.appendChild(renderer.domElement);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.maxPolarAngle = Math.PI * 0.49;
      controls.minDistance = 10;
      controls.maxDistance = 60;
      controls.target.set(0, 2.4, 0);

      const hemi = new HemisphereLight("#cfe6ff", "#0a1220", 0.7);
      scene.add(hemi);

      const sun = new DirectionalLight("#fff6e2", 2.6);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      scene.add(sun);
      scene.add(sun.target);

      // Ground.
      const ground = new Mesh(
        new PlaneGeometry(120, 120),
        new MeshStandardMaterial({ color: "#111c2b", roughness: 0.95, metalness: 0 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      const structure = new Group();
      scene.add(structure);

      const steelMat = new MeshStandardMaterial({
        color: "#8fa3b8",
        roughness: 0.45,
        metalness: 0.65,
      });
      const panelMat = new MeshStandardMaterial({
        color: "#123a63",
        roughness: 0.28,
        metalness: 0.35,
        emissive: new Color("#0b2d4d"),
        emissiveIntensity: 0.35,
        side: DoubleSide,
      });
      const bayMat = new MeshStandardMaterial({ color: "#2c3a4b", roughness: 0.9 });
      const carMat = new MeshStandardMaterial({ color: "#3b4a5c", roughness: 0.6, metalness: 0.2 });
      const accentMat = new MeshStandardMaterial({
        color: "#22d3ee",
        roughness: 0.4,
        metalness: 0.3,
      });

      // Columns and beams.
      const colGeo = new CylinderGeometry(0.16, 0.18, 4.6, 12);
      for (let i = 0; i <= BAY_COUNT; i += 2) {
        for (const z of [-CANOPY_DEPTH / 2, CANOPY_DEPTH / 2]) {
          const col = new Mesh(colGeo, steelMat);
          col.position.set(0, 2.3, z);
          col.castShadow = true;
          structure.add(col);
        }
      }
      const beamGeo = new BoxGeometry(0.2, 0.2, CANOPY_DEPTH + 0.4);
      for (let i = 0; i <= BAY_COUNT; i += 2) {
        const beam = new Mesh(beamGeo, steelMat);
        beam.position.set(0, 4.5, 0);
        beam.castShadow = true;
        structure.add(beam);
      }

      // Tilted panel array, rebuilt when the tilt control moves.
      const panelGroup = new Group();
      structure.add(panelGroup);
      const rebuildPanels = (deg: number) => {
        while (panelGroup.children.length) {
          const child = panelGroup.children.pop() as Mesh | undefined;
          if (child) {
            child.geometry?.dispose?.();
            panelGroup.remove(child);
          }
        }
        const radians = (deg * Math.PI) / 180;
        const panelGeo = new PlaneGeometry(MODULE_W, MODULE_H);
        const rows = 2;
        const cols = BAY_COUNT;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const panel = new Mesh(panelGeo, panelMat);
            panel.castShadow = true;
            const y = 4.85 + r * 1.5;
            const z = -CANOPY_DEPTH / 2 + 1.35 + c * 2.7;
            panel.position.set(1.9 + Math.sin(radians) * (r * 1.5), y, z);
            panel.rotation.set(-radians, 0, 0);
            panelGroup.add(panel);
          }
        }
      };
      rebuildPanels(tilt);

      // Parking bays and cars.
      const bayGeo = new BoxGeometry(2.4, 0.06, 5);
      const carGeo = new BoxGeometry(1.8, 0.9, 4.2);
      for (let i = 0; i < BAY_COUNT; i++) {
        const z = -CANOPY_DEPTH / 2 + 1.35 + i * 2.7;
        const bay = new Mesh(bayGeo, bayMat);
        bay.position.set(0, 0.03, z);
        bay.receiveShadow = true;
        structure.add(bay);
        if (i % 2 === 0) {
          const car = new Mesh(carGeo, carMat);
          car.position.set(0, 0.5, z);
          car.castShadow = true;
          structure.add(car);
        }
      }

      // EV charger and BESS cabinet.
      const charger = new Mesh(new BoxGeometry(0.5, 1.6, 0.35), accentMat);
      charger.position.set(-0.9, 0.8, CANOPY_DEPTH / 2 - 0.4);
      charger.castShadow = true;
      structure.add(charger);

      const bess = new Mesh(new BoxGeometry(1.6, 2.1, 0.7), steelMat);
      bess.position.set(-2.6, 1.05, -CANOPY_DEPTH / 2 + 1.2);
      bess.castShadow = true;
      structure.add(bess);

      // Sun marker.
      const sunBall = new Mesh(
        new BoxGeometry(0.9, 0.9, 0.9),
        new MeshBasicMaterial({ color: "#ffd166" })
      );
      scene.add(sunBall);

      const resize = () => {
        if (disposed || !renderer || !host) return;
        const width = Math.max(host.clientWidth, 320);
        const height = Math.max(Math.min(host.clientWidth * 0.58, 420), 240);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      resize();
      window.addEventListener("resize", resize);

      const applySun = () => {
        const ghi = ghiByMonth[monthIndex] ?? 0;
        const day = MONTH_DAY_OF_YEAR[monthIndex] ?? 172;
        const pos = solarPosition(props.lat, day, 12);
        const radius = 26;
        const el = (pos.elevation * Math.PI) / 180;
        const az = (pos.azimuth * Math.PI) / 180;
        const x = radius * Math.cos(el) * Math.sin(az);
        const y = Math.max(1, radius * Math.sin(el));
        const z = radius * Math.cos(el) * Math.cos(az);
        sun.position.set(x, y, z);
        sunBall.position.set(x, y, z);
        sun.target.position.set(2, 0, 0);
        sun.target.updateMatrixWorld();
        rebuildPanels(tilt);
      };
      applySun();

      let last = 0;
      const loop = (time: number) => {
        if (disposed) return;
        frame = requestAnimationFrame(loop);
        if (time - last < 33) return;
        last = time;
        controls?.update();
        renderer?.render(scene, camera);
      };

      if (reduced) {
        controls?.update();
        renderer.render(scene, camera);
        setReady(true);
      } else {
        frame = requestAnimationFrame(loop);
        setReady(true);
      }

      return () => {
        disposed = true;
        cancelAnimationFrame(frame);
        window.removeEventListener("resize", resize);
        controls?.dispose();
        scene.traverse((object: Object3D) => {
          const mesh = object as Mesh;
          mesh.geometry?.dispose?.();
          const material = mesh.material as
            | MeshStandardMaterial
            | MeshBasicMaterial
            | undefined;
          if (Array.isArray(material)) material.forEach(m => m.dispose?.());
          else material?.dispose?.();
        });
        renderer?.dispose();
        if (renderer?.domElement.parentElement === host) {
          host.removeChild(renderer.domElement);
        }
      };
    } catch {
      setWebgl(false);
      return undefined;
    }
  }, [webgl, reduced, monthIndex, tilt, props.lat, props.slug, ghiByMonth]);

  const sun = solarPosition(props.lat, MONTH_DAY_OF_YEAR[monthIndex] ?? 172, 12);
  const poa =
    planeOfArrayIrradiance({
      ghi: (ghiByMonth[monthIndex] ?? 0) * 1000,
      solar: sun,
      tiltDeg: tilt,
      azimuthDeg: 180,
    }) / 1000;
  const energy = dailyEnergyKwh(
    poa,
    panelAreaForKwp(props.systemKwp),
    props.moduleEfficiency
  );

  return (
    <div ref={hostRef} data-sirinx-viewer={props.slug} className="relative">
      <div
        className="overflow-hidden rounded-2xl border border-border-subtle bg-[#0b1220]"
        style={{ minHeight: 240 }}
      />

      {!ready ? (
        <p className="mt-3 text-sm text-text-muted" aria-live="polite">
          {props.fallbackText}
        </p>
      ) : null}
      {!webgl ? (
        <p className="mt-3 text-sm text-text-secondary">{props.noWebglLabel}</p>
      ) : null}

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-xl border border-border-subtle bg-surface-elevated px-4 py-3">
          <dt className="text-xs text-text-muted">{props.unitLabel}</dt>
          <dd className="mt-1 font-display text-lg font-semibold text-foreground">
            {poa.toFixed(2)} kWh/m²/วัน
          </dd>
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface-elevated px-4 py-3">
          <dt className="text-xs text-text-muted">{props.energyLabel}</dt>
          <dd className="mt-1 font-display text-lg font-semibold text-foreground">
            {Math.round(energy)} kWh/วัน
          </dd>
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface-elevated px-4 py-3">
          <dt className="text-xs text-text-muted">{props.tiltLabel}</dt>
          <dd className="mt-1 font-display text-lg font-semibold text-foreground">
            {Math.round(sun.elevation)}°
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <label className="flex-1 text-xs text-text-muted">
          <span className="mb-1 block">{labels[monthIndex]}</span>
          <input
            type="range"
            min={0}
            max={11}
            step={1}
            value={monthIndex}
            onChange={event => setMonthIndex(Number(event.target.value))}
            className="w-full"
            aria-label={props.titleId}
          />
        </label>
        <label className="flex-1 text-xs text-text-muted">
          <span className="mb-1 block">{props.tiltLabel}</span>
          <input
            type="range"
            min={0}
            max={30}
            step={1}
            value={tilt}
            onChange={event => setTilt(Number(event.target.value))}
            className="w-full"
            aria-label={props.tiltLabel}
          />
        </label>
      </div>
    </div>
  );
}
