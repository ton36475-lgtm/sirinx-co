/**
 * buildProvinceMonthlyFigure — province-specific solar resource figure (inline SVG).
 *
 * The same string is rendered by the prerender HTML (shared/provinceLongformHtml)
 * and the hydrated long-form component, so the static document and the rendered
 * DOM always show the identical figure — no crawler/user divergence.
 *
 * Every figure value comes from the PVGIS-backed records in
 * shared/provinceEnergyData.ts and shared/provinceSolarMonthly.ts. The figure
 * carries the same climate-normals disclaimer as the prose: it is a comparison
 * chart, not a savings promise.
 *
 * Styling uses the site's CSS custom properties (index.css) with fallbacks, so
 * the figure follows the light/dark theme in the hydrated page and degrades to a
 * readable static graphic in the prerendered HTML.
 */
import { provinceEnergyData } from "./provinceEnergyData";
import {
  nationalMonthlyMean,
  provinceSolarMonthly,
} from "./provinceSolarMonthly";
import { thaiProvinces } from "./thaiProvinces";

const MONTH_LABELS_TH = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

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
  const maxValue = Math.max(...values, ...nationalMonthlyMean);
  const peakIndex = values.indexOf(Math.max(...values));
  const lowIndex = values.indexOf(Math.min(...values));

  // Chart geometry (viewBox 720 x 420).
  const chartLeft = 52;
  const chartRight = 700;
  const chartTop = 176;
  const chartBottom = 336;
  const chartHeight = chartBottom - chartTop;
  const slot = (chartRight - chartLeft) / 12;
  const barWidth = slot * 0.56;
  const yFor = (value: number) =>
    chartBottom - (value / maxValue) * chartHeight * 0.92;

  const bars = values
    .map((value, index) => {
      const x = chartLeft + index * slot + (slot - barWidth) / 2;
      const y = yFor(value);
      const isPeak = index === peakIndex;
      const isLow = index === lowIndex;
      const fill = isPeak
        ? "var(--accent-primary, #d97706)"
        : "var(--text-secondary, #6b7280)";
      const label = isPeak || isLow
        ? `        <text x="${x + barWidth / 2}" y="${y - 8}" text-anchor="middle" font-size="13" font-weight="600" fill="var(--foreground, #111827)">${formatNumber(value, 2)}</text>\n`
        : "";
      return `        <rect data-month="${index + 1}" x="${x}" y="${y}" width="${barWidth}" height="${chartBottom - y}" rx="4" fill="${fill}"${isPeak ? ' opacity="1"' : ' opacity="0.72"'} />\n${label}        <text x="${x + barWidth / 2}" y="${chartBottom + 22}" text-anchor="middle" font-size="12" fill="var(--text-secondary, #6b7280)">${MONTH_LABELS_TH[index]}</text>`;
    })
    .join("\n");

  const meanPoints = nationalMonthlyMean
    .map((value, index) => {
      const x = chartLeft + index * slot + slot / 2;
      return `${x},${yFor(value)}`;
    })
    .join(" ");

  const sourceLine = escapeFigureText(
    `ที่มา: PVGIS v5.3 (PVGIS-ERA5, 2005–2023) ณ จุดศูนย์กลาง${province.nameTh} — ค่าปกติทางภูมิอากาศ เปรียบเทียบระหว่างพื้นที่ได้ ไม่ใช่ผลสำรวจหน้างาน และไม่ใช่การรับประกันผลผลิตของระบบจริง`,
  );

  const ariaLabel = escapeFigureText(
    `แผนภูมิรังสีดวงอาทิตย์รายเดือนของ${province.nameTh}: เฉลี่ย ${energy.irradiationDaily} kWh/m²/วัน ผลผลิตเฉพาะระบบ ${energy.specificYield} kWh/kWp/ปี` +
      (rank ? ` อันดับ ${rank} จาก 77 จังหวัด` : ""),
  );

  return `<figure class="mt-10" data-sirinx-figure="province-monthly">
        <svg viewBox="0 0 720 420" role="img" aria-label="${ariaLabel}" style="width:100%;height:auto">
          <text x="52" y="44" font-size="22" font-weight="700" fill="var(--foreground, #111827)">ศักยภาพพลังงานแสงอาทิตย์รายเดือน — ${name}</text>
          <text x="52" y="88" font-size="34" font-weight="700" fill="var(--accent-primary, #d97706)">${formatNumber(energy.specificYield, 1)}</text>
          <text x="52" y="112" font-size="14" fill="var(--text-secondary, #6b7280)">kWh/kWp/ปี (ระบบอิสระ มุมเอียง 0° สมมติการสูญเสียระบบ 14%)</text>
          <text x="700" y="88" text-anchor="end" font-size="16" font-weight="600" fill="var(--foreground, #111827)">${rank ? `อันดับ ${rank} จาก 77 จังหวัด` : ""}</text>
          <text x="700" y="112" text-anchor="end" font-size="14" fill="var(--text-secondary, #6b7280)">รังสีเฉลี่ย ${formatNumber(energy.irradiationDaily, 2)} kWh/m²/วัน</text>
          <line x1="${chartLeft}" y1="${chartBottom}" x2="${chartRight}" y2="${chartBottom}" stroke="var(--border-subtle, #e5e7eb)" stroke-width="1" />
          <polyline points="${meanPoints}" fill="none" stroke="var(--text-secondary, #6b7280)" stroke-width="1.5" stroke-dasharray="5 5" opacity="0.7" />
          <text x="${chartRight}" y="${yFor(nationalMonthlyMean[11]) - 8}" text-anchor="end" font-size="11" fill="var(--text-secondary, #6b7280)">ค่าเฉลี่ยประเทศ</text>
${bars}
          <text x="${chartLeft}" y="${chartBottom + 48}" font-size="12" fill="var(--text-secondary, #6b7280)">เดือนที่ผลิตได้สูงสุด: ${MONTH_LABELS_TH[peakIndex]} · ต่ำสุด: ${MONTH_LABELS_TH[lowIndex]}</text>
        </svg>
        <figcaption class="mt-3 text-xs leading-relaxed text-text-secondary">${sourceLine}</figcaption>
      </figure>`;
}
