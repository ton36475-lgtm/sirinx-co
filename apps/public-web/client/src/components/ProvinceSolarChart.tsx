/**
 * Province solar chart.
 *
 * Draws the province's own monthly solar numbers against the national mean. It is
 * an SVG rendered from data, not a generated picture, so it cannot drift from the
 * source and it carries real information a stock photo would not.
 */
import {
  getProvinceSolarMonthly,
  nationalMonthlyMean,
  type ProvinceSolarMonth,
} from "@shared/provinceSolarMonthly";

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

const WIDTH = 640;
const HEIGHT = 190;
const PAD_LEFT = 34;
const PAD_RIGHT = 10;
const PAD_TOP = 12;
const PAD_BOTTOM = 26;

export default function ProvinceSolarChart({
  slug,
  provinceNameTh,
  provinceNameEn,
  caption,
  referenceCaption,
  ariaLabel,
}: {
  slug: string;
  provinceNameTh: string;
  provinceNameEn: string;
  caption: string;
  referenceCaption: string;
  ariaLabel: string;
}) {
  const series: readonly ProvinceSolarMonth[] | null =
    getProvinceSolarMonthly(slug);
  if (!series || series.length !== 12) return null;

  const values = series.map(m => m.irradiationDaily);
  const all = [...values, ...nationalMonthlyMean];
  const max = Math.ceil(Math.max(...all) * 10) / 10;
  const min = Math.floor(Math.min(...all) * 10) / 10;
  const span = Math.max(max - min, 0.1);
  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const slot = plotW / 12;
  const barW = Math.max(slot * 0.56, 6);

  const x = (i: number) => PAD_LEFT + slot * i + (slot - barW) / 2;
  const y = (v: number) => PAD_TOP + plotH - ((v - min) / span) * plotH;
  const h = (v: number) => PAD_TOP + plotH - y(v);

  const refPoints = nationalMonthlyMean
    .map((v, i) => `${PAD_LEFT + slot * i + slot / 2},${y(v)}`)
    .join(" ");

  const peak = values.indexOf(Math.max(...values));
  const total = values.reduce((a, b) => a + b, 0);

  return (
    <figure className="mt-6" data-sirinx-solar-chart={slug}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label={`${ariaLabel}: ${provinceNameTh} (${provinceNameEn})`}
        preserveAspectRatio="xMidYMid meet"
      >
        <title>{`${ariaLabel} — ${provinceNameTh}`}</title>
        <desc>
          {`${provinceNameTh}: ${values.map((v, i) => `${MONTH_LABELS_TH[i]} ${v}`).join(", ")} kWh/m²/วัน; เฉลี่ยทั้งประเทศ ${(total / 12).toFixed(2)} kWh/m²/วัน`}
        </desc>

        {[0, 0.5, 1].map(f => {
          const v = min + span * f;
          return (
            <g key={f}>
              <line
                x1={PAD_LEFT}
                x2={WIDTH - PAD_RIGHT}
                y1={y(v)}
                y2={y(v)}
                stroke="currentColor"
                strokeOpacity={0.12}
                strokeWidth={1}
              />
              <text
                x={PAD_LEFT - 6}
                y={y(v) + 3}
                textAnchor="end"
                fontSize={9}
                fill="currentColor"
                fillOpacity={0.5}
              >
                {v.toFixed(1)}
              </text>
            </g>
          );
        })}

        {series.map((m, i) => (
          <rect
            key={m.month}
            x={x(i)}
            y={y(m.irradiationDaily)}
            width={barW}
            height={h(m.irradiationDaily)}
            rx={2}
            fill="currentColor"
            fillOpacity={i === peak ? 0.9 : 0.42}
          >
            <title>{`${MONTH_LABELS_TH[i]}: ${m.irradiationDaily} kWh/m²/วัน`}</title>
          </rect>
        ))}

        <polyline
          points={refPoints}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.75}
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />

        {series.map((m, i) => (
          <text
            key={`m${m.month}`}
            x={PAD_LEFT + slot * i + slot / 2}
            y={HEIGHT - 8}
            textAnchor="middle"
            fontSize={9}
            fill="currentColor"
            fillOpacity={0.55}
          >
            {MONTH_LABELS_TH[i]}
          </text>
        ))}
      </svg>

      <figcaption className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-text-muted">
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-sm bg-accent-primary/80"
          />
          {provinceNameTh} · {(total / 12).toFixed(2)} kWh/m²/วัน
        </span>
        <span className="inline-flex items-center gap-2">
          <svg aria-hidden="true" width="18" height="4" viewBox="0 0 18 4">
            <line
              x1="0"
              y1="2"
              x2="18"
              y2="2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
          </svg>
          {referenceCaption}
        </span>
        <span>{caption}</span>
      </figcaption>
    </figure>
  );
}
