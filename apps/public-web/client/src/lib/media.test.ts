// @vitest-environment node
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { LEGACY_MEDIA, hasLegacyMedia, media, mediaAbsolute } from "./media";

const PUBLIC_DIR = fileURLToPath(new URL("../../public/", import.meta.url));
const SRC_DIR = fileURLToPath(new URL("../", import.meta.url));

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

describe("legacy media registry", () => {
  it("maps every legacy name to a file that ships with the site", () => {
    const entries = Object.entries(LEGACY_MEDIA);
    expect(entries.length).toBeGreaterThan(30);
    for (const [legacy, local] of entries) {
      expect(local.startsWith("/"), `${legacy} → ${local}`).toBe(true);
      expect(
        existsSync(join(PUBLIC_DIR, local.replace(/^\//, ""))),
        `${legacy} → ${local} is missing on disk`
      ).toBe(true);
    }
  });

  it("never maps two legacy video/brochure downloads onto a photo", () => {
    // The brochure previews/originals and the marketing video had no local
    // replacement, so their section was withdrawn instead of faked.
    for (const name of Object.keys(LEGACY_MEDIA)) {
      expect(name).not.toMatch(/^brochure_/);
      expect(name.endsWith(".mp4")).toBe(false);
    }
  });

  it("falls back to a real local photo for unknown names", () => {
    const fallback = media("some-file-that-never-existed.webp");
    expect(fallback).toBe("/assets/optimized/solar-carport-hero-1280.jpg");
    expect(existsSync(join(PUBLIC_DIR, fallback.replace(/^\//, "")))).toBe(true);
    expect(hasLegacyMedia("some-file-that-never-existed.webp")).toBe(false);
  });

  it("builds absolute URLs for social cards on the production origin", () => {
    const absolute = mediaAbsolute("sirinx-og-image-hbNko5JADXArPGo26hmGrN.png");
    expect(absolute).toBe(
      "https://www.sirinx.co/assets/optimized/sirinx-og-card-1200x630.jpg"
    );
    // The variant builder rewrites this origin for sirinx.org.
    expect(absolute.startsWith("https://www.sirinx.co/")).toBe(true);
  });

  it("leaves no reference to the retired CloudFront origin in the client source", () => {
    const offenders = walk(SRC_DIR).filter((file) => {
      // media.ts is the registry itself; its doc comment names the origin on
      // purpose. No other module may reference it.
      if (!/\.(ts|tsx)$/.test(file) || file.endsWith("media.test.ts")) return false;
      if (file.endsWith("lib/media.ts")) return false;
      return readFileSync(file, "utf8").includes("d2xsxph8kpxj0f.cloudfront.net");
    });
    expect(offenders).toEqual([]);
  });

  it("resolves the paths that pages import from", () => {
    expect(media("hero-main-bCzCTCeaup46mVvtEbpjnr.webp")).toBe(
      "/assets/optimized/solar-carport-hero-1280.jpg"
    );
    expect(media("photo_2026-03-24_06-45-58_293d121c.jpg")).toBe(
      "/assets/optimized/sirinx-logo.jpg"
    );
    expect(media("pricing-size-l-GYVfyzmEzDPhxpNp3PPD6K.webp")).toBe(
      "/assets/optimized/solar-carport-hero-1280.jpg"
    );
  });

  it("keeps the gallery on real SIRINX installation photos", () => {
    for (const name of [
      "carport-wide-1_30e3af4c.jpeg",
      "bess-cabinet-2_54c824b8.jpeg",
      "install-team-1_91970553.jpeg",
    ]) {
      expect(LEGACY_MEDIA[name]).toMatch(/^\/assets\/projects\//);
    }
  });
});
