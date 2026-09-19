import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { cfImage, cfImageSrcSet, createCfImageHelpers } from "../client/src/lib/cfImage.ts";
import { inspectPagesBuild } from "./pages-preflight.mjs";

const source = "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/carport-wide-1_30e3af4c.jpeg";
const enabled = createCfImageHelpers(true);
const disabled = createCfImageHelpers(false);

test("transformation is off by default outside a configured Vite build", () => {
  assert.equal(cfImage(source, 960), source);
  assert.equal(cfImageSrcSet(source), undefined);
});
test("disabled policy keeps both src and srcset on the original path", () => {
  assert.equal(disabled.cfImage(source, 960), source);
  assert.equal(disabled.cfImageSrcSet(source), undefined);
});
test("enabled policy generates the expected Cloudflare URL", () => {
  assert.equal(enabled.cfImage(source, 960, { quality: 76 }),
    `https://www.sirinx.co/cdn-cgi/image/width=960,quality=76,format=auto,fit=scale-down/${source}`);
});
test("rejects lookalike paths, other hosts, credentials and relative sources", () => {
  for (const value of [source.replace("DfaBNh7LYBahFVi2JKfAUv/", "DfaBNh7LYBahFVi2JKfAUv-evil/"),
    source.replace(".net/", ".net.evil.example/"), source.replace("https://", "https://user:password@"),
    "/assets/local.jpg", "not a url", source.replace("https:", "http:")]) {
    assert.equal(enabled.cfImage(value, 960), value);
    assert.equal(enabled.cfImageSrcSet(value), undefined);
  }
});
test("invalid widths retain the original and quality stays bounded", () => {
  for (const width of [NaN, Infinity, -1, 0]) assert.equal(enabled.cfImage(source, width), source);
  assert.match(enabled.cfImage(source, 1e9, { quality: 200 }), /width=8192,quality=100/);
  assert.match(enabled.cfImage(source, 640, { quality: NaN }), /quality=74/);
});
test("srcset descriptors match unique normalized widths", () => {
  const result = enabled.cfImageSrcSet(source, [640.4, 320, 640, NaN, -1]);
  assert.equal(result, `${enabled.cfImage(source, 320)} 320w, ${enabled.cfImage(source, 640)} 640w`);
  assert.equal(enabled.cfImageSrcSet(source, []), undefined);
});

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sirinx-pages-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const names = ["index.html", "contact/index.html", "projects/index.html", "solar-carport/index.html",
    "_headers", "robots.txt", "sitemap.xml", "assets/app.js"];
  for (const width of [640, 960, 1280]) for (const ext of ["avif", "jpg"]) {
    names.push(`assets/optimized/solar-carport-hero-${width}.${ext}`,
      `assets/home-solution/home-solution-drone-hero-${width}.${ext}`);
  }
  for (const name of names) {
    const target = path.join(root, name); fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, name.endsWith(".html") ? '<script src="/assets/app.js"></script>' : "fixture");
  }
  return root;
}
test("preflight accepts a complete static fixture", t => {
  assert.equal(inspectPagesBuild(fixture(t)).ok, true);
});
test("preflight rejects missing image and missing referenced JS", t => {
  const root = fixture(t);
  fs.unlinkSync(path.join(root, "assets/optimized/solar-carport-hero-960.jpg"));
  fs.unlinkSync(path.join(root, "assets/app.js"));
  const result = inspectPagesBuild(root);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => error.includes("solar-carport-hero-960.jpg")));
  assert.ok(result.errors.some(error => error.includes("Missing referenced asset")));
});
test("preflight rejects an active catch-all but ignores comments", t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, "_redirects"), "# /* /index.html 200\n");
  assert.equal(inspectPagesBuild(root).ok, true);
  fs.appendFileSync(path.join(root, "_redirects"), "/* /index.html 200\n");
  assert.equal(inspectPagesBuild(root).ok, false);
});
test("preflight rejects server artifacts, secrets and incompatible fallback", t => {
  const root = fixture(t);
  for (const name of ["index.js", ".env.local", "404.html"]) fs.writeFileSync(path.join(root, name), "fixture");
  const result = inspectPagesBuild(root);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => error.includes(".env.local")));
  assert.ok(result.errors.some(error => error.includes("index.js")));
  assert.ok(result.errors.some(error => error.includes("404.html")));
});
test("preflight reports a missing output directory", () => {
  assert.equal(inspectPagesBuild(path.join(os.tmpdir(), "sirinx-does-not-exist-20260919")).ok, false);
});
