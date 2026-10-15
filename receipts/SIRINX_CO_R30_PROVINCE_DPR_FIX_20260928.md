# Receipt — SIRINX_CO_R30_PROVINCE_DPR_FIX_20260928

- Pair: `reports/SIRINX_CO_R30_PROVINCE_DPR_FIX_20260928.md`
- Issued: 2026-09-28 · Lane: jcode, cmux `surface:2`, Mac mini M2
- Gate consumed: **NONE**

## What this is

A one-line-per-file fix to two shipped 3D components, plus a regression guard. Origin was
a handover note from Lane D, who found the defect as a side effect of its own red proof and
did not fix it because the files were not in its ownership.

## Claims and how each was established

| claim | evidence |
| --- | --- |
| the defect existed | `grep -n "setPixelRatio" ProvinceSolarScene.tsx ProvinceYieldChart3D.tsx` → one occurrence each, at construction only; both `onResize` bodies read in full and contain none |
| the fix works, statically | guard added to `ProvinceScenes.test.ts`, passes with the fix present (7/7) |
| the guard is real, not decorative | fix reverted in one file → **1 failed \| 6 passed**, failure message names the missing `setPixelRatio` inside the handler |
| nothing else broke | fix restored → **48 files / 379 tests passed**; `npx tsc --noEmit` clean |
| the behavioural claim | **UNVERIFIED.** No browser check was run. Stated as such in the report rather than implied by the passing source test |

## Files

| path | change |
| --- | --- |
| `apps/public-web/client/src/components/three/ProvinceSolarScene.tsx` | +5 lines in `onResize` |
| `apps/public-web/client/src/components/three/ProvinceYieldChart3D.tsx` | +5 lines in `onResize` |
| `apps/public-web/client/src/components/three/ProvinceScenes.test.ts` | +28 lines, `it.each` guard |
| `apps/public-web/client/src/components/SolarCarportViewer.tsx` | +5 lines in `resize` — **third instance, found by the repo-wide sweep, live on `/solar-carport`** |
| `apps/public-web/client/src/components/SolarCarportViewer.test.ts` | new, 2 assertions incl. ordering before `setSize` |
| `reports/SIRINX_CO_R30_PROVINCE_DPR_FIX_20260928.md` | report |
| `receipts/SIRINX_CO_R30_PROVINCE_DPR_FIX_20260928.md` | this receipt |

## Honest limitation

The guards are **source-level**. They prove the cap is inside the handler. They do not
prove a browser re-renders correctly across a DPR change, because jsdom has no WebGL. The
report says this in its own section rather than letting green tests imply more than they
show.

Choosing source guards over full mocked-three mount tests was a judgement about
proportionality. It is recorded as a judgement, not as a verified equivalence. Lane D did
build a real mount test for its own component, and a reader may reasonably think these
deserve the same.

## One thing the checks caught on me

Appending addenda to `SIRINX_CO_R30_LANE_AUDIT_AND_DISPATCH_20260928.md` without re-pinning
its digest made `shasum -c` report FAILED. The digest was right and I was wrong. Repinned;
all R30 sidecars verify. Recorded because it is the working counter-example to the false
report in the main report's §3 — the digest check catches stale claims when someone runs it.

## Side effects

```
network: none · provider_calls: 0 · install: false · secrets_read: false
commit: false · push: false · deploy: false · deletes: 0
```
