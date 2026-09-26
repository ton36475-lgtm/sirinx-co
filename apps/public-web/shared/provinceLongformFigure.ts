/**
 * buildProvinceMonthlyFigure — province-specific hero image figure (WebP/AVIF).
 *
 * The same string is rendered by the prerender HTML (shared/provinceLongformHtml)
 * and the hydrated long-form component, so the static document and the rendered
 * DOM always show the identical figure — no crawler/user divergence.
 *
 * The images themselves are rendered offline from the same PVGIS records the
 * prose quotes (docs/seo/generate-province-images.mjs): a three.js scene with the
 * province's real sun position plus a data overlay, encoded to AVIF + WebP in
 * client/public/provinces/. The alt text and caption carry the same figures in
 * text form, so answer engines and screen readers get the numbers without
 * reading pixels, and the caption keeps the climate-normals disclaimer: the
 * image is a render for comparison, not a savings promise.
 */
import { provinceEnergyData } from "./provinceEnergyData";
import { provinceSolarMonthly } from "./provinceSolarMonthly";
import { thaiProvinces } from "./thaiProvinces";

export function escapeFigureText(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function formatNumber(value: number, fractionDigits: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

/** Rank of the province by specific yield among all provinces with data (1 = highest). */
export function provinceYieldRank(slug: string): number | null {
  const ranked = Object.entries(provinceEnergyData)
    .map(([key, value]) => ({ slug: key, specificYield: value.specificYield }))
    .sort((a, b) => b.specificYield - a.specificYield);
  const index = ranked.findIndex((entry) => entry.slug === slug);
  return index === -1 ? null : index + 1;
}

/**
 * Returns the figure HTML for a province, or null when the province has no
 * PVGIS record (the page renders no figure rather than a guess).
 */
export function buildProvinceMonthlyFigure(slug: string): string | null {
  const energy = provinceEnergyData[slug];
  const months = provinceSolarMonthly[slug];
  const province = thaiProvinces.find((item) => item.slug === slug);
  if (!energy || !months || !province || months.length !== 12) return null;

  const name = escapeFigureText(province.nameTh);
  const rank = provinceYieldRank(slug);
  const values = months.map((month) => month.irradiationDaily);
  const peakIndex = values.indexOf(Math.max(...values));

  const sourceLine = escapeFigureText(
    `ภาพจำลอง 3 มิติจากข้อมูล PVGIS v5.3 (PVGIS-ERA5, 2005–2023) ณ จุดศูนย์กลาง${province.nameTh} — ค่าปกติทางภูมิอากาศ เปรียบเทียบระหว่างพื้นที่ได้ ไม่ใช่ผลสำรวจหน้างาน และไม่ใช่การรับประกันผลผลิตของระบบจริง`,
  );

  // The numbers live in the alt text too, so crawlers and screen readers get
  // the same figures the image shows without reading pixels.
  const alt = escapeFigureText(
    `ภาพจำลอง Solar Carport ใน${province.nameTh} พร้อมข้อมูล PVGIS: ผลผลิตเฉพาะระบบ ${formatNumber(energy.specificYield, 1)} kWh/kWp/ปี` +
      (rank ? ` อันดับ ${rank} จาก 77 จังหวัด` : "") +
      ` รังสีเฉลี่ย ${formatNumber(energy.irradiationDaily, 2)} kWh/m²/วัน เดือนที่ผลิตได้สูงสุด ${values[peakIndex]} kWh/m²/วัน`,
  );

  return `<figure class="mt-10" data-sirinx-figure="province-monthly">
        <picture>
          <source type="image/avif" srcset="/provinces/${slug}.avif" />
          <source type="image/webp" srcset="/provinces/${slug}.webp" />
          <img src="/provinces/${slug}.webp" alt="${alt}" width="1200" height="675" loading="lazy" decoding="async" class="w-full h-auto rounded-2xl" />
        </picture>
        <figcaption class="mt-3 text-xs leading-relaxed text-text-secondary">${sourceLine}</figcaption>
      </figure>`;
}
