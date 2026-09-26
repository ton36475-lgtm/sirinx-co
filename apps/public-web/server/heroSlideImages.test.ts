/**
 * Quality gate for the hero slideshow images.
 *
 * The slides render AVIF/JPEG srcSets from client/public/assets/optimized/, so
 * every referenced file must exist in the committed tree or the homepage ships
 * broken hero frames. The slides must also stay 16:9 — a portrait master in a
 * full-bleed hero is what made the first slide a blurry LCP before this fix.
 *
 * Red proof: removing any generated asset turns the asset gate red (mutation
 * run recorded in the report).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const APP_ROOT = new URL("../", import.meta.url).pathname;
const COMPONENT = join(
  APP_ROOT,
  "client/src/components/HeroSlideshow.tsx",
);
const source = readFileSync(COMPONENT, "utf8");

describe("hero slideshow images", () => {
  it("every slide carries an AVIF/JPEG imageSet", () => {
    const avifSets = source.match(/avifSrcSet:/g) ?? [];
    const jpgSets = source.match(/jpgSrcSet:/g) ?? [];
    expect(avifSets.length).toBeGreaterThanOrEqual(5);
    expect(jpgSets.length).toBeGreaterThanOrEqual(5);
    expect(source).toContain('sizes: "100vw"');
  });

  it("all slides are 16:9 landscape (no portrait masters in the hero)", () => {
    const dims = [...source.matchAll(/width: (\d+),\s*\n\s*height: (\d+)/g)];
    expect(dims.length).toBeGreaterThanOrEqual(5);
    for (const [, w, h] of dims) {
      expect(Number(w) / Number(h), `${w}x${h}`).toBeCloseTo(16 / 9, 1);
    }
  });

  it("every optimized asset referenced by the slides exists on disk", () => {
    const referenced = new Set(
      [...source.matchAll(/\/assets\/optimized\/hero-[a-z0-9-]+\.(?:avif|jpg)/g)].map(
        (m) => m[0],
      ),
    );
    expect(referenced.size).toBeGreaterThanOrEqual(30);
    for (const asset of referenced) {
      expect(
        existsSync(join(APP_ROOT, "client/public", asset)),
        asset,
      ).toBe(true);
    }
  });
});
