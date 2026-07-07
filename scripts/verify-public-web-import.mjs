#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const DEFAULT_TARGET = "apps/public-web";
const REQUIRED_PATHS = [
  "package.json",
  "pnpm-lock.yaml",
  "vite.config.ts",
  "tsconfig.json",
  "components.json",
  "client/index.html",
  "client/src/App.tsx",
  "client/src/main.tsx",
  "client/src/index.css",
  "client/src/pages/Home.tsx",
  "client/src/pages/SolarCarport.tsx",
  "client/src/components/Layout.tsx",
  "client/src/components/HeroSlideshow.tsx",
  "client/src/components/RouteSeo.tsx",
  "client/src/lib/seo.ts",
  "client/src/i18n/pages/home.ts",
  "client/src/i18n/pages/solarCarport.ts",
  "client/public/manifest.json",
  "client/public/favicon.svg",
  "client/public/assets/optimized/solar-carport-hero.jpg",
  "server/_core/index.ts",
  "server/staticSeoBuild.ts",
  "shared",
  "brands/sirinx/config.ts",
];

const REQUIRED_HERO_STRINGS = [
  "Solar Carport",
  "เปลี่ยนที่จอดรถ",
  "เป็นโรงไฟฟ้าพลังงานแสงอาทิตย์",
  "ขอใบเสนอราคา Solar Carport",
  "ดูผลงานจริง",
];

function parseArgs(argv) {
  const args = { target: process.env.SIRINX_PUBLIC_WEB_TARGET || DEFAULT_TARGET };
  for (const item of argv) {
    if (item.startsWith("--target=")) args.target = item.slice("--target=".length);
    else throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function assertExists(targetRoot, relativePath, failures) {
  const filePath = path.join(targetRoot, relativePath);
  if (!fs.existsSync(filePath)) failures.push(`missing: ${relativePath}`);
}

function assertFileContains(filePath, checks, failures) {
  if (!fs.existsSync(filePath)) {
    failures.push(`missing: ${path.relative(process.cwd(), filePath)}`);
    return;
  }
  const content = fs.readFileSync(filePath, "utf-8");
  for (const check of checks) {
    if (!content.includes(check)) failures.push(`missing string in ${path.relative(process.cwd(), filePath)}: ${check}`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const rootDir = process.cwd();
  const targetRoot = path.resolve(rootDir, args.target);
  const failures = [];

  for (const relativePath of REQUIRED_PATHS) {
    assertExists(targetRoot, relativePath, failures);
  }

  assertFileContains(path.join(targetRoot, "client/src/components/HeroSlideshow.tsx"), REQUIRED_HERO_STRINGS, failures);
  assertFileContains(path.join(targetRoot, "client/src/App.tsx"), ["isInternalHost", "dev.sirinx.co", "function PublicRouter", "component={PublicRouter}"], failures);
  assertFileContains(path.join(targetRoot, "client/src/lib/seo.ts"), ["https://www.sirinx.co", "Solar Carport"], failures);
  assertFileContains(path.join(targetRoot, "brands/sirinx/config.ts"), ["id: \"sirinx\"", "Solar Carport", "lineUrl"], failures);

  const rootPackagePath = path.join(rootDir, "package.json");
  assertFileContains(rootPackagePath, ["restore:public-web", "verify:public-web-import", "web:build"], failures);

  if (failures.length > 0) {
    console.error("SIRINX public web import verification failed:");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log("SIRINX public web import verification passed");
  console.log(`target: ${args.target}`);
  console.log("next validation: pnpm --dir apps/public-web install --ignore-scripts");
  console.log("next validation: pnpm --config.verify-deps-before-run=false --dir apps/public-web check");
  console.log("next validation: pnpm --config.verify-deps-before-run=false --dir apps/public-web build");
}

try {
  main();
} catch (error) {
  console.error(`verification failed: ${error.message}`);
  process.exit(1);
}
