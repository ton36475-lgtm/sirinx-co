/**
 * Generates province hero images (WebP + AVIF) for the long-form pages.
 *
 * Pipeline (no external services, no API keys):
 *   1. esbuild bundles docs/seo/province-image-render/scene.mjs (vanilla three.js
 *      + shared PVGIS records + sunMath) into a single classic script.
 *   2. Headless Chrome loads render-page.html?slug=… and screenshots the WebGL
 *      scene together with the DOM data overlay (real Thai fonts).
 *   3. cwebp encodes the WebP, ffmpeg (libsvtav1) encodes the AVIF.
 *
 * Idempotent: existing outputs are skipped unless FORCE=1 is set, so a partial
 * run can simply be resumed.
 *
 * Run:  cd apps/public-web && npx tsx ../../docs/seo/generate-province-images.mjs [slug]
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const repo = "/Users/sirinx/SIRINXDev/sirinx-co";
const app = `${repo}/apps/public-web`;
const toolDir = `${repo}/docs/seo/province-image-render`;
const outDir = `${app}/client/public/provinces`;
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sirinx-provinces-"));

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ESBUILD = `${app}/node_modules/.bin/esbuild`;
const FORCE = process.env.FORCE === "1";
const only = process.argv[2] ?? null;

const { thaiProvinces } = await import(`${app}/shared/thaiProvinces.ts`);

function run(bin, args, extraEnv = {}) {
  const result = spawnSync(bin, args, {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    env: { ...process.env, ...extraEnv },
  });
  if (result.status !== 0) {
    throw new Error(
      `${bin} failed (${result.status}):\n${result.stderr?.slice(0, 800)}`,
    );
  }
  return result.stdout ?? "";
}

// 1. Bundle the scene ------------------------------------------------------
run(ESBUILD, [
  path.join(toolDir, "scene.mjs"),
  "--bundle",
  "--format=iife",
  `--outfile=${path.join(toolDir, "scene.bundle.js")}`,
  "--loader:.ts=ts",
  "--log-level=warning",
], { NODE_PATH: `${app}/node_modules` });

fs.mkdirSync(outDir, { recursive: true });

// 2. Screenshot + encode per province --------------------------------------
const provinces = only
  ? thaiProvinces.filter((p) => p.slug === only)
  : thaiProvinces;

const summary = { generated: 0, skipped: 0, slugs: [] };

for (const province of provinces) {
  const webpPath = path.join(outDir, `${province.slug}.webp`);
  const avifPath = path.join(outDir, `${province.slug}.avif`);
  if (!FORCE && fs.existsSync(webpPath) && fs.existsSync(avifPath)) {
    summary.skipped += 1;
    continue;
  }

  const pngPath = path.join(tmpDir, `${province.slug}.png`);
  run(CHROME, [
    "--headless=new",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--hide-scrollbars",
    "--force-device-scale-factor=2",
    "--window-size=1200,675",
    "--run-all-compositor-stages-before-draw",
    "--virtual-time-budget=9000",
    `--screenshot=${pngPath}`,
    `file://${path.join(toolDir, "render-page.html")}?slug=${province.slug}`,
  ]);

  const pngSize = fs.statSync(pngPath).size;
  if (pngSize < 30_000) {
    throw new Error(
      `${province.slug}: screenshot looks blank (${pngSize} bytes)`,
    );
  }

  run("cwebp", ["-q", "82", "-resize", "1200", "675", pngPath, "-o", webpPath]);
  run("ffmpeg", [
    "-y", "-loglevel", "error", "-i", pngPath,
    "-vf", "scale=1200:675",
    "-c:v", "libsvtav1", "-crf", "36", "-preset", "5",
    "-pix_fmt", "yuv420p", "-f", "avif", avifPath,
  ]);

  summary.generated += 1;
  summary.slugs.push(province.slug);
  process.stdout.write(
    `ok ${province.slug} (png ${(pngSize / 1024) | 0}KB → webp ${(fs.statSync(webpPath).size / 1024) | 0}KB, avif ${(fs.statSync(avifPath).size / 1024) | 0}KB)\n`,
  );
}

console.log(JSON.stringify({ outFile: outDir, ...summary }, null, 2));
