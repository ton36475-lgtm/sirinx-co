# Report — Lane A (freebuff) PKG-3b + PKG-6, sirinx.co illustration round R29 (2026-09-28)

- Pair: `receipts/SIRINX_CO_LANE_A_PKG3B_PKG6_20260928.md`
- Lane: **A — freebuff** (per `docs/media/LANE_ASSIGNMENT_20260928.md` §2) · Gate consumed: **none**
- Deliverables: `docs/media/prompts/` (PKG-3b) and `docs/media/ART_ENGINEERING_BRIEF_20260928.md` (PKG-6)

## Summary

ทำงานเฉพาะสอง package ที่ LANE_ASSIGNMENT R29 มอบให้ Lane A ครบทั้งสองชิ้น และเสริมงานที่
COORDINATOR (surface:7) ขอเพิ่มภายหลัง: การคัดเลือก slot ที่ควรใช้ภาพ generate จริง
โดยไม่แตะไฟล์ของเลนอื่นเลย

## GATES — recorded still-open (per Coordinator, none is approved)

| Gate | Status |
| --- | --- |
| `APPROVE_PAID_IMAGE_PROVIDER_CALL` | **NOT APPROVED** — no budget cap set. No image provider called; zero provider_calls. |
| `APPROVE_MEDIA_PROMOTE_TO_PUBLIC` | **GRANTED, then found to have no eligible object — see ledger below. Nothing was promoted.** |

### GATE LEDGER — `APPROVE_MEDIA_PROMOTE_TO_PUBLIC` (2026-09-28, later the same day)

The Commander granted the named approval `APPROVE_MEDIA_PROMOTE_TO_PUBLIC`. Before
spending it, the premise was re-verified on disk per §2 (re-verify before spending):

- `.media-staging/_quarantine/` contains **exactly one file: `dry-run-plan.json`** —
  a JSON plan document, not media. **Zero images exist in quarantine.**
- Nothing was ever generated because the prerequisite gate
  `APPROVE_PAID_IMAGE_PROVIDER_CALL` has not been granted (provider_calls: 0 estate-wide).
- `.media-staging/2026-08-21/` and `.media-staging/2026-09-25-private-review/` sit
  **outside** `_quarantine/` and are explicitly named *private-review* — they are not
  the object this gate names, and promoting private-review assets to a public directory
  is a different and more dangerous action that this approval does not cover.

**Verdict: premise does not match disk (DRIFT). The gate is recorded as granted and
unused — no object to promote.** Nothing was moved, copied, or written into
`client/public/`. The gate remains valid for the day quarantined media actually exists,
which first requires the still-ungranted `APPROVE_PAID_IMAGE_PROVIDER_CALL`.

Nothing waits on the Commander from this lane.

## PKG-5 defects — encoded as rules, NOT fixed (fix belongs to Lane B3)

The three measured production defects (`docs/media/WEBGL_PERF_BUDGET_20260928.md`) are
assigned to Lane B3 by the Coordinator. Lane A did not touch
`ProvinceYieldChart3D.tsx` / `ProvinceSolarScene.tsx`. The brief encodes them as
**normative rules** (brief §7a) so they cannot recur and the fixes have an acceptance bar:

- RULE-A11Y-1 — reduced motion must stop every scene's animation (canvas-rect-clipped
  screenshot diff, per the PKG-5 pass-5 method — not an rAF counter)
- RULE-A11Y-2 — `webglcontextlost`/`webglcontextrestored` handling + visible fallback
  message; never a silent freeze (baseline: 2/2 lost, 0/2 restored)
- RULE-A11Y-3 — every decorative canvas must expose a text alternative
- RULE-A11Y-4 — no new 3D/illustration component ships without RULE-A11Y-1…3 passing;
  unmeasured = `unverified`, not compliant

## PKG-3b — Data-bound prompts (`docs/media/prompts/`)

| Artifact | What it does |
| --- | --- |
| `docs/media/prompts/build-from-real-data.mjs` | Generator ที่ parse `apps/public-web/shared/provinceEnergyData.ts` (guard 77/77 — abort ถ้าไม่ครบ) และ import `solarPosition()` จริงจาก `apps/public-web/shared/sunMath.ts` แล้ว emit JSON |
| `docs/media/prompts/prompts-bound-20260928.json` | Generated manifest: national stats, top5/bottom3 จาก yield จริง, ตำแหน่งดวงอาทิตย์จริง, 5 prompts พร้อม `dataBindings` + disclaimer ทุกชิ้น — ห้ามแก้มือ, regenerate เท่านั้น |
| `docs/media/prompts/README.md` | กระบวนการ + ตาราง bound/not-bound พร้อมเหตุผล + gate flow |
| `docs/media/prompts/PROMOTION_CHECKLIST.md` | เขียน**ก่อนมีสื่อเกิดขึ้นจริง** ตามคำสั่ง Coordinator: ขั้น scope gate (quarantine จริง + slot ต้องอยู่ใน §2c SELECTED + มี entry ใน bound JSON) · format (AVIF q82 / WebP q85 / JPG progressive จาก source เดียว) · dimensions ครบ 640/1024/1600/2560 + ขนาดไฟล์สมเหตุสมผล · disclaimer ที่จุดใช้งานจริง + ห้ามตัวเลขที่ render ในภาพแต่ไม่ผูกข้อมูล · manifest ต่อไฟล์ (prompt_id, model, seed, cost, sha256, encoder, gate_evidence) · ขั้นตอน promote 6 ขั้น · hard rejections 6 ข้อ |

