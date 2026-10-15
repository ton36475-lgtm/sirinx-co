/**
 * Province image scene — vanilla three.js render used ONLY by the offline
 * screenshot pipeline (docs/seo/generate-province-images.mjs).
 *
 * Art direction: "Cyber Clean Tech". The previous version was a daylight
 * parking-lot mockup — blocky cars, featureless black slabs for panels, a
 * warm orange sky — which read as an untextured 3D placeholder in link
 * previews. This is the same scene rebuilt in the brand palette:
 *
 *   #080C14 Deep Space Carbon   background
 *   #00F2FE Solar Energy Cyan   energy flow, panel sheen
 *   #10B981 Eco Emerald         secondary flow, active data
 *   #FF9F43 Solar Amber Glow    focal point, the headline number
 *
 * Every figure in the overlay comes from the same shared records the page
 * prose uses (provinceEnergyData / provinceSolarMonthly, PVGIS v5.3) and the
 * sun position comes from shared/sunMath.ts (NOAA equations) at solar noon on
 * the province's best month — so each image is genuinely province-specific,
 * not a renamed template.
 *
 * The screenshot captures canvas + DOM together, so the data overlay renders
 * with real Thai fonts and crisp text.
 */
import * as THREE from "three";
import { provinceEnergyData } from "../../../apps/public-web/shared/provinceEnergyData.ts";
import { provinceSolarMonthly } from "../../../apps/public-web/shared/provinceSolarMonthly.ts";
import { thaiProvinces } from "../../../apps/public-web/shared/thaiProvinces.ts";
import { solarPosition } from "../../../apps/public-web/shared/sunMath.ts";

const slug = new URLSearchParams(location.search).get("slug") ?? "bangkok";
const province = thaiProvinces.find((p) => p.slug === slug);
const energy = provinceEnergyData[slug];
const months = provinceSolarMonthly[slug];
if (!province || !energy || !months) {
  throw new Error(`no PVGIS record for ${slug}`);
}

const PALETTE = {
  carbon: "#080c14",
  cyan: "#00f2fe",
  emerald: "#10b981",
  amber: "#ff9f43",
};

const MONTH_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

const values = months.map((m) => m.irradiationDaily);
const peakIndex = values.indexOf(Math.max(...values));
const lowIndex = values.indexOf(Math.min(...values));

const ranked = Object.entries(provinceEnergyData)
  .sort((a, b) => b[1].specificYield - a[1].specificYield);
const rank = ranked.findIndex(([key]) => key === slug) + 1;

// Real sun position: solar noon on the 15th of the province's best month.
const bestMonth = months[peakIndex].month;
const sun = solarPosition(
  energy.lat,
  energy.lon,
  new Date(Date.UTC(2026, bestMonth - 1, 15, 5, 0, 0)), // 12:00 ICT = 05:00 UTC
);

// ---------------------------------------------------------------- overlay DOM
const fmt = (n, d) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

document.getElementById("province-name").textContent = province.nameTh;
document.getElementById("yield-big").textContent = fmt(energy.specificYield, 1);
document.getElementById("irradiation").textContent = `${fmt(energy.irradiationDaily, 2)} kWh/m²/วัน`;
document.getElementById("rank-chip").textContent = `อันดับ ${rank} จาก 77 จังหวัด`;
document.getElementById("sun-chip").textContent =
  `ดวงอาทิตย์เที่ยง ${MONTH_TH[peakIndex]} สูง ${fmt(sun.elevationDeg, 0)}°`;

const barsHost = document.getElementById("bars");
const maxVal = Math.max(...values);
values.forEach((value, index) => {
  const col = document.createElement("div");
  col.className = "col" + (index === peakIndex ? " peak" : index === lowIndex ? " low" : "");
  const bar = document.createElement("div");
  bar.className = "bar";
  bar.style.height = `${(value / maxVal) * 84}px`;
  const label = document.createElement("span");
  label.className = "mlabel";
  label.textContent = MONTH_TH[index];
  col.appendChild(bar);
  col.appendChild(label);
  barsHost.appendChild(col);
});

// ---------------------------------------------------------------- three scene
const canvasHost = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(2);
renderer.setSize(1200, 675);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace;
canvasHost.appendChild(renderer.domElement);

const scene = new THREE.Scene();

// Night sky: deep carbon fading to a thin cyan horizon glow. The sun is below
// the canopy line at this hour, so the light source is the panel array itself.
const skyCanvas = document.createElement("canvas");
skyCanvas.width = 2;
skyCanvas.height = 512;
const skyCtx = skyCanvas.getContext("2d");
const gradient = skyCtx.createLinearGradient(0, 0, 0, 512);
gradient.addColorStop(0, PALETTE.carbon);
gradient.addColorStop(0.6, "#0a1524");
gradient.addColorStop(0.88, "#0d2b38");
gradient.addColorStop(1, "#12414a");
skyCtx.fillStyle = gradient;
skyCtx.fillRect(0, 0, 2, 512);
scene.background = new THREE.CanvasTexture(skyCanvas);
scene.fog = new THREE.Fog(new THREE.Color("#0a1524"), 26, 74);

