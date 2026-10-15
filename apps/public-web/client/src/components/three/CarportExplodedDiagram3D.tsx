/**
 * CarportExplodedDiagram3D — R30-P3, Concept C.
 *
 * 3D exploded technical diagram of a solar carport structure, mounted on
 * /solar-carport. The assembly separates into its seven real layers along the
 * vertical axis and reassembles on a slow cycle, so one canvas carries both the
 * "what it is" view and the "what is inside it" view.
 *
 * Every figure on screen is computed, never typed:
 *  - panel tilt comes from shared/sunMath (mean solar-noon elevation across the
 *    two solstices and the two equinoxes at the site's own coordinates)
 *  - sunrise/sunset come from shared/sunMath's daylight window
 *  - the key light sweeps the real sun azimuth/elevation between those hours
 *  - irradiation and specific yield come from shared/provinceEnergyData.ts
 *
 * The diagram is a visualisation of astronomy plus PVGIS climate normals. It is
 * NOT a site design, a structural drawing, or a savings promise.
 *
 * WebGL budget, same contract as ProvinceSolarScene / SolarHeroScene:
 *  - three.js is imported dynamically, so it never lands in an entry chunk
 *  - DPR capped at 2 and re-capped on every resize
 *  - rAF stops when document.hidden and when the canvas leaves the viewport
 *  - webglcontextlost / webglcontextrestored handled, text shown in between
 *  - dispose() is idempotent and returns geometry, material, texture, renderer
 *  - prefers-reduced-motion renders exactly one static, fully exploded frame
 *  - canvas is aria-hidden; the text alternative is linked with aria-describedby
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { Material } from "three";
import { getProvinceEnergyFact } from "@shared/provinceEnergyData";
import { getProvinceBySlug } from "@shared/thaiProvinces";
import { daylightWindow, solarPosition } from "@shared/sunMath";

export type CarportExplodedDiagram3DProps = {
  /** Province slug used for the sun geometry and the PVGIS figures. */
  slug: string;
};

/**
 * Structure layers, top of the stack first: that is the order a reader sees
 * them explode. The colour is a CSS hex string on purpose — the same value
 * feeds the Three.js material and the HTML legend swatch, so the legend cannot
 * drift away from the geometry it names.
 */
export const CARPORT_LAYERS = [
  { id: "modules", labelTh: "แผงโซลาร์ PV module", color: "#0ea5e9" },
  { id: "rails", labelTh: "รางยึดแผง mounting rail", color: "#38bdf8" },
  { id: "beams", labelTh: "คานหลัก main beam", color: "#a8a29e" },
  { id: "inverter", labelTh: "อินเวอร์เตอร์และกล่องควบคุม", color: "#f59e0b" },
  { id: "gutter", labelTh: "รางระบายน้ำ gutter", color: "#22d3ee" },
  { id: "columns", labelTh: "เสาเหล็ก steel column", color: "#78716c" },
  { id: "foundation", labelTh: "ฐานราก foundation", color: "#57534e" },
] as const;

/** Seconds for one assembled → exploded → assembled breath. */
export const EXPLODE_CYCLE_SECONDS = 9;
/** World units one layer travels per step at full explode. */
export const EXPLODE_SPACING = 0.55;
/** Height of the canopy clearance plane in world units. */
const CANOPY_Y = 3.35;
const COLUMN_HEIGHT = 3.1;
const BAY_HALF_WIDTH = 5.6;
const BAY_HALF_DEPTH = 4.2;
const COLUMN_ROWS = 3;
/** Panel array: 4 across × 3 deep, one InstancedMesh for the whole layer. */
const MODULE_COLS = 4;
const MODULE_ROWS = 3;
const MODULE_W = 2.4;
const MODULE_D = 2.1;
/** Solar-noon reference dates: March and September equinox, both solstices. */
const NOON_REFERENCE_MONTH_DAY: ReadonlyArray<readonly [number, number]> = [
  [2, 20],
  [5, 21],
  [8, 22],
  [11, 21],
];

