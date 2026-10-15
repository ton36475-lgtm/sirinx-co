#!/usr/bin/env node
/**
 * build-from-real-data.mjs — Lane A (PKG-3b) prompt binding script.
 *
 * Generates `prompts-bound-20260928.json` STRICTLY from the repo's real data
 * files. No number in the output is hand-typed:
 *   - yield / irradiation / lat / lon  → parsed from
 *     apps/public-web/shared/provinceEnergyData.ts (the generated PVGIS file)
 *   - sun elevation / azimuth          → imported live from
 *     apps/public-web/shared/sunMath.ts (NOAA math, same code the 3D scenes use)
 *
 * Run (from repo root or anywhere):
 *   node --experimental-strip-types docs/media/prompts/build-from-real-data.mjs
 *
 * This script is READ-ONLY against the repo: it writes only
 * docs/media/prompts/prompts-bound-20260928.json. It never touches
 * client/public/, never calls a provider, never reads env secrets.
 *
 * ── MODEL IDS CORRECTED 2026-09-28 (Lane B, R30-P4) ──────────────────────
 * The ids this file used to emit do not exist any more. Corrected here, in
 * the generator, rather than in the generated JSON, so the next regeneration
 * cannot silently reintroduce them.
 *
 *   dall-e-3               → gpt-image-2
 *     DALL·E 3 was shut down 2026-05-12. It is absent from OpenAI's current
 *     price list, where only gpt-image-2, gpt-image-2.5-sunburst and
 *     gpt-image-2.5-flare are listed. Source: developers.openai.com/api/docs/pricing
 *
 *   gemini-3.8-flash-image → gemini-3.1-flash-image
 *     No such model is published. gemini-3.8-flash is real but is a TEXT model
 *     ($0.75 in / $3.75 out per 1M); the image models are gemini-3.1-flash-image
 *     (Nano Banana 2) and gemini-3.1-flash-lite-image. The old id was the text
 *     model id with "-image" appended, which survives review and fails at the API.
 *     Source: ai.google.dev/gemini-api/docs/pricing
 *
 * Cost ceilings for the three selected slots, and the gate that must be present
 * before --execute will run: docs/media/IMAGE_EXECUTION_READY_20260928.md
 * ──────────────────────────────────────────────────────────────────────────
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { solarPosition } from "../../../apps/public-web/shared/sunMath.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../.."); // docs/media/prompts → repo root
const OUT_PATH = resolve(__dirname, "prompts-bound-20260928.json");

// ── 1. Parse the real PVGIS file ────────────────────────────────────────────
const src = readFileSync(
  resolve(REPO_ROOT, "apps/public-web/shared/provinceEnergyData.ts"),
  "utf8",
);
const entryRe =
  /"([a-z-]+)":\s*\{\s*lat:\s*([\d.]+),\s*lon:\s*([\d.]+),\s*irradiationDaily:\s*([\d.]+),\s*specificYield:\s*([\d.]+)/g;

const provinces = [];
let m;
while ((m = entryRe.exec(src)) !== null) {
  provinces.push({
    slug: m[1],
    lat: Number(m[2]),
    lon: Number(m[3]),
    irradiationDaily: Number(m[4]),
    specificYield: Number(m[5]),
  });
}
if (provinces.length !== 77) {
  console.error(
    `⛔ Expected 77 provinces in provinceEnergyData.ts, parsed ${provinces.length}. Aborting — do not hand-edit the output.`,
  );
  process.exit(1);
}

const byYield = [...provinces].sort((a, b) => b.specificYield - a.specificYield);
const top5 = byYield.slice(0, 5);
const bottom3 = byYield.slice(-3).reverse(); // lowest first in file, show lowest-last style
const yields = provinces.map((p) => p.specificYield);
const mean = yields.reduce((a, b) => a + b, 0) / yields.length;
const stats = {
  count: provinces.length,
  min: Math.min(...yields),
  max: Math.max(...yields),
  mean: Math.round(mean * 100) / 100,
};

// ── 2. Real sun positions via the SAME solarPosition() the 3D scenes use ────
// Reference day: 2026 June solstice (the date ProvinceSolarScene renders).
// Times are local Thailand (UTC+7).
const phuket = top5[0]; // highest specific yield in the sourced dataset
const bangkok = provinces.find((p) => p.slug === "bangkok");
if (!bangkok) {
  console.error("⛔ bangkok record missing — aborting.");
  process.exit(1);
}

const sun = {
  phuketGoldenHour1730: solarPosition(phuket.lat, phuket.lon, new Date("2026-06-21T17:30:00+07:00")),
  phuketNoon1230: solarPosition(phuket.lat, phuket.lon, new Date("2026-06-21T12:30:00+07:00")),
  bangkokGoldenHour1730: solarPosition(bangkok.lat, bangkok.lon, new Date("2026-06-21T17:30:00+07:00")),
};

const fmt = (p) => `${p.elevationDeg}° elevation / ${p.azimuthDeg}° azimuth`;

// ── 3. Data-bound prompts ───────────────────────────────────────────────────
const DISCLAIMER =
  "ภาพแนวคิดสถาปัตยกรรมเพื่อการสาธิตวิศวกรรม — ตัวเลขอ้างอิงค่าปกติสภาพอากาศ PVGIS v5.3 (PVGIS-ERA5, 2005–2023) ไม่ใช่คำสัญญาผลผลิตหรือการประหยัดงบจริงของไซต์ใดไซต์หนึ่ง / Architectural concept visualization; PVGIS climate normals are not a savings promise.";

const DATA_SOURCE_LINE =
  "PVGIS v5.3, European Commission Joint Research Centre (PVGIS-ERA5, 2005–2023), retrieved 2026-09-26, via shared/provinceEnergyData.ts";

const prompts = [
  {
    id: "province-hero-phuket-golden-hour",
    basedOn: "Catalog Concept A (extended, sun-angle bound)",
    route: "/provinces/phuket (hero-adjacent editorial slot)",
    model: "gpt-image-2",
    dimensions: "1792x1024",
    dataBindings: {
      specificYield: phuket.specificYield,
      irradiationDaily: phuket.irradiationDaily,
      lat: phuket.lat,
      lon: phuket.lon,
      sunAt1730Local: sun.phuketGoldenHour1730,
      rank: "1 of 77 by specific yield",
    },
    prompt:
      `An architectural masterpiece photograph of an ultra-modern commercial solar carport in Phuket, Thailand (${phuket.lat}°N, ${phuket.lon}°E). Sleek black bifacial photovoltaic panels on a minimalist dark galvanized steel frame. Late-afternoon tropical sun positioned low at ${fmt(sun.phuketGoldenHour1730)} (June solstice, true NOAA sun position for this latitude), casting long soft shadows toward the west-southwest across polished wet asphalt. Golden hour color temperature, lush tropical foliage contrasting with clean engineering lines, EV charging bays with subtle cyan LED status lights. Shot on medium-format camera, 35mm lens, f/8, photorealistic, editorial architecture magazine style. Palette: obsidian structure, solar amber highlights, restrained cyan accents. --no cartoon, text, watermark, oversaturated colors, fantasy elements.`,
    disclaimer: DISCLAIMER,
  },
  {
    id: "province-noon-phuket-high-sun",
    basedOn: "Catalog Concept A (extended, sun-angle bound)",
    route: "/provinces/phuket (secondary editorial slot)",
    model: "gemini-3.1-flash-image",
    dimensions: "1536x1024",
    dataBindings: {
      sunAt1230Local: sun.phuketNoon1230,
      specificYield: phuket.specificYield,
    },
    prompt:
      `A crisp midday architectural photograph of the same modern commercial solar carport in Phuket, Thailand. Sun nearly overhead at ${fmt(sun.phuketNoon1230)} (June solstice, true NOAA sun position), producing short dense shadows directly beneath the panel array and bright specular highlights on the anti-reflective glass. Cool neutral daylight, high engineering clarity, bifacial panels with visible rear-side light. Photorealistic, clean industrial composition, palette: deep graphite steel, amber solar reflections, minimal cyan. --no cartoon, text, watermark, fisheye distortion.`,
    disclaimer: DISCLAIMER,
  },
  {
    id: "national-yield-telemetry-hologram",
    basedOn: "Catalog Concept B (extended, dataset bound)",
    route: "/strategy (AI/technology hub slot)",
    model: "gemini-3.1-flash-image",
    dimensions: "1536x1024",
    dataBindings: {
      provinceCount: stats.count,
      minYield: { slug: bottom3[0].slug, value: stats.min },
      maxYield: { slug: top5[0].slug, value: stats.max },
      nationalMean: stats.mean,
    },
    prompt:
      `A clean-tech holographic data visualization: a 3D map of Thailand built from ${stats.count} glowing vertical columns, one per province, placed at each province's real latitude and longitude. Column height and color encode specific solar yield in kWh/kWp/year: the tallest column glows solar amber at Phuket in the south (${stats.max} kWh/kWp/yr), the shortest glows dimmer cyan-blue at Trat near the eastern border (${stats.min} kWh/kWp/yr), with a national mean of ${stats.mean}. Matte black environment, thin grid floor, subtle data callouts in Thai typography, cinematic volumetric lighting, depth of field on the tallest column. Matches the visual language of an existing WebGL yield infographic. --no fantasy weapons, clutter, unreadable numbers, watermark.`,
    disclaimer: DISCLAIMER + " ค่าคอลัมน์อ้างอิงชุดข้อมูลจริง: " + DATA_SOURCE_LINE,
  },
  {
    id: "engineering-exploded-structure",
    basedOn: "Catalog Concept C (extended, structural binding from ProvinceSolarScene.tsx)",
    route: "/solar-carport (technical detail slot)",
    model: "gpt-image-2",
    dimensions: "1024x1024",
    dataBindings: {
      structuralLayerSource: "apps/public-web/client/src/components/three/ProvinceSolarScene.tsx (pillars, panel tilt, instanced rows)",
      numericClaims: "none — deliberately number-free",
    },
    prompt:
      `Isometric 3D exploded engineering render of a heavy-duty commercial solar carport system. Floating layers from bottom to top: concrete foundation piles, galvanized C-channel steel columns in warm stone gray, waterproof gutter channel, tilted monocrystalline panel array on a shallow rake with micro-inverters and cable trays. Clean studio lighting on a neutral dark slate background, CAD precision, subtle metallic reflections, Dieter Rams inspired industrial design restraint. Palette: obsidian, stone gray steel, one amber accent line. --no cartoon, text, watermark, clutter.`,
    disclaimer: "Technical diagram representing structural engineering layers; no performance figures are depicted.",
  },
  {
    id: "bess-industrial-storage",
    basedOn: "Catalog Concept D (extended, palette binding)",
    route: "/solutions (BESS & microgrid slot)",
    model: "gemini-3.1-flash-image",
    dimensions: "1792x1024",
    dataBindings: {
      numericClaims: "none — deliberately number-free",
      paletteBinding: "client/src/index.css dark theme (navy surface, cyan primary, amber accent)",
    },
    prompt:
      `State-of-the-art commercial Battery Energy Storage System (BESS) container enclosure beside an industrial solar carport facility. Matte dark titanium casing with active cooling ventilation grilles, vertical amber and cyan LED status indicators, clean underground cable trenches, crisp morning light with sharp architectural shadows. Hyper-realistic industrial product photography. Palette: obsidian navy surfaces, restrained cyan status lighting, amber highlights only at charge indicators. --no cartoon, text, watermark, oversaturated glow.`,
    disclaimer: "Industrial storage layout demonstration; no performance or capacity figures are depicted.",
  },
];

// ── 4. Emit ─────────────────────────────────────────────────────────────────
const manifest = {
  generatedAt: new Date().toISOString(),
  generator: "docs/media/prompts/build-from-real-data.mjs",
  bindingMethod: {
    yieldData: "regex-parsed from apps/public-web/shared/provinceEnergyData.ts (verified 77/77 entries)",
    sunPosition: "live import of solarPosition() from apps/public-web/shared/sunMath.ts (NOAA)",
    referenceDate: "2026-06-21 June solstice, local Thailand time (UTC+7)",
  },
  nationalStats: stats,
  top5ByYield: top5.map((p) => ({ slug: p.slug, specificYield: p.specificYield, irradiationDaily: p.irradiationDaily })),
  bottom3ByYield: byYield.slice(-3).map((p) => ({ slug: p.slug, specificYield: p.specificYield })),
  sunPositions: sun,
  dataSourceLine: DATA_SOURCE_LINE,
  gate: {
    executeMode: "BLOCKED — requires APPROVE_PAID_IMAGE_PROVIDER_CALL",
    dryRunDefault: "docs/media/generate-illustrations.mjs (unchanged, per LANE_ASSIGNMENT R29 §4 Lane A)",
  },
  prompts,
};

writeFileSync(OUT_PATH, JSON.stringify(manifest, null, 2) + "\n");

console.log(`[OK] wrote ${OUT_PATH}`);
console.log(`     provinces parsed : ${stats.count}`);
console.log(`     max yield        : ${top5[0].slug} ${top5[0].specificYield}`);
console.log(`     min yield        : ${bottom3[0].slug} ${stats.min}`);
console.log(`     mean yield       : ${stats.mean}`);
console.log(`     phuket 17:30 sun : ${fmt(sun.phuketGoldenHour1730)}`);
console.log(`     phuket 12:30 sun : ${fmt(sun.phuketNoon1230)}`);
console.log(`     bangkok 17:30 sun: ${fmt(sun.bangkokGoldenHour1730)}`);
console.log(`     prompts emitted  : ${prompts.length}`);