const camera = new THREE.PerspectiveCamera(40, 1200 / 675, 0.1, 300);
camera.position.set(11, 5.4, 15);
camera.lookAt(0, 1.9, 0);

// Sun direction still drives the key light, so the shadow angle is honest.
const sunAz = THREE.MathUtils.degToRad(THREE.MathUtils.clamp(sun.azimuthDeg, 90, 270));
const sunEl = THREE.MathUtils.degToRad(Math.max(sun.elevationDeg, 8));
const sunDir = new THREE.Vector3(
  Math.sin(sunAz - Math.PI) * Math.cos(sunEl),
  Math.sin(sunEl),
  -Math.cos(sunAz - Math.PI) * Math.cos(sunEl),
).normalize();

// A low amber horizon glow where the sun sits — the brand's focal colour, kept
// behind the canopy so it reads as dawn rather than a floating ball.
const halo = new THREE.Mesh(
  new THREE.SphereGeometry(2.4, 32, 32),
  new THREE.MeshBasicMaterial({ color: PALETTE.amber, transparent: true, opacity: 0.22 }),
);
halo.position.copy(sunDir).multiplyScalar(72);
scene.add(halo);
const haloWide = new THREE.Mesh(
  new THREE.SphereGeometry(6.5, 32, 32),
  new THREE.MeshBasicMaterial({ color: PALETTE.amber, transparent: true, opacity: 0.07 }),
);
haloWide.position.copy(halo.position);
scene.add(haloWide);

// Cyan rim from the opposite side separates the canopy from the dark sky.
const rim = new THREE.DirectionalLight(PALETTE.cyan, 1.5);
rim.position.set(-14, 7, -10);
scene.add(rim);

const key = new THREE.DirectionalLight("#dff4ff", 1.9);
key.position.copy(sunDir).multiplyScalar(30);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -22;
key.shadow.camera.right = 22;
key.shadow.camera.top = 22;
key.shadow.camera.bottom = -22;
scene.add(key);
scene.add(new THREE.HemisphereLight(PALETTE.cyan, PALETTE.carbon, 0.55));
scene.add(new THREE.AmbientLight("#1d2b3a", 0.9));

// Ground: near-black asphalt that only catches the panel glow.
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(160, 160),
  new THREE.MeshStandardMaterial({ color: "#0b0f16", roughness: 0.72, metalness: 0.18 }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const stallMat = new THREE.MeshBasicMaterial({ color: "#1d3b46" });
for (let row = 0; row < 2; row++) {
  for (let i = -3; i <= 3; i++) {
    const stall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 5.2), stallMat);
    stall.position.set(i * 2.7, 0.011, row === 0 ? 2.6 : -2.6);
    scene.add(stall);
  }
}

// Glassmorphism panels: dark reflective glass with a cyan sheen, plus an emissive
// grid so the array reads as photovoltaic cells instead of a black slab.
const panelMat = new THREE.MeshPhysicalMaterial({
  color: "#071018",
  metalness: 0.72,
  roughness: 0.12,
  clearcoat: 1,
  clearcoatRoughness: 0.08,
  emissive: new THREE.Color(PALETTE.cyan),
  emissiveIntensity: 0.1,
});
const cellMat = new THREE.MeshBasicMaterial({ color: PALETTE.cyan, transparent: true, opacity: 0.24 });
const frameMat = new THREE.MeshStandardMaterial({ color: "#26333f", metalness: 0.85, roughness: 0.35 });
const busbarMat = new THREE.MeshBasicMaterial({ color: PALETTE.cyan, transparent: true, opacity: 0.5 });

function carportRow(z, tilt) {
  const group = new THREE.Group();
  for (const x of [-5.4, 0, 5.4]) {
    for (const dz of [-1.9, 1.9]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.4, 0.22), frameMat);
      post.position.set(x, 1.7, z + dz);
      post.castShadow = true;
      group.add(post);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 4.4), frameMat);
    beam.position.set(x, 3.42, z);
    beam.castShadow = true;
    group.add(beam);
  }
  const array = new THREE.Group();
  for (let i = -4; i <= 4; i++) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.07, 3.6), panelMat);
    panel.position.set(i * 1.72, 3.62, 0);
    panel.castShadow = true;
    array.add(panel);

    // Cell grid on the underside: 4 columns x 8 rows of thin cyan traces.
    for (let cx = 0; cx < 4; cx++) {
      const cell = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.34), cellMat);
      cell.rotation.x = Math.PI / 2;
      cell.position.set(i * 1.72 - 0.56 + cx * 0.38, 3.585, -1.4);
      array.add(cell);
    }
    for (let rz = 0; rz < 8; rz++) {
      const trace = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.02), busbarMat);
      trace.rotation.x = Math.PI / 2;
      trace.position.set(i * 1.72, 3.581, -1.5 + rz * 0.44);
      array.add(trace);
    }
  }
  array.rotation.x = tilt;
  array.position.set(0, 0, z);
  group.add(array);
  return group;
}

