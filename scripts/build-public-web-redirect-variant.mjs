#!/usr/bin/env node
/**
 * Build the redirect-only variant for the secondary host.
 *
 * Decision (2026-10-30): www.sirinx.co is the canonical marketing host.
 * www.sirinx.org serves the same documents with its own canonicals, which makes
 * the two hosts compete as duplicate content. This bundle replaces the full
 * copy with a permanent redirect to the primary host, so the .org host stops
 * earning separate index entries while every old URL keeps working.
 *
 * The full .org bundle is left untouched (`dist-org`) as the rollback target
 * until the redirect is actually deployed.
 *
 *   node scripts/build-public-web-redirect-variant.mjs \
 *     --origin=https://www.sirinx.org --target=https://www.sirinx.co \
 *     --out=apps/public-web/dist-org-redirect
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const arg = (name, fallback) =>
  args.find(value => value.startsWith(`--${name}=`))?.slice(name.length + 3) || fallback;

const origin = arg("origin");
const target = arg("target", "https://www.sirinx.co");
const outArg = arg("out", "apps/public-web/dist-org-redirect");

for (const [flagName, value] of [
  ["origin", origin],
  ["target", target],
]) {
  if (!value || !/^https:\/\/[a-z0-9.-]+$/.test(value)) {
    console.error(`refused: --${flagName} must be an https origin, e.g. https://www.sirinx.org`);
    process.exit(2);
  }
}
if (origin === target) {
  console.error("refused: --origin and --target are the same host; that would redirect to itself");
  process.exit(2);
}

const out = resolve(REPO, outArg);
const targetHost = new URL(target).host;

// Cloudflare Pages applies the first matching rule. The splat keeps the path,
// so /solar-carport/bangkok/ lands on the same path on the primary host.
const redirects = [
  `# ${new URL(origin).host} -> ${targetHost} (permanent)`,
  `/* ${target}/:splat 301`,
  "",
].join("\n");

// Fallback for hosts that ignore _redirects (and for a human opening the file).
const indexHtml = `<!doctype html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <meta name="robots" content="noindex, follow" />
    <link rel="canonical" href="${target}/" />
    <meta http-equiv="refresh" content="0; url=${target}/" />
    <title>ย้ายเว็บไซต์ไปที่ ${targetHost}</title>
  </head>
  <body>
    <p>เว็บไซต์นี้ย้ายไปที่ <a href="${target}/">${targetHost}</a> แล้ว</p>
  </body>
</html>
`;

const notFound = `<!doctype html>
<html lang="th">
  <head><meta charset="utf-8" /><meta name="robots" content="noindex" /><title>404</title></head>
  <body><p>ไม่พบหน้านี้ — ไปที่ <a href="${target}/">${targetHost}</a></p></body>
</html>
`;

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, "_redirects"), redirects);
writeFileSync(resolve(out, "index.html"), indexHtml);
writeFileSync(resolve(out, "404.html"), notFound);
writeFileSync(
  resolve(out, "variant.json"),
  `${JSON.stringify(
    {
      kind: "public-web-redirect-variant",
      origin,
      target,
      rule: `/* ${target}/:splat 301`,
      deployed: false,
      rollback: "apps/public-web/dist-org",
      generatedAt: new Date().toISOString(),
    },
    null,
    2
  )}\n`
);

console.log(
  JSON.stringify(
    { ok: true, out: outArg, origin, target, files: ["_redirects", "index.html", "404.html", "variant.json"] },
    null,
    2
  )
);