export type CarportSunGeometry = {
  /** Panel tilt from horizontal, degrees. */
  tiltDeg: number;
  /** Mean solar-noon elevation across the four reference dates, degrees. */
  noonElevationDeg: number;
  /** Local sunrise / sunset in fractional hours (UTC+7), null if not computable. */
  sunriseHour: number | null;
  sunsetHour: number | null;
};

/** Highest solar elevation of one calendar day, found on a 4-minute grid. */
export function dailyNoonElevationDeg(
  latitudeDeg: number,
  longitudeDeg: number,
  date: Date,
): number {
  let best = -90;
  for (let minute = 0; minute < 1440; minute += 4) {
    const probe = new Date(date.getTime());
    probe.setUTCMinutes(probe.getUTCMinutes() + minute);
    const p = solarPosition(latitudeDeg, longitudeDeg, probe);
    if (p.elevationDeg > best) best = p.elevationDeg;
  }
  return best;
}

/**
 * Panel tilt derived from astronomy, not from a catalogue number: the mean
 * solar-noon elevation of the two solstices and the two equinoxes, turned into
 * a tilt so the panel plane faces the mean noon sun.
 */
export function seasonalTiltDeg(
  latitudeDeg: number,
  longitudeDeg: number,
): number {
  const elevations = NOON_REFERENCE_MONTH_DAY.map(([month, day]) =>
    dailyNoonElevationDeg(
      latitudeDeg,
      longitudeDeg,
      new Date(Date.UTC(2026, month, day, 0, 0, 0)),
    ),
  );
  const mean = elevations.reduce((a, b) => a + b, 0) / elevations.length;
  const tilt = Math.min(60, Math.max(0, 90 - mean));
  return Math.round(tilt * 100) / 100;
}

/** Sunrise / sunset in local hours for the equinox nearest the reference year. */
function daylightHoursAtEquinox(
  latitudeDeg: number,
  longitudeDeg: number,
): { sunriseHour: number | null; sunsetHour: number | null } {
  const window = daylightWindow(
    latitudeDeg,
    longitudeDeg,
    new Date(Date.UTC(2026, 2, 20, 0, 0, 0)),
  );
  if (!window) return { sunriseHour: null, sunsetHour: null };
  return {
    sunriseHour: Math.round(window.sunriseHour * 100) / 100,
    sunsetHour: Math.round(window.sunsetHour * 100) / 100,
  };
}

/** All sun numbers the diagram and its text alternative quote. */
export function carportSunGeometry(
  latitudeDeg: number,
  longitudeDeg: number,
): CarportSunGeometry {
  return {
    tiltDeg: seasonalTiltDeg(latitudeDeg, longitudeDeg),
    noonElevationDeg: Math.round(
      dailyNoonElevationDeg(
        latitudeDeg,
        longitudeDeg,
        new Date(Date.UTC(2026, 5, 21, 0, 0, 0)),
      ) * 100,
    ) / 100,
    ...daylightHoursAtEquinox(latitudeDeg, longitudeDeg),
  };
}

/**
 * Explode amount over the breath cycle: 0 assembled, 1 fully separated, with a
 * smoothstep so the layers ease instead of snapping. Peaks at half a cycle,
 * which is the frame the reduced-motion path freezes.
 */
export function explodeAmountAt(elapsedSeconds: number): number {
  const period = EXPLODE_CYCLE_SECONDS;
  const phase = ((elapsedSeconds % period) + period) % period / period;
  const triangle = phase < 0.5 ? phase * 2 : 2 - phase * 2;
  return triangle * triangle * (3 - 2 * triangle);
}

/** Vertical travel of one layer, in world units. Foundation is layer zero. */
export function layerExplodeOffset(layerFromBottom: number): number {
  return layerFromBottom * EXPLODE_SPACING;
}

