/**
 * Generates shared/provinceEnergyData.ts from the collected source data.
 *
 * Every number in the generated file carries its own source record, so the page can
 * cite what it publishes and the build can refuse to publish an unsourced figure.
 *
 * Inputs (session scratch):
 *   - province-coords.json : province centroid, from th.wikipedia.org
 *   - pvgis.json           : PVGIS v5.3 output, from European Commission JRC
 */
import fs from "node:fs";
import path from "node:path";

const scratch = process.env.JCODE_SCRATCH_DIR || "/tmp";
const outFile =
  "/Users/sirinx/SIRINXDev/sirinx-co/apps/public-web/shared/provinceEnergyData.ts";

const coords = JSON.parse(fs.readFileSync(path.join(scratch, "province-coords.json"), "utf8"));
const pvgis = JSON.parse(fs.readFileSync(path.join(scratch, "pvgis.json"), "utf8"));

const entries = Object.entries(pvgis)
  .filter(([, v]) => typeof v.irradiationDaily === "number" && typeof v.specificYield === "number")
  .sort(([a], [b]) => a.localeCompare(b));

if (entries.length === 0) throw new Error("No PVGIS records to generate from.");

const header = `/**
 * GENERATED FILE — do not edit by hand.
 * Regenerate with: docs/seo/generate-province-energy-data.mjs
 *
 * Province-level solar resource facts, each with the source it came from.
 *
 * The figures are climate normals for a point at the province centroid, not a
 * site survey and not a savings promise. System loss, tilt, shading and the real
 * load profile all move the outcome, and this file is not allowed to claim they
 * do not.
 *
 * Coverage: ${entries.length} of 77 provinces at generation time. Provinces without
 * a record simply render no solar section, rather than rendering a guess.
 */

export type ProvinceEnergyFact = {
  /** Province centroid used for the lookup, in decimal degrees. */
  lat: number;
  lon: number;
  /** Global horizontal irradiation, kWh/m2/day. */
  irradiationDaily: number;
  /** Specific yield, kWh per kWp per year. Free-standing, 0 degree tilt, 14% system loss. */
  specificYield: number;
  source: {
    name: string;
    url: string;
    database: string;
    yearRange: string;
    retrievedAt: string;
    coordinateSource: string;
  };
};

export const provinceEnergyData: Record<string, ProvinceEnergyFact> = {
`;

const body = entries
  .map(([slug, v]) => {
    const c = coords[slug];
    return `  ${JSON.stringify(slug)}: {
    lat: ${v.lat},
    lon: ${v.lon},
    irradiationDaily: ${v.irradiationDaily},
    specificYield: ${v.specificYield},
    source: {
      name: "PVGIS v5.3, European Commission Joint Research Centre",
      url: "https://re.jrc.ec.europa.eu/pvg_tools/en/tools.html",
      database: ${JSON.stringify(v.radiationDb ?? "PVGIS-ERA5")},
      yearRange: ${JSON.stringify(`${v.yearMin}-${v.yearMax}`)},
      retrievedAt: ${JSON.stringify(v.retrievedAt ?? "")},
      coordinateSource: ${JSON.stringify(
        c ? `th.wikipedia.org article "${c.sourceTitle}"` : "unknown"
      )},
    },
  },`;
  })
  .join("\n");

const footer = `};

export function getProvinceEnergyFact(slug: string): ProvinceEnergyFact | null {
  return provinceEnergyData[slug] ?? null;
}

export const provinceEnergyCoverage = {
  withData: Object.keys(provinceEnergyData).length,
  total: 77,
};
`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, header + body + "\n" + footer, "utf8");
console.log(
  JSON.stringify({ outFile, provinces: entries.length, missing: 77 - entries.length }, null, 2)
);
