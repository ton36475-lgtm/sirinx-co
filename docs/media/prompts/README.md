# docs/media/prompts/ — Data-Bound Illustration Prompts (PKG-3b, Lane A)

Status: LOCAL_ONLY · 2026-09-28 · Gate consumed: **none**
Owner per `docs/media/LANE_ASSIGNMENT_20260928.md` §2: **Lane A (freebuff)**

## What is here

| File | Purpose |
| --- | --- |
| `build-from-real-data.mjs` | Generator: parses `apps/public-web/shared/provinceEnergyData.ts` (77/77 provinces verified) and imports `solarPosition()` live from `apps/public-web/shared/sunMath.ts`, then emits `prompts-bound-20260928.json`. Read-only against the repo. |
| `prompts-bound-20260928.json` | Generated manifest: national stats, top5/bottom3 by real yield, real sun positions, and 5 data-bound prompts each with `dataBindings` + disclaimer. **Do not hand-edit numbers — regenerate.** |

Run:

```bash
node --experimental-strip-types docs/media/prompts/build-from-real-data.mjs
```

## Why generate instead of typing prompts

The R28a catalog (`docs/3d/IMAGE_SYNTHESIS_PROMPT_CATALOG_20260928.md` §2) is
directionally good but deliberately number-free. Any prompt that *asserts a figure*
must get that figure from the sourced dataset, or it becomes a claim the site cannot
defend. This directory is the binding layer: the JSON's `dataBindings` block shows,
per prompt, exactly which real value the prompt text embeds.

## Which prompts were bound, and which were left alone — and why

| R28a concept | Disposition | Reason |
| --- | --- | --- |
| A — architectural carport hero | **Bound** (2 variants: golden-hour 16.45°/292.2° and noon 74.44° sun at Phuket, June solstice) | Light direction is the one thing an image model cannot invent correctly — so it is fed from `sunMath.ts` real NOAA output |
| B — holographic telemetry | **Bound** (77 columns, max Phuket 1,510.98, min Trat 1,286.82, mean 1,373.51) | The whole concept is a data visualization; embedding the real stats is the point |
| C — exploded structure | **Extended, not number-bound** | Pure structural diagram; no figure belongs in it. Binding is stylistic (matches `ProvinceSolarScene.tsx` pillar/tilt geometry) |
| D — BESS enclosure | **Extended, not number-bound** | Product photography; asserting capacity figures it does not depict would be fabrication. Binding is palette (dark theme from `client/src/index.css`) |

## Provider disclaimer (mandatory)

Every prompt that touches a yield/irradiation figure carries this string in the JSON
and must accompany the image wherever it is published:

> ภาพแนวคิดสถาปัตยกรรมเพื่อการสาธิตวิศวกรรม — ตัวเลขอ้างอิงค่าปกติสภาพอากาศ PVGIS v5.3 (PVGIS-ERA5, 2005–2023) ไม่ใช่คำสัญญาผลผลิตหรือการประหยัดงบจริงของไซต์ใดไซต์หนึ่ง

The two number-free prompts carry a narrower disclaimer (no performance figures depicted).

## Execution path (unchanged, per LANE_ASSIGNMENT R29 §4)

- `docs/media/generate-illustrations.mjs` remains **dry-run by default**.
- Actually generating pixels requires gate **`APPROVE_PAID_IMAGE_PROVIDER_CALL`**;
  output goes to `.media-staging/_quarantine/` only, never straight to `client/public/`.
- Promoting quarantined images to `client/public/` is a separate gate:
  **`APPROVE_MEDIA_PROMOTE_TO_PUBLIC`** (granted 2026-09-28, currently unused —
  no media exists yet), and must pass
  [`PROMOTION_CHECKLIST.md`](./PROMOTION_CHECKLIST.md) in full:
  format · dimensions · disclaimer · manifest · hard rejections.

## Cross-check note for the catalog

The R28a catalog's §3 toolchain (`sharp` on the VM) and breakpoints remain the
delivery spec. This directory adds the *input* discipline (data-bound prompts);
it does not modify the *output* spec.
