/**
 * Quality gate for shared/provinceLongformFigure.ts — the province-specific
 * SVG figure shared by the prerender HTML and the hydrated long-form component.
 *
 * Red proof (verification discipline): the 12-month bar-count assertion goes
 * red when the builder is mutated to drop a month (mutation run recorded in the
 * report), and the "อันดับ 15 จาก 77" assertion is a tripwire shared with the
 * hand-written Bangkok content — if the PVGIS dataset is regenerated and the
 * rank moves, both the test and the published claim must be revisited together.
 */
import { describe, expect, it } from "vitest";
import {
  buildProvinceMonthlyFigure,
  escapeFigureText,
  provinceYieldRank,
} from "./provinceLongformFigure";
import { buildProvinceLongformHtml } from "./provinceLongformHtml";

describe("provinceLongformFigure", () => {
  it("renders the bangkok figure with sourced figures and rank", () => {
    const figure = buildProvinceMonthlyFigure("bangkok");
    expect(figure).toBeTruthy();
    expect(figure!).toContain("กรุงเทพ");
    expect(figure!).toContain("1,401.4");
    expect(figure!).toContain("อันดับ 15 จาก 77 จังหวัด");
    expect(figure!).toContain("PVGIS");
    expect(figure!).toContain("ไม่ใช่การรับประกันผลผลิตของระบบจริง");
    expect(figure!).toContain('role="img"');
    expect(figure!).toContain("aria-label=");
  });

  it("draws exactly 12 monthly bars with Thai month labels and a national-mean line", () => {
    for (const slug of ["bangkok", "phuket", "amnat-charoen"]) {
      const figure = buildProvinceMonthlyFigure(slug)!;
      const bars = figure.match(/data-month=/g) ?? [];
      expect(bars, `${slug} bar count`).toHaveLength(12);
      expect(figure).toContain(">ม.ค.<");
      expect(figure).toContain(">ธ.ค.<");
      expect(figure).toContain("ค่าเฉลี่ยประเทศ");
      expect(figure).toContain("เดือนที่ผลิตได้สูงสุด");
    }
  });

  it("returns null for provinces without a PVGIS record", () => {
    expect(buildProvinceMonthlyFigure("nonexistent-province")).toBeNull();
  });

  it("escapes text before embedding it in SVG/HTML", () => {
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
    expect(html!).toContain("<figcaption");
    // Figure sits after the intro paragraphs and before the first section.
    const figureAt = html!.indexOf('data-sirinx-figure="province-monthly"');
    const sectionAt = html!.indexOf("<h2");
    expect(figureAt).toBeGreaterThan(0);
    expect(figureAt).toBeLessThan(sectionAt);
  });
});