scene.add(carportRow(2.6, -0.20));
scene.add(carportRow(-2.6, -0.20));

// Two cars for scale. Rounded, reflective, lit by the canopy — the previous
// boxes were the single biggest reason these read as a placeholder.
function car(x, z, color) {
  const group = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.7,
    roughness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.5, 4.3), paint);
  body.position.y = 0.66;
  body.castShadow = true;
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.22, 4.1), paint);
  skirt.position.y = 0.44;
  skirt.castShadow = true;
  const glass = new THREE.MeshPhysicalMaterial({
    color: "#0a1a24",
    metalness: 0.4,
    roughness: 0.05,
    transmission: 0,
    clearcoat: 1,
  });
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.54, 2.16), glass);
  cabin.position.y = 1.17;
  cabin.castShadow = true;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.06, 1.7), paint);
  roof.position.y = 1.46;
  group.add(body, skirt, cabin, roof);

  // Headlight and taillight strips: the detail that makes it read as a car.
  const head = new THREE.MeshBasicMaterial({ color: "#cfefff" });
  const tail = new THREE.MeshBasicMaterial({ color: PALETTE.amber });
  for (const wz of [2.16, -2.16]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.04), wz > 0 ? head : tail);
    bar.position.set(0, 0.78, wz);
    group.add(bar);
  }

  const tyre = new THREE.MeshStandardMaterial({ color: "#080a0e", roughness: 0.9 });
  const rim = new THREE.MeshBasicMaterial({ color: "#38505f" });
  for (const [wx, wz] of [[-0.95, 1.4], [0.95, 1.4], [-0.95, -1.4], [0.95, -1.4]]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.26, 24), tyre);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.37, wz);
    wheel.castShadow = true;
    group.add(wheel);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.28, 20), rim);
    hub.rotation.z = Math.PI / 2;
    hub.position.set(wx, 0.37, wz);
    group.add(hub);
  }
  group.position.set(x, 0, z);
  return group;
}
scene.add(car(-2.7, 2.6, "#16323f"));
scene.add(car(2.7, -2.6, "#123a30"));

// Particle flow: light travelling from the array down into the ground plane,
// which is the "Solar → BESS → EV" idea from the brand spec.
const FLOW_COUNT = 900;
const flowPositions = new Float32Array(FLOW_COUNT * 3);
const flowSpeed = new Float32Array(FLOW_COUNT);
for (let i = 0; i < FLOW_COUNT; i++) {
  flowPositions[i * 3] = (Math.random() - 0.5) * 13;
  flowPositions[i * 3 + 1] = 3.2 + Math.random() * 4;
  flowPositions[i * 3 + 2] = (Math.random() - 0.5) * 9;
  flowSpeed[i] = 0.4 + Math.random() * 1.1;
}
const flowGeometry = new THREE.BufferGeometry();
flowGeometry.setAttribute("position", new THREE.BufferAttribute(flowPositions, 3));
const flow = new THREE.Points(
  flowGeometry,
  new THREE.PointsMaterial({
    color: new THREE.Color(PALETTE.cyan),
    size: 0.075,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
);
scene.add(flow);

const flowEmerald = new THREE.Points(
  flowGeometry.clone(),
  new THREE.PointsMaterial({
    color: new THREE.Color(PALETTE.emerald),
    size: 0.055,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
);
flowEmerald.position.x = 0.6;
scene.add(flowEmerald);

// A cyan ground glow pool under the array so the particles land somewhere.
const pool = new THREE.Mesh(
  new THREE.PlaneGeometry(15, 11),
  new THREE.MeshBasicMaterial({
    color: new THREE.Color(PALETTE.cyan),
    transparent: true,
    opacity: 0.06,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
);
pool.rotation.x = -Math.PI / 2;
pool.position.y = 0.02;
scene.add(pool);

// The screenshot is a single frame, so step the animation deterministically
// rather than relying on wall-clock time.
let elapsed = 0;
const STEP = 1 / 30;
for (let frame = 0; frame < 30; frame++) {
  elapsed += STEP;
  for (const sys of [flow, flowEmerald]) {
    const attr = sys.geometry.attributes.position;
    const arr = attr.array;
    for (let i = 0; i < FLOW_COUNT; i++) {
      arr[i * 3 + 1] -= flowSpeed[i] * STEP;
      if (arr[i * 3 + 1] < 0.05) arr[i * 3 + 1] = 3.2 + Math.random() * 4;
    }
    attr.needsUpdate = true;
  }
  flow.material.opacity = 0.7 + Math.sin(elapsed * 2.2) * 0.15;
  flowEmerald.material.opacity = 0.45 + Math.sin(elapsed * 2.2 + 1.1) * 0.15;
}
renderer.render(scene, camera);

// Self-check for the pipeline: expose the pixel budget so the orchestrator can
// detect a blank/canvas-less capture without opening the image.
requestAnimationFrame(() => {
  document.body.dataset.renderCheck = `ok:${renderer.info.render.triangles}`;
});
