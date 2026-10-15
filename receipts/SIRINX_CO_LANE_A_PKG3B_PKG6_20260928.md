# Receipt — Lane A PKG-3b + PKG-6

- Pair: `reports/SIRINX_CO_LANE_A_PKG3B_PKG6_20260928.md`
- Lane: **A — freebuff** · 2026-09-28 · Gate consumed: **none**
- Packages: PKG-3b (data-bound prompts) + PKG-6 (art engineering brief) + slot selection

## Gates (per Coordinator surface:7 + later named grant)

- `APPROVE_PAID_IMAGE_PROVIDER_CALL` — **NOT APPROVED**, no budget cap, no provider called
- `APPROVE_MEDIA_PROMOTE_TO_PUBLIC` — **GRANTED then unused: quarantine held no media**
  (only `dry-run-plan.json`, a plan document). Premise re-verified on disk before
  spending; verdict DRIFT — no object exists to promote. Nothing moved, nothing copied,
  `client/public/` untouched. Private-review staging dirs are outside the gate's named
  object and were not touched. Gate stays valid for when quarantined media actually
  exists (which first needs the provider gate above).
- PKG-5 production defects belong to **Lane B3**; Lane A encoded them as normative rules
  (brief §7a RULE-A11Y-1…4) and touched none of those files

## Delivered Artifacts

1. `docs/media/prompts/build-from-real-data.mjs` — generator: parse
   `shared/provinceEnergyData.ts` (guard 77/77) + import `solarPosition()` จาก
   `shared/sunMath.ts` จริง · read-only ต่อ repo · ไม่แตะ `client/public/` · ไม่เรียก provider
2. `docs/media/prompts/prompts-bound-20260928.json` — generated manifest (ห้ามแก้มือ):
   stats ชาติ (max Phuket 1510.98 · min Trat 1286.82 · mean 1373.51), ตำแหน่งดวงอาทิตย์จริง
   (Phuket 17:30 = 16.45°/292.2° · 12:30 = 74.44°/358.5° · BKK 17:30 = 16.67°/290.74°),
   5 prompts พร้อม dataBindings + disclaimer ครบทุกชิ้น
3. `docs/media/prompts/README.md` — กระบวนการ + ตาราง bound/not-bound พร้อมเหตุผล + gate flow
4. `docs/media/prompts/PROMOTION_CHECKLIST.md` — promotion checklist เขียนก่อนมีสื่อจริง:
   scope gate · format (AVIF q82/WebP q85/JPG) · dimensions 640/1024/1600/2560 ·
   disclaimer ที่จุดใช้งาน + ตัวเลขในภาพต้องผูกข้อมูลจริง · manifest ต่อไฟล์ครบ
   sha256/cost/gate_evidence · ขั้นตอน promote · hard rejections
4. `docs/3d/IMAGE_SYNTHESIS_PROMPT_CATALOG_20260928.md` — ขยายสองส่วน (extend, never
   replace; เนื้อหาเดิม R28a ครบ): §2b data-bound prompt layer + **§2c generation slot
   selection** — SELECTED 3 slots (solar-carport exploded diagram / strategy telemetry
   hologram / solutions BESS) พร้อมเหตุผล + REJECTED slots ทุก route พร้อมเหตุผล
5. `docs/media/ART_ENGINEERING_BRIEF_20260928.md` — PKG-6 ครบ 9 หมวด ทุก claim ชี้ไฟล์จริง ·
   §7a production rules จากผลวัด PKG-5 · asset budget อ้าง LCP/CLS จริง (lab-only) ·
   ชี้การคัดเลือก slot ที่ตัดสินแล้ว

## Verification Evidence

```
node --experimental-strip-types docs/media/prompts/build-from-real-data.mjs → exit 0, 77/77
npx vitest run --root . shared (apps/public-web) → 110 passed
shasum -c (จากใน reports/ และ receipts/ ตามลำดับ) → OK ทุก sidecars ของไฟล์คู่นี้
```

Red-proof note: fail-loud guard ใน generator (abort ถ้า ≠77 จังหวัด) คือกลไก
ที่พิสูจน์แดงได้เมื่อข้อมูลต้นทางเปลี่ยน; ไม่ mutate ไฟล์ generated เพื่อพิสูจน์

## Ownership Compliance

- แตะเฉพาะไฟล์ในสามของที่ Coordinator ยืนยัน: brief · prompts/** · catalog (extend)
- `generate-illustrations.mjs` untouched · no commit/push/deploy · no secrets
- R28a blanket-gate correction stands: Lane A ไม่อ้าง gate ใดๆ — gates consumed: NONE

## Non-Transitive Safety Boundary

`network: none · provider_calls: 0 · deploy: false · secrets_read: false · git: none`
