#!/usr/bin/env node
/**
 * Live SEO acceptance check for www.sirinx.co.
 *
 * Every number in the competitive SWOT came from measuring the deployed site,
 * not from reading code. This re-runs those same measurements so the effect of
 * a deploy can be verified instead of assumed.
 *
 *   node scripts/audit-live-seo.mjs              # measure
 *   node scripts/audit-live-seo.mjs --baseline   # also write a baseline file
 *   node scripts/audit-live-seo.mjs --compare    # fail if worse than baseline
 *
 * Exits non-zero when a metric regresses, so it can gate a release.
 */
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const BASE = process.env.SIRINX_AUDIT_BASE || "https://www.sirinx.co";
const BASELINE_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "docs",
  "seo-live-baseline.json"
);
const args = new Set(process.argv.slice(2));
// Comparing only makes sense against a recorded baseline; writing one is an
// explicit act so a stray run cannot silently overwrite the record.
const writeBaseline = args.has("--baseline");
const compare = args.has("--compare");

const get = (path) => fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(20000) }).then((r) => r.text());
const count = (html, re) => (html.match(re) || []).length;

console.log(`กำลังตรวจ ${BASE}\n`);

const sitemap = await get("/sitemap.xml");
const allUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
// Sitemap <loc> values are absolute production URLs. Rewrite them onto the
// host actually being measured, otherwise pointing this at a local build
// would silently sample production instead.
const toBase = (absolute) => {
  const path = new URL(absolute).pathname;
  return `${BASE}${path}`;
};
const provinceUrls = allUrls
  .filter((u) => /\/solar-carport\/[a-z]/.test(u) && !/\/solar-carport\/$/.test(u))
  .map(toBase);

// Commercial routes must be readable without JavaScript.
const COMMERCIAL = ["/pricing/", "/projects/", "/assessment/", "/solar-carport/"];
const commercial = {};
for (const route of COMMERCIAL) {
  const html = await get(route);
  const body = (html.match(/<body[^>]*>([\s\S]*)<\/body>/i) ?? [])[1] ?? "";
  const text = body
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  commercial[route] = { h1: count(html, /<h1[\s>]/gi), visibleText: text.length };
}

const home = await get("/");
const homeProvinceLinks = new Set(
  [...home.matchAll(/href="(\/solar-carport\/[a-z][^"#?]*)"/g)].map((m) => m[1])
).size;

const hub = await get("/provinces/");
const hubH2 = count(hub, /<h2[\s>]/gi);

const feedStatus = (await fetch(`${BASE}/feed.xml`, { signal: AbortSignal.timeout(15000) })).status;

// Sample province pages for funnel links and description length.
const sample = provinceUrls.filter((_, i) => i % 8 === 0).slice(0, 10);
let funnelOk = 0;
let descOver = 0;
let descMax = 0;
for (const url of sample) {
  const html = await fetch(url, { signal: AbortSignal.timeout(15000) }).then((r) => r.text());
  if (html.includes('href="/pricing/"') && html.includes('href="/projects/"') && html.includes('href="/assessment/"')) {
    funnelOk += 1;
  }
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) ?? [])[1] ?? "";
  descMax = Math.max(descMax, desc.length);
  if (desc.length > 160) descOver += 1;
}

const metrics = {
  provinceCount: provinceUrls.length,
  homepageProvinceLinks: homeProvinceLinks,
  provincesHubH2: hubH2,
  commercialRoutesWithH1: Object.values(commercial).filter((c) => c.h1 >= 1).length,
  commercialRoutesWithText: Object.values(commercial).filter((c) => c.visibleText > 80).length,
  sampledPages: sample.length,
  sampledWithFunnelLinks: funnelOk,
  sampledDescriptionOver160: descOver,
  longestDescription: descMax,
  feedStatus,
};

console.log("=== ผลวัด ===");
for (const [key, value] of Object.entries(metrics)) {
  console.log(`  ${key}: ${value}`);
}
console.log("\n=== รายละเอียดหน้าเชิงพาณิชย์ ===");
for (const [route, c] of Object.entries(commercial)) {
  console.log(`  ${route} H1=${c.h1} visibleText=${c.visibleText}`);
}

if (writeBaseline) {
  writeFileSync(BASELINE_PATH, `${JSON.stringify(metrics, null, 2)}\n`, "utf8");
  console.log(`\nเขียน baseline ที่ ${BASELINE_PATH}`);
}

if (compare) {
  if (!existsSync(BASELINE_PATH)) {
    console.log("\nยังไม่มี baseline — รันด้วย --baseline ก่อน");
    process.exit(1);
  }
  const baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
  // Higher is better for reach, text and links; lower is better for errors.
  const HIGHER_BETTER = new Set([
    "homepageProvinceLinks",
    "provincesHubH2",
    "commercialRoutesWithH1",
    "commercialRoutesWithText",
    "sampledWithFunnelLinks",
  ]);
  const regressions = [];
  for (const [key, value] of Object.entries(metrics)) {
    if (typeof value !== "number") continue;
    const before = baseline[key];
    if (typeof before !== "number") continue;
    const worse = HIGHER_BETTER.has(key) ? value < before : value > before;
    if (worse) regressions.push(`${key}: ${before} -> ${value}`);
  }
  if (regressions.length) {
    console.log(`\nถดถอย ${regressions.length} รายการ:`);
    for (const line of regressions) console.log(`  ${line}`);
    process.exit(1);
  }
  console.log("\nไม่มีรายการใดถดถอยจาก baseline");
}
