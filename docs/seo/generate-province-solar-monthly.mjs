/**
 * Generates shared/provinceSolarMonthly.ts from PVGIS monthly output.
 *
 * Each province gets its 12 monthly global-horizontal-irradiation values plus the
 * national mean, so the province chart is a real data chart rather than an image
 * that was made to look like data.
 */
import fs from "node:fs";
import path from "node:path";

const scratch = process.env.JCODE_SCRATCH_DIR || "/tmp";
const outFile =
  "/Users/sirinx/SIRINXDev/sirinx-co/apps/public-web/shared/provinceSolarMonthly.ts";

const monthly = JSON.parse(
  fs.readFileSync(path.join(scratch, "pvgis-monthly.json"), "utf8")
);

const entries = Object.entries(monthly)
  .filter(([, series]) => Array.isArray(series) && series.length === 12)
  .sort(([a], [b]) => a.localeCompare(b));

if (entries.length === 0) throw new Error("No monthly records to generate from.");

// National mean per month, used as the reference line on every province chart.
const nationalMean = Array.from({ length: 12 }, (_, i) => {
  const sum = entries.reduce((acc, [, series]) => acc + series[i].irradiationDaily, 0);
  return Math.round((sum / entries.length) * 100) / 100;
});

const header = `/**
 * GENERATED FILE — do not edit by hand.
 * Regenerate with: docs/seo/generate-province-solar-monthly.mjs
 *
 * Monthly solar resource per province, used to draw a real chart on each province
 * page. Values are global horizontal irradiation in kWh/m2/day from PVGIS, the same
 * source and database as provinceEnergyData. The national mean is the mean of the
 * ${entries.length} provinces present at generation time, not a published statistic.
 *
 * Coverage: ${entries.length} of 77 provinces.
 */

export type ProvinceSolarMonth = {
  month: number;
  irradiationDaily: number;
};

export const nationalMonthlyMean: readonly number[] = ${JSON.stringify(nationalMean)};

export const provinceSolarMonthly: Record<string, readonly ProvinceSolarMonth[]> = {
`;

const body = entries
  .map(
    ([slug, series]) =>
      `  ${JSON.stringify(slug)}: ${JSON.stringify(
        series.map(m => ({ month: m.month, irradiationDaily: m.irradiationDaily }))
      )},`
  )
  .join("\n");

const footer = `};

export function getProvinceSolarMonthly(
  slug: string
): readonly ProvinceSolarMonth[] | null {
  return provinceSolarMonthly[slug] ?? null;
}

export const provinceSolarMonthlyCoverage = {
  withData: Object.keys(provinceSolarMonthly).length,
  totalProvinces: 77,
};
`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, header + body + "\n" + footer, "utf8");
console.log(
  JSON.stringify(
    {
      outFile,
      provinces: entries.length,
      nationalMeanFirst: nationalMean[0],
      nationalMeanPeakMonth: nationalMean.indexOf(Math.max(...nationalMean)) + 1,
    },
    null,
    2
  )
);
