/**
 * Solar geometry used by the 3D viewer.
 *
 * Deliberately pure functions with no Three.js or DOM dependency, so the numbers
 * that the viewer displays can be unit tested instead of eyeballed.
 *
 * The inputs are the same PVGIS figures already published on each province page,
 * so the 3D view and the written figures can never disagree.
 */

export type SolarPosition = {
  /** Degrees above the horizon. Negative means the sun is down. */
  elevation: number;
  /** Degrees clockwise from north. */
  azimuth: number;
};

export type IrradianceParts = {
  /** Direct normal irradiance, W/m2. */
  dni: number;
  /** Diffuse horizontal irradiance, W/m2. */
  dhi: number;
  /** Global horizontal irradiance, W/m2. */
  ghi: number;
};

/** Solar declination in degrees for a day of the year. */
export function solarDeclination(dayOfYear: number): number {
  return 23.44 * Math.sin(((2 * Math.PI) / 365) * (dayOfYear - 81));
}

/**
 * Sun elevation and azimuth for a latitude, day and local solar time.
 * `solarTime` is decimal hours, 12 being solar noon.
 */
export function solarPosition(
  latitude: number,
  dayOfYear: number,
  solarTime: number
): SolarPosition {
  const lat = (latitude * Math.PI) / 180;
  const decl = (solarDeclination(dayOfYear) * Math.PI) / 180;
  const hourAngle = ((solarTime - 12) * 15 * Math.PI) / 180;

  const sinElevation =
    Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(hourAngle);
  const elevation = Math.asin(Math.max(-1, Math.min(1, sinElevation)));

  const cosAzimuth =
    (Math.sin(decl) - Math.sin(elevation) * Math.sin(lat)) /
    Math.max(1e-9, Math.cos(elevation) * Math.cos(lat));
  const azimuth = Math.acos(Math.max(-1, Math.min(1, cosAzimuth)));

  // Before solar noon the sun is in the east, so mirror the azimuth.
  const mirrored = solarTime <= 12 ? azimuth : 2 * Math.PI - azimuth;

  return {
    elevation: (elevation * 180) / Math.PI,
    azimuth: (mirrored * 180) / Math.PI,
  };
}

/**
 * Split global horizontal irradiance into direct and diffuse using the Erbs
 * correlation. Needed because PVGIS publishes GHI, while plane-of-array
 * irradiance needs the direct beam.
 */
export function decomposeIrradiance(
  ghi: number,
  solarElevationDeg: number
): IrradianceParts {
  if (ghi <= 0 || solarElevationDeg <= 0) {
    return { ghi: Math.max(0, ghi), dni: 0, dhi: Math.max(0, ghi) };
  }
  const kt = ghi / (1000 * Math.max(0.05, Math.sin((solarElevationDeg * Math.PI) / 180)));
  const clamped = Math.max(0, Math.min(1, kt));

  // Erbs diffuse fraction.
  let diffuseFraction: number;
  if (clamped <= 0.22) {
    diffuseFraction = 1 - 0.09 * clamped;
  } else if (clamped <= 0.8) {
    diffuseFraction =
      0.9511 -
      0.1604 * clamped +
      4.388 * clamped * clamped -
      16.638 * clamped ** 3 +
      12.336 * clamped ** 4;
  } else {
    diffuseFraction = 0.165;
  }

  const dhi = ghi * diffuseFraction;
  const beamHorizontal = Math.max(0, ghi - dhi);
  const dni = beamHorizontal / Math.max(0.05, Math.sin((solarElevationDeg * Math.PI) / 180));

  return { ghi, dhi, dni: Math.max(0, dni) };
}

/** Angle between the sun beam and a tilted surface, in degrees. */
export function incidenceAngle(
  sun: SolarPosition,
  surfaceTiltDeg: number,
  surfaceAzimuthDeg: number
): number {
  const tilt = (surfaceTiltDeg * Math.PI) / 180;
  const sunZenith = (90 - sun.elevation) * (Math.PI / 180);
  const azimuthDelta = (sun.azimuth - surfaceAzimuthDeg) * (Math.PI / 180);

  const cosIncidence =
    Math.cos(sunZenith) * Math.cos(tilt) +
    Math.sin(sunZenith) * Math.sin(tilt) * Math.cos(azimuthDelta);

  return (Math.acos(Math.max(-1, Math.min(1, cosIncidence))) * 180) / Math.PI;
}

/**
 * Plane-of-array irradiance for a tilted, south-facing surface.
 * `tilt` is degrees from horizontal, `azimuth` degrees clockwise from north.
 */
export function planeOfArrayIrradiance(options: {
  ghi: number;
  solar: SolarPosition;
  tiltDeg: number;
  azimuthDeg: number;
  albedo?: number;
}): number {
  const { ghi, solar, tiltDeg, azimuthDeg, albedo = 0.2 } = options;
  // No sun means no irradiance, whatever GHI the caller passed. Without this the
  // diffuse term would keep producing light on a surface at night.
  if (ghi <= 0 || solar.elevation <= 0) return 0;

  const parts = decomposeIrradiance(ghi, solar.elevation);
  const incidence = incidenceAngle(solar, tiltDeg, azimuthDeg);

  const tilt = (tiltDeg * Math.PI) / 180;

  // Direct beam on the tilted plane.
  const beam = parts.dni * Math.cos((incidence * Math.PI) / 180);
  // Sky diffuse, isotropic sky.
  const skyDiffuse = parts.dhi * ((1 + Math.cos(tilt)) / 2);
  // Ground reflected.
  const ground = ghi * albedo * ((1 - Math.cos(tilt)) / 2);

  return Math.max(0, beam + skyDiffuse + ground);
}

/** Daily energy in kWh for a system, given POA irradiance in kWh/m2/day. */
export function dailyEnergyKwh(
  poaKwhPerM2: number,
  areaM2: number,
  systemEfficiency: number
): number {
  return Math.max(0, poaKwhPerM2 * areaM2 * systemEfficiency);
}

/** Panel area in square metres for a given kWp at a module power density. */
export function panelAreaForKwp(kwp: number, wattsPerSquareMetre = 200): number {
  if (kwp <= 0) return 0;
  return (kwp * 1000) / wattsPerSquareMetre;
}
