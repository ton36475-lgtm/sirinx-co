# Receipt — SIRINX_CO_R30_P2_MOTION_LAYOUT_20260928

- Pair: `reports/SIRINX_CO_R30_P2_MOTION_LAYOUT_20260928.md`
- Issued: 2026-09-28 · Lane: jcode, cmux `surface:2`, Mac mini M2
- Gate consumed: **NONE** · `MOTION_HOME_ENABLED` = `false`, unchanged

## What this is

Package R30-P2 steps 1 and 2 of the R30 order: replace `Layout.tsx`'s four hardcoded motion
values with tokens, and prove the guard against reintroduction goes red. **Step 3, the
browser A/B measurement, was not done.**

## Claims and how each was established

| claim | evidence |
| --- | --- |
| Layout had 4 hardcoded motion values | `grep` on `Layout.tsx`: `duration-300`, `{type:"spring",damping:28,stiffness:300}`, `duration-200`, `{duration:0.2}` |
| they are now tokens | one import + four call sites edited; values unchanged and pinned by test |
| only 2 tokens were added | `duration-200` and `0.2` are both 200 ms and both map to the existing `MOTION_DURATIONS.micro`; `scrollProgress` and `overlay` are the only additions |
| the guard is real | one site reverted to `duration-200` → **1 failed \| 11 passed**, failure names `duration-200` |
| nothing else broke | restored → **49 files / 385 tests passed**; `npx tsc --noEmit` clean |
| the flag was not flipped | `grep MOTION_HOME_ENABLED shared/motionFlags.ts` → `false` |
| the A/B measurement | **NOT RUN.** No append was made to `MOTION_FLAG_AB_MEASUREMENT_20260928.md`. A partial measurement appended to a real one would be worse than none. |

## The mistake worth recording

The first version of the regression guard **failed on its own documentation**. The comment
explaining the change contains the literal string `duration-300`, and the guard scanned
comments. Fixed by stripping comments before scanning. A guard satisfied by editing a
comment is a guard that will later be satisfied by accident.

## Why this ran in the coordinator lane

Two worker attempts failed before writing anything — the first after one sentence, the
second after reaching step 1. Both left `Layout.tsx` untouched and the suite green at 48/381,
so there was no partial state to clean up. Two consecutive failures is a signal, so the
package was taken over rather than retried a third time. **The cause of the failures is
unexplained and is not diagnosed by this receipt.**

## Files

| path | change |
| --- | --- |
| `apps/public-web/shared/motionTokens.ts` | +2 tokens, values unchanged |
| `apps/public-web/shared/motionTokens.test.ts` | +4 tests, comment-stripping guard |
| `apps/public-web/client/src/components/Layout.tsx` | 4 values → tokens, 1 import |
| `reports/SIRINX_CO_R30_P2_MOTION_LAYOUT_20260928.md` | report |
| `receipts/SIRINX_CO_R30_P2_MOTION_LAYOUT_20260928.md` | this receipt |

## Side effects

```
network: none · provider_calls: 0 · install: false · secrets_read: false
commit: false · push: false · deploy: false · deletes: 0
```