จุดสำคัญ: **ไม่มีตัวเลขใน prompt ที่พิมพ์เอง** ผลรันจริง:

```
provinces parsed : 77
max yield        : phuket 1510.98
min yield        : trat 1286.82
mean yield       : 1373.51
phuket 17:30 sun : 16.45° elevation / 292.2° azimuth
phuket 12:30 sun : 74.44° elevation / 358.5° azimuth
bangkok 17:30 sun: 16.67° elevation / 290.74° azimuth
prompts emitted  : 5
```

`docs/media/generate-illustrations.mjs` **ไม่ถูกแตะ** (ยัง dry-run default, ยังอ้าง gate
ถูกชื่อ) ตามข้อความสั่ง "Leave that behaviour alone"

## Generation slot selection (Coordinator's addition — delivered)

Catalog §2c (`IMAGE_SYNTHESIS_PROMPT_CATALOG_20260928.md`, extension only) now contains
the selection that justifies any future spend:

- **SELECTED — 3 slots:** (1) `/solar-carport` exploded structural diagram (Concept C,
  number-free — no photo can exist of this view) · (2) `/strategy` AI telemetry hologram
  (Concept B, data-bound to the 77 real yields) · (3) `/solutions` BESS container render
  (Concept D, number-free)
- **REJECTED with reasons:** `/` hero (real photos + 3D shipped, LCP-sensitive),
  77 province pages (served by real-data renders), `/projects*` (real photos must stay
  real), `/about`+`/partner` (people/events = photography only), `/home-solution`+
  `/industries`+`/blog` (durable answer is a real shoot), `/pricing`+`/investment`
  (live numbers belong in HTML/SVG), `/assessment` (should be a WebGL component under
  RULE-A11Y), `/contact`+`/line` (nothing needed)

## PKG-6 — Art Engineering Brief

`docs/media/ART_ENGINEERING_BRIEF_20260928.md` ครบ 9 หมวด ทุก claim ชี้ไฟล์จริง —
palette จาก `client/src/index.css` (oklch tokens จริง) + GLSL uniforms · fonts จาก
`--font-display`/`--font-body` · motion จาก `shared/motionTokens.ts` · camera จาก
3 components จริง · สไตล์ภาพจาก catalog §1 + prompts bound · a11y มีทั้ง measured reality
(§7b) และ production rules (§7a) · asset budget อ้างตัวเลข PKG-5 จริง (CLS 0.000 ·
LCP 684/1,552/1,844 ms, lab-only) · สไตล์ข้อ 4 ชี้การคัดเลือก slot ที่ตัดสินแล้ว

## Verification evidence

```
node --experimental-strip-types docs/media/prompts/build-from-real-data.mjs
  → exit 0, wrote prompts-bound-20260928.json, 77/77 provinces
cd apps/public-web && npx vitest run --root . shared
  → 110 passed (ยืนยันว่างานเลนอื่น + tokens ยังเขียว)
shasum -c ทั้ง reports/ และ receipts/ sidecars ของไฟล์ตัวเอง → OK ทุกไฟล์
```

Red-proof note: งานของ Lane A เป็นเอกสาร/JSON ล้วน — fail-loud guard ใน generator
(abort ถ้า ≠77 จังหวัด) คือกลไกที่พิสูจน์แดงได้เมื่อข้อมูลต้นทางเปลี่ยน

## Ownership compliance (Coordinator-confirmed scope)

- Ownership ตรงตามที่ Coordinator ยืนยัน: `docs/media/ART_ENGINEERING_BRIEF_20260928.md` ·
  `docs/media/prompts/**` · `docs/3d/IMAGE_SYNTHESIS_PROMPT_CATALOG_20260928.md`
  (extend, never replace — เนื้อหาเดิม R28a ทั้งหมดยังอยู่ครบ)
- ไม่แตะ: `shared/`, `client/src/**`, `generate-illustrations.mjs`, PKG-5 defect files
- No commit · no push · no deploy · no secret read/printed

## Side effects

`network: none · provider_calls: 0 · deploy: false · secrets_read: false · git: none`
