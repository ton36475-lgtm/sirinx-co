import { describe, expect, it } from "vitest";
import {
  decomposeIrradiance,
  dailyEnergyKwh,
  incidenceAngle,
  panelAreaForKwp,
  planeOfArrayIrradiance,
  solarDeclination,
  solarPosition,
} from "../lib/solarGeometry";
import { provinceEnergyData } from "@shared/provinceEnergyData";

const PHITSANULOK_LAT = 16.82;
const SUMMER_SOLSTICE = 172;
const EQUINOX = 80;
const WINTER_SOLSTICE = 355;

describe("solar geometry", () => {
  it("puts declination near zero at the equinoxes", () => {
    expect(Math.abs(solarDeclination(EQUINOX))).toBeLessThan(0.6);
    expect(solarDeclination(SUMMER_SOLSTICE)).toBeCloseTo(23.44, 1);
    expect(solarDeclination(WINTER_SOLSTICE)).toBeCloseTo(-23.44, 1);
  });

  it("lifts the sun nearly overhead in Thailand at the June solstice", () => {
    // 90 - |16.82 - 23.44| = 83.38 degrees.
    const noon = solarPosition(PHITSANULOK_LAT, SUMMER_SOLSTICE, 12);
    expect(noon.elevation).toBeCloseTo(83.38, 1);
  });

  it("keeps the December noon sun lower in Thailand", () => {
    // 90 - |16.82 + 23.44| = 49.74 degrees.
    const noon = solarPosition(PHITSANULOK_LAT, WINTER_SOLSTICE, 12);
    expect(noon.elevation).toBeCloseTo(49.74, 1);
  });

  it("never puts the sun on the horizon at solar noon inside Thailand", () => {
    for (const day of [1, 80, 172, 266, 355]) {
      const noon = solarPosition(16.82, day, 12);
      expect(noon.elevation, `day ${day}`).toBeGreaterThan(40);
      expect(noon.elevation, `day ${day}`).toBeLessThanOrEqual(90);
    }
  });

  it("rises in the east and sets in the west", () => {
    const morning = solarPosition(PHITSANULOK_LAT, EQUINOX, 8);
    const evening = solarPosition(PHITSANULOK_LAT, EQUINOX, 16);
    expect(morning.azimuth).toBeLessThan(180);
    expect(evening.azimuth).toBeGreaterThan(180);
    expect(morning.azimuth).toBeCloseTo(360 - evening.azimuth, 4);
  });

  it("keeps diffuse plus direct consistent with the global input", () => {
    const parts = decomposeIrradiance(800, 60);
    expect(parts.dhi).toBeGreaterThan(0);
    expect(parts.dni).toBeGreaterThan(0);
    const beamHorizontal = parts.dni * Math.sin((60 * Math.PI) / 180);
    expect(parts.dhi + beamHorizontal).toBeCloseTo(parts.ghi, 4);
  });

  it("returns zero beam when the sun is down", () => {
    expect(decomposeIrradiance(800, 0).dni).toBe(0);
    expect(decomposeIrradiance(0, 60).dhi).toBe(0);
  });

  it("gives zero incidence when the sun is perpendicular to a matching surface", () => {
    const sun = { elevation: 90, azimuth: 180 };
    expect(incidenceAngle(sun, 0, 180)).toBeCloseTo(0, 6);
  });

  it("returns no energy at night", () => {
    const sun = { elevation: -10, azimuth: 100 };
    expect(planeOfArrayIrradiance({ ghi: 900, solar: sun, tiltDeg: 15, azimuthDeg: 180 })).toBe(0);
  });

  it("never reports more than the global input times a sane factor", () => {
    const sun = solarPosition(PHITSANULOK_LAT, EQUINOX, 12);
    const poa = planeOfArrayIrradiance({ ghi: 800, solar: sun, tiltDeg: 15, azimuthDeg: 180 });
    expect(poa).toBeGreaterThan(0);
    // A tilt never multiplies the resource; the reflection term is the only uplift.
    expect(poa).toBeLessThan(800 * 1.2);
  });

  it("computes panel area and energy consistently for a real kWp", () => {
    const area = panelAreaForKwp(100);
    expect(area).toBeCloseTo(500, 6);
    expect(dailyEnergyKwh(5, area, 0.2)).toBeCloseTo(500, 6);
    expect(panelAreaForKwp(0)).toBe(0);
    expect(dailyEnergyKwh(5, 0, 0.2)).toBe(0);
  });

  it("runs for every province record the site publishes", () => {
    for (const [slug, fact] of Object.entries(provinceEnergyData)) {
      const noon = solarPosition(fact.lat, SUMMER_SOLSTICE, 12);
      const poa = planeOfArrayIrradiance({
        ghi: fact.irradiationDaily * 1000,
        solar: noon,
        tiltDeg: 12,
        azimuthDeg: 180,
      });
      expect(Number.isFinite(noon.elevation), slug).toBe(true);
      expect(noon.elevation, slug).toBeGreaterThan(0);
      expect(Number.isFinite(poa), slug).toBe(true);
      expect(poa, slug).toBeGreaterThan(0);
    }
  });
});
