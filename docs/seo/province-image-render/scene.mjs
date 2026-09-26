/**
 * Province image scene — vanilla three.js render used ONLY by the offline
 * screenshot pipeline (docs/seo/generate-province-images.mjs).
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
renderer.outputColorSpace = THREE.SRGBColorSpace;
canvasHost.appendChild(renderer.domElement);

const scene = new THREE.Scene();

// Sky gradient — warm near the sun, deep blue overhead.
const skyCanvas = document.createElement("canvas");
skyCanvas.width = 2;
skyCanvas.height = 512;
const skyCtx = skyCanvas.getContext("2d");
const gradient = skyCtx.createLinearGradient(0, 0, 0, 512);
gradient.addColorStop(0, "#12243f");
gradient.addColorStop(0.55, "#3e6ba8");
gradient.addColorStop(0.82, "#d99a55");
gradient.addColorStop(1, "#f0c283");
skyCtx.fillStyle = gradient;
skyCtx.fillRect(0, 0, 2, 512);
scene.background = new THREE.CanvasTexture(skyCanvas);

const camera = new THREE.PerspectiveCamera(40, 1200 / 675, 0.1, 300);
camera.position.set(11, 6.2, 15);
camera.lookAt(0, 1.8, 0);

// Sun from real position: azimuth around south, elevation on the sky dome.
const sunAz = THREE.MathUtils.degToRad(THREE.MathUtils.clamp(sun.azimuthDeg, 90, 270));
const sunEl = THREE.MathUtils.degToRad(Math.max(sun.elevationDeg, 8));
const sunDir = new THREE.Vector3(
  Math.sin(sunAz - Math.PI) * Math.cos(sunEl),
  Math.sin(sunEl),
  -Math.cos(sunAz - Math.PI) * Math.cos(sunEl),
).normalize();

const sunMesh = new THREE.Mesh(
  new THREE.SphereGeometry(1.6, 32, 32),
  new THREE.MeshBasicMaterial({ color: "#fff3c4" }),
);
sunMesh.position.copy(sunDir).multiplyScalar(70);
scene.add(sunMesh);
const glow = new THREE.Mesh(
  new THREE.SphereGeometry(3.4, 32, 32),
  new THREE.MeshBasicMaterial({ color: "#ffd98a", transparent: true, opacity: 0.35 }),
);
glow.position.copy(sunMesh.position);
scene.add(glow);

const sunLight = new THREE.DirectionalLight("#ffe6bd", 2.6);
sunLight.position.copy(sunDir).multiplyScalar(30);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.left = -22;
sunLight.shadow.camera.right = 22;
sunLight.shadow.camera.top = 22;
sunLight.shadow.camera.bottom = -22;
scene.add(sunLight);
scene.add(new THREE.HemisphereLight("#9dc4ff", "#2b2f3a", 0.85));

// Ground + parking stalls.
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(160, 160),
  new THREE.MeshStandardMaterial({ color: "#22262e", roughness: 0.95 }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const stallMat = new THREE.MeshStandardMaterial({ color: "#8f97a6", roughness: 0.8 });
for (let row = 0; row < 2; row++) {
  for (let i = -3; i <= 3; i++) {
    const stall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 5.2), stallMat);
    stall.position.set(i * 2.7, 0.011, row === 0 ? 2.6 : -2.6);
    scene.add(stall);
  }
}

// Solar carport rows: posts, beams, tilted PV panels.
const panelMat = new THREE.MeshStandardMaterial({
  color: "#16294a",
  metalness: 0.55,
  roughness: 0.3,
});
const frameMat = new THREE.MeshStandardMaterial({ color: "#dfe4ee", metalness: 0.2, roughness: 0.5 });

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
  }
  array.rotation.x = tilt;
  array.position.set(0, 0, z);
  group.add(array);
  return group;
}

scene.add(carportRow(2.6, -0.20));
scene.add(carportRow(-2.6, -0.20));

// Two low-poly cars under the carport for scale.
function car(x, z, color) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.62, 4.3), new THREE.MeshStandardMaterial({ color, metalness: 0.45, roughness: 0.42 }));
  body.position.y = 0.62;
  body.castShadow = true;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.56, 2.2), new THREE.MeshStandardMaterial({ color: "#223047", metalness: 0.2, roughness: 0.35 }));
  cabin.position.y = 1.16;
  cabin.castShadow = true;
  group.add(body, cabin);
  for (const [wx, wz] of [[-0.95, 1.4], [0.95, 1.4], [-0.95, -1.4], [0.95, -1.4]]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.24, 20), new THREE.MeshStandardMaterial({ color: "#111318", roughness: 0.85 }));
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.36, wz);
    group.add(wheel);
  }
  group.position.set(x, 0, z);
  return group;
}
scene.add(car(-2.7, 2.6, "#2d3a55"));
scene.add(car(2.7, -2.6, "#5b2f2f"));

renderer.render(scene, camera);

// Self-check for the pipeline: expose the pixel budget so the orchestrator can
// detect a blank/canvas-less capture without opening the image.
requestAnimationFrame(() => {
  document.body.dataset.renderCheck = `ok:${renderer.info.render.triangles}`;
});
