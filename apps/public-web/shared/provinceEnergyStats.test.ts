/**
 * Invariant tests for province energy statistics — derived purely from the
 * real PVGIS dataset, so assertions use structural invariants (not magic numbers).
 */
import { describe, it, expect } from "vitest";
import {
  yieldRanking,
  nationalYieldStats,
  provinceYieldSummary,
  yieldExtremes,
} from "./provinceEnergyStats";
import { provinceEnergyData } from "./provinceEnergyData";

describe("yieldRanking", () => {
  it("covers every province exactly once with sequential ranks", () => {
    const ranking = yieldRanking();
    expect(ranking).toHaveLength(Object.keys(provinceEnergyData).length);
    expect(ranking.map((r) => r.rank)).toEqual(ranking.map((_, i) => i + 1));
    expect(new Set(ranking.map((r) => r.slug)).size).toBe(ranking.length);
  });

  it("is sorted descending by specific yield", () => {
    const ranking = yieldRanking();
    for (let i = 1; i < ranking.length; i++) {
      expect(ranking[i - 1].specificYield).toBeGreaterThanOrEqual(ranking[i].specificYield);
    }
    expect(ranking[0].rank).toBe(1);
  });
});

describe("nationalYieldStats", () => {
  it("produces coherent min/max/mean/median", () => {
    const s = nationalYieldStats();
    expect(s.count).toBe(77);
    expect(s.mean).toBeGreaterThanOrEqual(s.min);
    expect(s.mean).toBeLessThanOrEqual(s.max);
    expect(s.median).toBeGreaterThanOrEqual(s.min);
    expect(s.median).toBeLessThanOrEqual(s.max);
    expect(provinceEnergyData[s.minSlug].specificYield).toBe(s.min);
    expect(provinceEnergyData[s.maxSlug].specificYield).toBe(s.max);
  });
});

describe("provinceYieldSummary", () => {
  it("returns null for unknown slugs (no guessing)", () => {
    expect(provinceYieldSummary("not-a-province")).toBeNull();
  });

  it("gives every province a coherent rank and percentile", () => {
    for (const slug of Object.keys(provinceEnergyData)) {
      const s = provinceYieldSummary(slug)!;
      expect(s.rank).toBeGreaterThanOrEqual(1);
      expect(s.rank).toBeLessThanOrEqual(s.count);
      expect(s.percentile).toBeGreaterThan(0);
      expect(s.percentile).toBeLessThanOrEqual(100);
      expect(s.vsMeanPct).toBeGreaterThan(-50);
      expect(s.vsMeanPct).toBeLessThan(50);
    }
  });

  it("the top-ranked province has percentile 100", () => {
    const topSlug = yieldRanking()[0].slug;
    expect(provinceYieldSummary(topSlug)!.percentile).toBe(100);
    expect(provinceYieldSummary(topSlug)!.rank).toBe(1);
  });
});

describe("yieldExtremes", () => {
  it("returns top/bottom slices consistent with the ranking", () => {
    const { top, bottom } = yieldExtremes(3);
    const ranking = yieldRanking();
    expect(top.map((t) => t.slug)).toEqual(ranking.slice(0, 3).map((r) => r.slug));
    expect(bottom.map((b) => b.slug)).toEqual(ranking.slice(-3).reverse().map((r) => r.slug));
    expect(top[0].specificYield).toBeGreaterThanOrEqual(bottom[0].specificYield);
  });
});
