import { describe, expect, it } from "vitest";
import {
  getProvinceEnergyFact,
  provinceEnergyCoverage,
  provinceEnergyData,
} from "@shared/provinceEnergyData";
import { thaiProvinces } from "@shared/thaiProvinces";

const slugs = new Set(thaiProvinces.map(p => p.slug));

describe("province energy data", () => {
  it("only contains provinces that exist in the registry", () => {
    for (const slug of Object.keys(provinceEnergyData)) {
      expect(slugs.has(slug)).toBe(true);
    }
  });

  it("cites a source for every published figure", () => {
    for (const [slug, fact] of Object.entries(provinceEnergyData)) {
      expect(fact.source.name, slug).toMatch(/PVGIS/i);
      expect(fact.source.url, slug).toMatch(/^https:\/\//);
      expect(fact.source.database, slug).toBeTruthy();
      expect(fact.source.yearRange, slug).toMatch(/^\d{4}-\d{4}$/);
      expect(fact.source.retrievedAt, slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(fact.source.coordinateSource, slug).toBeTruthy();
    }
  });

  it("keeps values inside the range a Thai province can plausibly reach", () => {
    for (const [slug, fact] of Object.entries(provinceEnergyData)) {
      // Global horizontal irradiation in Thailand sits roughly between 4.0 and 6.0 kWh/m2/day.
      expect(fact.irradiationDaily, slug).toBeGreaterThan(4.0);
      expect(fact.irradiationDaily, slug).toBeLessThan(6.0);
      // Specific yield for a free-standing, 0 degree, 14% loss system.
      expect(fact.specificYield, slug).toBeGreaterThan(1000);
      expect(fact.specificYield, slug).toBeLessThan(1900);
      expect(fact.lat, slug).toBeGreaterThan(5.5);
      expect(fact.lat, slug).toBeLessThan(20.5);
      expect(fact.lon, slug).toBeGreaterThan(97.2);
      expect(fact.lon, slug).toBeLessThan(105.7);
    }
  });

  it("returns null rather than a guess for a province with no record", () => {
    expect(getProvinceEnergyFact("not-a-province")).toBeNull();
  });

  it("reports coverage so the page can show partial data honestly", () => {
    expect(provinceEnergyCoverage.total).toBe(77);
    expect(provinceEnergyCoverage.withData).toBe(Object.keys(provinceEnergyData).length);
    expect(provinceEnergyCoverage.withData).toBeGreaterThan(0);
  });

  it("gives provinces measurably different numbers, not one copied value", () => {
    const values = Object.values(provinceEnergyData).map(f => f.irradiationDaily);
    expect(new Set(values).size).toBeGreaterThan(1);
  });
});
