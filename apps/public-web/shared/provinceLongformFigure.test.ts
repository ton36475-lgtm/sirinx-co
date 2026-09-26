/**
 * Quality gate for shared/provinceLongformFigure.ts — the province hero image
 * figure (AVIF/WebP) shared by the prerender HTML and the hydrated long-form
 * component — and for the image assets the pipeline produced.
 *
 * Red proof (verification discipline):
 *  - renaming any province asset makes the asset-coverage gate red (mutation
 *    run recorded in the report)
 *  - the "อันดับ 15 จาก 77" assertion is a tripwire shared with the hand-written
 *    Bangkok content: if the PVGIS dataset is regenerated and the rank moves,
 *    both the test and the published claim must be revisited together.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildProvinceMonthlyFigure,
  escapeFigureText,
  provinceYieldRank,
} from "./provinceLongformFigure";
import { buildProvinceLongformHtml } from "./provinceLongformHtml";
import { provinceEnergyData } from "./provinceEnergyData";

const ASSET_DIR = new URL("../client/public/provinces/", import.meta.url)
  .pathname;

describe("provinceLongformFigure", () => {
  it("renders the bangkok figure as lazy AVIF/WebP with sourced alt text", () => {
    const figure = buildProvinceMonthlyFigure("bangkok");
    expect(figure).toBeTruthy();
    expect(figure!).toContain('data-sirinx-figure="province-monthly"');
    expect(figure!).toContain('<source type="image/avif" srcset="/provinces/bangkok.avif"');
    expect(figure!).toContain('<source type="image/webp" srcset="/provinces/bangkok.webp"');
    expect(figure!).toContain('src="/provinces/bangkok.webp"');
    expect(figure!).toContain('loading="lazy"');
    expect(figure!).toContain('decoding="async"');
    expect(figure!).toContain('width="1200"');
    expect(figure!).toContain('height="675"');
    // Numbers must be readable without decoding pixels.
    expect(figure!).toContain("กรุงเทพ");
    expect(figure!).toContain("1,401.4");
    expect(figure!).toContain("อันดับ 15 จาก 77 จังหวัด");
    expect(figure!).toContain("PVGIS");
    expect(figure!).toContain("ไม่ใช่การรับประกันผลผลิตของระบบจริง");
    expect(figure!).toContain("<figcaption");
  });

  it("has a WebP and an AVIF asset for every province with a PVGIS record", () => {
    const slugs = Object.keys(provinceEnergyData);
    expect(slugs.length).toBe(77);
    for (const slug of slugs) {
      expect(existsSync(join(ASSET_DIR, `${slug}.webp`)), `${slug}.webp`).toBe(true);
      expect(existsSync(join(ASSET_DIR, `${slug}.avif`)), `${slug}.avif`).toBe(true);
    }
  });

  it("returns null for provinces without a PVGIS record", () => {
    expect(buildProvinceMonthlyFigure("nonexistent-province")).toBeNull();
  });

  it("escapes text before embedding it in attributes", () => {
    expect(escapeFigureText('<script>alert("x")</script>')).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
  });

  it("computes the yield rank from the PVGIS dataset", () => {
    expect(provinceYieldRank("bangkok")).toBe(15);
    expect(provinceYieldRank("phuket")).toBe(1);
    expect(provinceYieldRank("trat")).toBe(77);
    expect(provinceYieldRank("nonexistent-province")).toBeNull();
  });

  it("embeds the figure in the prerender HTML next to the intro", () => {
    const html = buildProvinceLongformHtml("phuket");
    expect(html).toBeTruthy();
    expect(html!).toContain('data-sirinx-figure="province-monthly"');
    expect(html!).toContain("/provinces/phuket.avif");
    expect(html!).toContain('loading="lazy"');
    // Figure sits after the intro paragraphs and before the first section.
    const figureAt = html!.indexOf('data-sirinx-figure="province-monthly"');
    const sectionAt = html!.indexOf("<h2");
    expect(figureAt).toBeGreaterThan(0);
    expect(figureAt).toBeLessThan(sectionAt);
  });
});
