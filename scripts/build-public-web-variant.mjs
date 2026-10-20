#!/usr/bin/env node
// Produce a host variant of a built public-web bundle.
//
// The public-web build hard-codes `www.sirinx.co` in the canonical link, OG/JSON-LD
// URLs, sitemap, robots.txt and the CSP host list. Deploying that bundle to another
// domain would make every page canonicalize to sirinx.co, i.e. duplicate content.
// This script copies the finished bundle and retargets only those origins.
//
// Usage:
//   node scripts/build-public-web-variant.mjs --origin=https://www.sirinx.org \
//     [--from=apps/public-web/dist/public] [--out=apps/public-web/dist-org]

import { cpSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const arg = (name, fallback) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) || fallback;

const origin = arg("origin");
if (!origin || !/^https:\/\/[a-z0-9.-]+$/.test(origin)) {
  console.error("refused: --origin must be an https origin, e.g. --origin=https://www.sirinx.org");
  process.exit(2);
}

const from = resolve(REPO, arg("from", "apps/public-web/dist/public"));
const out = resolve(REPO, arg("out", "apps/public-web/dist-org"));
const host = new URL(origin).hostname.replace(/^www\./, "");

// Only text surfaces that carry absolute origins. Binary assets are copied byte-for-byte.
const TEXT_EXTENSIONS = new Set([".html", ".js", ".css", ".json", ".xml", ".txt", ".webmanifest", ".map"]);
// Pages control files carry no extension but are plain text (and `_headers` holds the CSP).
const TEXT_FILENAMES = new Set(["_headers", "_redirects"]);
const isText = (file) => {
  const name = file.slice(file.lastIndexOf("/") + 1);
  if (TEXT_FILENAMES.has(name)) return true;
  const dot = name.lastIndexOf(".");
  return dot > 0 && TEXT_EXTENSIONS.has(name.slice(dot));
};
const REWRITES = [
  ["www.sirinx.co", `www.${host}`],
  ["https://sirinx.co", `https://${host}`],
];

function walk(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

rmSync(out, { recursive: true, force: true });
cpSync(from, out, { recursive: true });

let changed = 0;
let scanned = 0;
const touched = [];
for (const file of walk(out)) {
  if (!isText(file) || file.endsWith("variant.json")) continue;
  scanned += 1;
  const before = readFileSync(file, "utf8");
  let after = before;
  for (const [needle, replacement] of REWRITES) after = after.split(needle).join(replacement);
  if (after !== before) {
    writeFileSync(file, after);
    changed += 1;
    touched.push(relative(out, file));
  }
}

const manifestPath = join(out, "variant.json");
writeFileSync(
  manifestPath,
  `${JSON.stringify(
    {
      kind: "public-web-host-variant",
      origin,
      from: relative(REPO, from),
      out: relative(REPO, out),
      rewrites: REWRITES,
      textFilesScanned: scanned,
      textFilesChanged: changed,
      changedFiles: touched,
      generatedAt: new Date().toISOString(),
    },
    null,
    2
  )}\n`
);

const leftovers = [];
for (const file of walk(out)) {
  if (!isText(file) || file.endsWith("variant.json")) continue;
  if (readFileSync(file, "utf8").includes("www.sirinx.co")) leftovers.push(relative(out, file));
}

console.log(
  JSON.stringify(
    { ok: leftovers.length === 0, origin, textFilesScanned: scanned, textFilesChanged: changed, leftovers },
    null,
    2
  )
);
if (leftovers.length > 0) process.exit(1);