/** Assembled Y of each layer, bottom first. Mirrors CARPORT_LAYERS reversed. */
const LAYER_BASE_Y_BOTTOM_FIRST = [
  0.02, // foundation
  COLUMN_HEIGHT / 2, // columns
  CANOPY_Y - 0.42, // gutter
  CANOPY_Y - 0.78, // inverter cabinet
  CANOPY_Y - 0.3, // main beams
  CANOPY_Y - 0.12, // mounting rails
  CANOPY_Y + 0.06, // PV modules
] as const;

function formatHour(hour: number | null): string {
  if (hour === null) return "ไม่ทราบ";
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function CarportExplodedDiagram3D({
  slug,
}: CarportExplodedDiagram3DProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [graphicsError, setGraphicsError] = useState(false);
  const fact = getProvinceEnergyFact(slug);
  const nameTh = getProvinceBySlug(slug)?.nameTh ?? slug;

  const sun = useMemo(
    () =>
      fact
        ? carportSunGeometry(fact.lat, fact.lon)
        : {
            tiltDeg: 0,
            noonElevationDeg: 0,
            sunriseHour: null,
            sunsetHour: null,
          },
    [fact],
  );

  const descriptionId = `carport-exploded-description-${slug}`;
  const sourceLine = fact
    ? `${fact.source.name} · ${fact.source.database}, ${fact.source.yearRange}`
    : "";

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !fact) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;

    // Dynamic import: a static `import * as THREE from "three"` here would pull
    // the whole engine into the chunk that loads this page.
    void import("three").then((THREE) => {
      if (disposed || !hostRef.current) return;

      const width = host.clientWidth || 720;
      const height = host.clientHeight || 420;
      // Optional call, like SolarHeroScene: an engine without matchMedia (older
      // embedded webviews, some test environments) animates rather than
      // crashing, which is the safer failure for a decorative canvas.
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
      scene.fog = new THREE.Fog(0x0c0a09, 34, 96);
      const camera = new THREE.PerspectiveCamera(
        42,
        width / height,
        0.1,
        220,
      );
      const target = new THREE.Vector3(0, 2.4, 0);
      // Scene axes: +X east, -Z south (the same mapping ProvinceSolarScene uses
      // for its sun disc), +Y up. The panel array therefore tilts toward -Z.
      const tiltRad = (sun.tiltDeg * Math.PI) / 180;

      // ── Layer groups, bottom first, each one a real part of the structure ─
      const layerGroups = LAYER_BASE_Y_BOTTOM_FIRST.map((baseY, index) => {
        const group = new THREE.Group();
        group.position.y = baseY;
        group.userData = { baseY, index };
        scene.add(group);
        return group;
      });
      const [foundation, columns, gutter, inverter, beams, rails, modules] =
        layerGroups;

      const materialOf = (color: string, extra: Record<string, unknown> = {}) =>
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.42,
          metalness: 0.45,
          ...extra,
        });
      const foundationMat = materialOf(CARPORT_LAYERS[6].color, {
        roughness: 0.95,
        metalness: 0,
      });
      const columnMat = materialOf(CARPORT_LAYERS[5].color);
      const gutterMat = materialOf(CARPORT_LAYERS[4].color, { metalness: 0.7 });
      const inverterMat = materialOf(CARPORT_LAYERS[3].color, {
        metalness: 0.2,
        roughness: 0.6,
      });
      const beamMat = materialOf(CARPORT_LAYERS[2].color);
      const railMat = materialOf(CARPORT_LAYERS[1].color, { metalness: 0.8 });
      const moduleMat = materialOf(CARPORT_LAYERS[0].color, {
        roughness: 0.2,
        metalness: 0.55,
        emissive: 0x0c4a6e,
        emissiveIntensity: 0.4,
      });

      // 0 — foundation slab
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(BAY_HALF_WIDTH * 2 + 0.8, 0.12, BAY_HALF_DEPTH * 2 + 0.8),
        foundationMat,
      );
      slab.position.y = -0.06;
      foundation.add(slab);

      // 1 — steel columns, one InstancedMesh for the whole layer
      const columnGeo = new THREE.CylinderGeometry(0.11, 0.13, COLUMN_HEIGHT, 12);
      const columnPositions: [number, number][] = [];
      for (let r = 0; r < COLUMN_ROWS; r++) {
        const z = (r - (COLUMN_ROWS - 1) / 2) * (BAY_HALF_DEPTH * 1.1);
        columnPositions.push([-BAY_HALF_WIDTH, z], [BAY_HALF_WIDTH, z]);
      }
      const columnMesh = new THREE.InstancedMesh(
        columnGeo,
        columnMat,
        columnPositions.length,
      );
      {
        const matrix = new THREE.Matrix4();
        columnPositions.forEach(([x, z], i) => {
          matrix.makeTranslation(x, 0, z);
          columnMesh.setMatrixAt(i, matrix);
        });
        columnMesh.instanceMatrix.needsUpdate = true;
      }
      columns.add(columnMesh);

      // 2 — rain gutter along the low (south) edge
      const gutterMesh = new THREE.Mesh(
        new THREE.BoxGeometry(BAY_HALF_WIDTH * 2, 0.16, 0.24),
        gutterMat,
      );
      gutterMesh.position.set(0, 0, -BAY_HALF_DEPTH);
      gutter.add(gutterMesh);
      const downpipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, CANOPY_Y - 0.4, 8),
        gutterMat,
      );
      downpipe.position.set(BAY_HALF_WIDTH - 0.2, -(CANOPY_Y - 0.4) / 2, -BAY_HALF_DEPTH);
      gutter.add(downpipe);

      // 3 — string inverter and control cabinet hung under the canopy
      const inverterMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.62, 0.34),
        inverterMat,
      );
      inverterMesh.position.set(1.9, 0, -1.4);
      inverter.add(inverterMesh);
      const controlBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.44, 0.5, 0.22),
        inverterMat,
      );
      controlBox.position.set(-1.9, 0, -1.4);
      inverter.add(controlBox);

      // 4 — main beams running east-west on both column rows
      for (const x of [-BAY_HALF_WIDTH, BAY_HALF_WIDTH]) {
        const beam = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 0.24, BAY_HALF_DEPTH * 2 + 0.4),
          beamMat,
        );
        beam.position.set(x, 0, 0);
        beams.add(beam);
      }

      // 5 — mounting rails the modules clamp onto
      for (let r = 0; r < MODULE_ROWS + 1; r++) {
        const z =
          (r - MODULE_ROWS / 2) * ((BAY_HALF_DEPTH * 2) / MODULE_ROWS);
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(BAY_HALF_WIDTH * 2, 0.07, 0.09),
          railMat,
        );
        rail.position.set(0, 0, z);
        rails.add(rail);
      }

      // 6 — PV module array, tilted by the seasonal tilt derived from sunMath
      const moduleGroup = new THREE.Group();
      moduleGroup.rotation.x = -tiltRad;
      modules.add(moduleGroup);
      const moduleGeo = new THREE.BoxGeometry(MODULE_W, 0.05, MODULE_D);
      const moduleMesh = new THREE.InstancedMesh(
        moduleGeo,
        moduleMat,
        MODULE_COLS * MODULE_ROWS,
      );
      {
        const matrix = new THREE.Matrix4();
        const quat = new THREE.Quaternion();
        const scale = new THREE.Vector3(1, 1, 1);
        let i = 0;
        for (let r = 0; r < MODULE_ROWS; r++) {
          for (let c = 0; c < MODULE_COLS; c++) {
            const x = (c - (MODULE_COLS - 1) / 2) * (MODULE_W + 0.1);
            const z = (r - (MODULE_ROWS - 1) / 2) * (MODULE_D + 0.08);
            matrix.compose(new THREE.Vector3(x, 0, z), quat, scale);
            moduleMesh.setMatrixAt(i++, matrix);
          }
        }
        moduleMesh.instanceMatrix.needsUpdate = true;
      }
      moduleGroup.add(moduleMesh);

      // Ground + centre axis: reference lines for a technical reading.
      const groundMat = new THREE.MeshStandardMaterial({
        color: 0x1c1917,
        roughness: 0.96,
        metalness: 0,
      });
      const ground = new THREE.Mesh(
        new THREE.CircleGeometry(40, 48),
        groundMat,
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.1;
      scene.add(ground);
      const axisGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -0.05, 0),
        new THREE.Vector3(0, 9, 0),
      ]);
      const axisMat = new THREE.LineBasicMaterial({ color: 0x57534e });
      scene.add(new THREE.Line(axisGeo, axisMat));

      // ── Lights: the key light follows the real sun between sunrise and sunset ─
      const hemisphere = new THREE.HemisphereLight(0x93c5fd, 0x1c1917, 1.1);
      scene.add(hemisphere);
      const keyLight = new THREE.DirectionalLight(0xfff2dd, 2.2);
      scene.add(keyLight);
      const fillLight = new THREE.DirectionalLight(0xbae6fd, 0.5);
      fillLight.position.set(-8, 5, 8);
      scene.add(fillLight);

      const sunrise = sun.sunriseHour ?? 6;
      const sunset = sun.sunsetHour ?? 18;
      // Guards a null daylight window: the sun sweep must never divide by a
      // non-positive span.
      const daySpan = Math.max(0.5, sunset - sunrise);
      const placeSun = (localHour: number) => {
        const utc = new Date(Date.UTC(2026, 2, 20, 0, 0, 0));
        utc.setUTCMinutes(utc.getUTCMinutes() + localHour * 60 - 420);
        const p = solarPosition(fact.lat, fact.lon, utc);
        const elev = (p.elevationDeg * Math.PI) / 180;
        const az = (p.azimuthDeg * Math.PI) / 180;
        const r = 22;
        keyLight.position.set(
          -Math.sin(az) * Math.cos(elev) * r,
          Math.max(0.5, Math.sin(elev) * r),
          Math.cos(az) * Math.cos(elev) * r,
        );
        const dayness = Math.max(0, Math.sin(Math.max(0, elev)));
        keyLight.intensity = 0.4 + dayness * 2.2;
        hemisphere.intensity = 0.45 + dayness * 0.85;
      };
      placeSun((sunrise + sunset) / 2);

      // ── Camera: slow orbit, drag to look around, no OrbitControls dependency ─
      const CAMERA_RADIUS = 13.5;
      let azimuth = Math.PI * 0.86;
      let polar = 1.12;
      const AUTO_ORBIT_SPEED = 0.08; // rad/s, frame-rate independent
      const placeCamera = () => {
        camera.position.set(
          Math.sin(polar) * Math.sin(azimuth) * CAMERA_RADIUS,
          Math.cos(polar) * CAMERA_RADIUS + target.y,
          Math.sin(polar) * Math.cos(azimuth) * CAMERA_RADIUS,
        );
        camera.lookAt(target);
      };
      placeCamera();

      let dragging = false;
      let lastX = 0;
      let lastY = 0;
      const onPointerDown = (event: PointerEvent) => {
        dragging = true;
        lastX = event.clientX;
        lastY = event.clientY;
      };
      const onPointerMove = (event: PointerEvent) => {
        if (!dragging || reduceMotion) return;
        azimuth -= (event.clientX - lastX) * 0.008;
        polar = Math.min(
          1.5,
          Math.max(0.35, polar - (event.clientY - lastY) * 0.006),
        );
        lastX = event.clientX;
        lastY = event.clientY;
        placeCamera();
      };
      const onPointerUp = () => {
        dragging = false;
      };
      renderer.domElement.addEventListener("pointerdown", onPointerDown);
      renderer.domElement.addEventListener("pointermove", onPointerMove);
      renderer.domElement.addEventListener("pointerup", onPointerUp);
      renderer.domElement.addEventListener("pointercancel", onPointerUp);
      renderer.domElement.addEventListener("pointerleave", onPointerUp);

      // ── Frame state ───────────────────────────────────────────────────────
      const setExplode = (amount: number) => {
        layerGroups.forEach((group, i) => {
          group.position.y = group.userData.baseY + layerExplodeOffset(i) * amount;
        });
      };
      setExplode(reduceMotion ? 1 : 0);

      let raf = 0;
      let isVisible = true;
      let contextLost = false;
      let resourcesDisposed = false;

      const disposeGpuResources = () => {
        if (resourcesDisposed) return;
        resourcesDisposed = true;
        // A material shared by two parts (the gutter and its downpipe, the
        // inverter and its control box) is one GPU object, so it is released
        // once — dispose() must be idempotent per resource, not per mesh.
        const released = new Set<unknown>();
        const release = (resource: { dispose?: () => void } | undefined) => {
          if (!resource?.dispose || released.has(resource)) return;
          released.add(resource);
          resource.dispose();
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
            // A future material may carry a map; dispose it instead of leaking.
            Object.values(mat).forEach((value) => {
              const tex = value as { isTexture?: boolean; dispose?: () => void };
              if (tex?.isTexture) release(tex);
            });
            release(m as Material);
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
          isVisible &&
          !document.hidden &&
          !reduceMotion &&
          !raf
        ) {
          raf = requestAnimationFrame(frame);
        }
      };

      let elapsed = 0;
      let lastNow = performance.now();
      const frame = () => {
        raf = 0;
        if (disposed || contextLost || !isVisible || document.hidden) return;
        const now = performance.now();
        // Cap the delta so a backgrounded tab does not jump the animation.
        const delta = Math.min((now - lastNow) / 1000, 0.1);
        lastNow = now;
        elapsed += delta;
        if (!dragging) azimuth += AUTO_ORBIT_SPEED * delta;
        placeCamera();
        setExplode(explodeAmountAt(elapsed));
        placeSun(sunrise + (elapsed % daySpan));
        renderer.render(scene, camera);
        schedule();
      };

      const observer = new IntersectionObserver(
        (entries) => {
          isVisible = entries[0]?.isIntersecting ?? true;
          if (isVisible) schedule();
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
        lastNow = performance.now();
        schedule();
      };
      document.addEventListener("visibilitychange", onVisibilityChange);

      const onContextLost = (event: Event) => {
        event.preventDefault();
        contextLost = true;
        stop();
        setGraphicsError(true);
        disposeGpuResources();
      };
      const onContextRestored = () => {
        if (disposed) return;
        contextLost = false;
        resourcesDisposed = false;
        setGraphicsError(false);
        setExplode(explodeAmountAt(elapsed));
        placeCamera();
        placeSun(sunrise + (elapsed % daySpan));
        renderer.render(scene, camera);
        schedule();
      };
      renderer.domElement.addEventListener("webglcontextlost", onContextLost);
      renderer.domElement.addEventListener(
        "webglcontextrestored",
        onContextRestored,
      );

      if (reduceMotion) {
        // Exactly one static frame, fully exploded: the frame that carries the
        // most information for a reader who asked for no motion.
        setExplode(1);
        placeSun((sunrise + sunset) / 2);
        renderer.render(scene, camera);
      } else {
        schedule();
      }

      const onResize = () => {
        if (disposed) return;
        const w = host.clientWidth || 720;
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
        renderer.domElement.removeEventListener("pointerdown", onPointerDown);
        renderer.domElement.removeEventListener("pointermove", onPointerMove);
        renderer.domElement.removeEventListener("pointerup", onPointerUp);
        renderer.domElement.removeEventListener("pointercancel", onPointerUp);
        renderer.domElement.removeEventListener("pointerleave", onPointerUp);
        renderer.domElement.removeEventListener(
          "webglcontextlost",
          onContextLost,
        );
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
  }, [slug, fact, sun]);

  if (!fact) {
    return (
      <p className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 text-sm text-foreground">
        ยังไม่มีข้อมูลพลังงานแสงอาทิตย์ของจังหวัด{slug} ในฐานข้อมูล
        จึงไม่สร้างผังสามมิติเพื่อไม่ให้แสดงตัวเลขที่ไม่มีแหล่งอ้างอิง
      </p>
    );
  }

  return (
    <figure
      className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-elevated"
      data-sirinx-carport-diagram={slug}
    >
      <div
        ref={hostRef}
        className="h-[420px] w-full"
        aria-describedby={descriptionId}
      />
      <p id={descriptionId} className="sr-only" lang="en">
        Exploded 3D technical diagram of a {nameTh} solar carport, drawn as{" "}
        {CARPORT_LAYERS.length} separated layers:{" "}
        {CARPORT_LAYERS.map((l) => l.labelTh).join(", ")}. The panel tilt shown
        is {sun.tiltDeg} degrees, derived from the mean solar-noon elevation of
        {sun.noonElevationDeg} degrees across the two equinoxes and two solstices
        at latitude {fact.lat} and longitude {fact.lon}, calculated by
        shared/sunMath. Sunrise is {formatHour(sun.sunriseHour)} and sunset{" "}
        {formatHour(sun.sunsetHour)} local time on the March equinox, also from
        shared/sunMath. Global horizontal irradiation is{" "}
        {fact.irradiationDaily} kWh/m2/day and specific yield is{" "}
        {fact.specificYield} kWh/kWp/year, PVGIS climate normals for the
        province centroid, not a site survey and not a savings promise.
        Visualization of astronomy and climate normals only, not a structural
        drawing.
      </p>
      {graphicsError && (
        <p role="status" className="p-4 text-foreground">
          ไม่สามารถแสดงผังโครงสร้างสามมิติได้ในอุปกรณ์นี้
        </p>
      )}
      <figcaption className="border-t border-border-subtle p-4 text-sm">
        <p className="font-semibold text-foreground">
          ผังโครงสร้าง Solar Carport แบบแยกชั้น — จังหวัด{nameTh}
        </p>
        <p className="text-text-secondary">
          ความเอียงแผง {sun.tiltDeg}° (คำนวณจากระดับดวงอาทิตย์เฉลี่ยของปีที่พิกัด{" "}
          {fact.lat}/{fact.lon}) · แสงอาทิตย์ขึ้น {formatHour(sun.sunriseHour)}{" "}
          น. ถึง {formatHour(sun.sunsetHour)} น. · รังสีเฉลี่ย{" "}
          {fact.irradiationDaily} kWh/m²/วัน · ผลผลิตเฉพาะ {fact.specificYield}{" "}
          kWh/kWp/ปี
        </p>
        <ol className="mt-3 grid gap-1 sm:grid-cols-2">
          {CARPORT_LAYERS.map((layer, i) => (
            <li
              key={layer.id}
              className="flex items-center gap-2 text-xs text-text-secondary"
            >
              <span
                aria-hidden="true"
                className="inline-block h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: layer.color }}
              />
              <span className="font-mono text-text-muted">{i + 1}</span>
              {layer.labelTh}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-text-muted">
          ภาพจำลองเพื่ออธิบายโครงสร้าง ไม่ใช่แบบก่อสร้างจริง · ค่าปกติสภาพอากาศ
          ไม่ใช่คำสัญญาประหยัด · แหล่งข้อมูล: {sourceLine}
        </p>
      </figcaption>
    </figure>
  );
}
