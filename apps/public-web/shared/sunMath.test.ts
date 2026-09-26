/**
 * Tests for the solar-position math behind the 3D province scene.
 * Assertions use astronomy invariants (not site-yield claims).
 */
import { describe, it, expect } from "vitest";
import { solarPosition, daylightWindow } from "./sunMath";

const BKK = { lat: 13.7525, lon: 100.4942 };
const PHUKET = { lat: 7.88, lon: 98.39 };

describe("solarPosition", () => {
  it("is high at solar noon in Bangkok (tropical latitude)", () => {
    const noonLocal = new Date(Date.UTC(2026, 2, 20, 5, 0)); // ~12:00 ICT at equinox
    const p = solarPosition(BKK.lat, BKK.lon, noonLocal);
    expect(p.elevationDeg).toBeGreaterThan(60);
    expect(p.elevationDeg).toBeLessThan(90);
  });

  it("is below the horizon at local midnight", () => {
    const midnightLocal = new Date(Date.UTC(2026, 2, 20, 17, 0)); // ~00:00 ICT
    const p = solarPosition(BKK.lat, BKK.lon, midnightLocal);
    expect(p.elevationDeg).toBeLessThan(0);
  });

  it("keeps azimuth within [0, 360)", () => {
    for (let h = 0; h < 24; h++) {
      const d = new Date(Date.UTC(2026, 5, 21, h, 30));
      const p = solarPosition(BKK.lat, BKK.lon, d);
      expect(p.azimuthDeg).toBeGreaterThanOrEqual(0);
      expect(p.azimuthDeg).toBeLessThan(360);
    }
  });

  it("rises in the east-ish and sets in the west-ish", () => {
    const window = daylightWindow(BKK.lat, BKK.lon, new Date(Date.UTC(2026, 5, 21)));
    expect(window).not.toBeNull();
    const early = solarPosition(BKK.lat, BKK.lon, new Date(Date.UTC(2026, 5, 21, 1, 30)));
    const late = solarPosition(BKK.lat, BKK.lon, new Date(Date.UTC(2026, 5, 21, 11, 30)));
    expect(early.azimuthDeg).toBeLessThan(180);
    expect(late.azimuthDeg).toBeGreaterThan(180);
  });

  it("June solstice noon sun sits in the northern sky for Phuket (lat < 23.44)", () => {
    const noonLocal = new Date(Date.UTC(2026, 5, 21, 5, 0));
    const p = solarPosition(PHUKET.lat, PHUKET.lon, noonLocal);
    // Zenith distance = |lat - decl| ≈ 15.6°, so elevation ≈ 74°+ at solar noon.
    expect(p.elevationDeg).toBeGreaterThan(70);
    // North of the zenith: azimuth must be in the northern half of the sky.
    expect(p.azimuthDeg < 60 || p.azimuthDeg > 300).toBe(true);
  });
});

describe("daylightWindow", () => {
  it("returns a plausible tropical day (roughly 11–13 hours of daylight)", () => {
    const w = daylightWindow(BKK.lat, BKK.lon, new Date(Date.UTC(2026, 2, 20)));
    expect(w).not.toBeNull();
    expect(w!.sunsetHour - w!.sunriseHour).toBeGreaterThan(10.5);
    expect(w!.sunsetHour - w!.sunriseHour).toBeLessThan(13.5);
    expect(w!.noonHour).toBeGreaterThan(11);
    expect(w!.noonHour).toBeLessThan(13);
  });
});
