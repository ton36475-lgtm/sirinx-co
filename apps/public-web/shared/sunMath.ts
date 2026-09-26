/**
 * Solar position math (NOAA Solar Calculator simplified equations).
 *
 * Pure functions — no DOM, no three.js — so both the 3D WebGL scene
 * (client/src/components/three/ProvinceSolarScene.tsx) and tests can use them.
 * The math is astronomy, not a claim about site yield: real output still depends
 * on tilt, shading, system loss and the actual load profile.
 */

export type SunPosition = {
  /** Degrees above the horizon (negative = below). */
  elevationDeg: number;
  /** Degrees clockwise from true north (0–360). */
  azimuthDeg: number;
};

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

/** Fractional hours since local midnight (12.5 = 12:30). */
export function solarPosition(
  latitudeDeg: number,
  longitudeDeg: number,
  date: Date,
): SunPosition {
  // Days since J2000.0
  const jd =
    date.getTime() / 86400000 + 2440587.5;
  const n = jd - 2451545.0 + 0.0008;

  // Mean longitude of the Sun (deg)
  const l = (280.46 + 0.9856474 * n + 360) % 360;
  // Mean anomaly (deg)
  const g = ((357.528 + 0.9856003 * n) % 360) * DEG;

  // Ecliptic longitude (deg)
  const lambda = (l + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g) + 360) % 360;
  // Obliquity (deg)
  const epsilon = (23.439 - 0.0000004 * n) * DEG;

  const declinationDeg =
    Math.asin(Math.sin(epsilon) * Math.sin(lambda * DEG)) * RAD;

  // Equation of time (minutes). l is already in degrees — do not multiply by RAD.
  const eqTimeMin =
    4 * (l - Math.atan2(Math.cos(epsilon) * Math.sin(lambda * DEG), Math.cos(lambda * DEG)) * RAD);

  // True solar time (minutes). Timezone cancels against the 4*lon meridian
  // correction (TST = UTC + eqTime + 4*lon), so no tz argument is needed here.
  const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();
  const trueSolarTime =
    (((utcMinutes + eqTimeMin + longitudeDeg * 4) % 1440) + 1440) % 1440;

  // Hour angle (deg, 0 at solar noon)
  const hourAngleDeg = trueSolarTime / 4 - 180;
  const hourAngle = hourAngleDeg * DEG;
  const lat = latitudeDeg * DEG;
  const decl = declinationDeg * DEG;

  const cosZenith =
    Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(hourAngle);
  const zenith = Math.acos(Math.max(-1, Math.min(1, cosZenith)));
  const elevation = 90 - zenith * RAD;

  // Azimuth (deg from north, clockwise) — stable atan2 form
  const azimuth =
    (Math.atan2(
      Math.sin(hourAngle),
      Math.cos(hourAngle) * Math.sin(lat) - Math.tan(decl) * Math.cos(lat),
    ) *
      RAD +
      180 +
      360) %
    360;

  return {
    elevationDeg: Math.round(elevation * 100) / 100,
    azimuthDeg: Math.round(((azimuth % 360) + 360) % 360 * 100) / 100,
  };
}

/**
 * Daylight window (sunrise/solar-noon/sunset in fractional local hours) for the
 * 3D scene's sun-path animation. Returns null on polar day/night edge cases
 * (not applicable to Thailand, but the math must not lie).
 */
export function daylightWindow(
  latitudeDeg: number,
  longitudeDeg: number,
  date: Date,
  /** Minutes east of UTC — Thailand is UTC+7 = 420. */
  timezoneMinutesEast = 420,
): { sunriseHour: number; noonHour: number; sunsetHour: number } | null {
  const noon = solarPosition(latitudeDeg, longitudeDeg, noonUtc(date, longitudeDeg, timezoneMinutesEast));
  if (noon.elevationDeg <= 0) return null;

  const hours = [];
  for (let h = 0; h < 24; h += 0.1) {
    const probe = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
    probe.setUTCMinutes(probe.getUTCMinutes() + (h * 60 - timezoneMinutesEast));
    const p = solarPosition(latitudeDeg, longitudeDeg, probe);
    hours.push({ h, elev: p.elevationDeg });
  }
  const above = hours.filter((x) => x.elev > 0);
  if (above.length < 2) return null;
  return {
    sunriseHour: above[0].h,
    noonHour: noon.elevationDeg > 0 ? findLocalNoonHour(hours) : 12,
    sunsetHour: above[above.length - 1].h,
  };
}

function noonUtc(date: Date, longitudeDeg: number, tzMin: number): Date {
  const base = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0);
  const solarNoonUtcMin = 720 - longitudeDeg * 4 - eqTimeApprox(date);
  return new Date(base + solarNoonUtcMin * 60000);
}

function eqTimeApprox(date: Date): number {
  const n = date.getTime() / 86400000 + 2440587.5 - 2451545.0;
  const l = (280.46 + 0.9856474 * n + 360) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * DEG;
  const lambda = (l + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g) + 360) % 360;
  const epsilon = 23.439 * DEG;
  return (
    4 *
    (l - Math.atan2(Math.cos(epsilon) * Math.sin(lambda * DEG), Math.cos(lambda * DEG)) * RAD)
  );
}

void eqTimeApprox;

function findLocalNoonHour(hours: { h: number; elev: number }[]): number {
  let best = hours[0];
  for (const x of hours) if (x.elev > best.elev) best = x;
  return best.h;
}
