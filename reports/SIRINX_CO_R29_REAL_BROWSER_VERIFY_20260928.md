# Report — R29 real-browser verification of the three 3D fixes (2026-09-28)

- Pair: `receipts/SIRINX_CO_R29_REAL_BROWSER_VERIFY_20260928.md`
- Lane: coordinator (cmux `surface:7`, jcode) on the Mac mini M2
- Gate consumed: **NONE**
- Verifies: Lane B3's fixes to `ProvinceSolarScene` and `ProvinceYieldChart3D`
- Detail: `docs/3d/R29_REAL_BROWSER_VERIFICATION_20260928.md`

## Summary

The R29 round report said the three 3D defects were "fixed", while Lane B3's own report
said the browser behaviour was "not independently validated". Both statements were true of
different things, and the honest reading was that the fixes were **code-complete and
jsdom-tested but behaviourally unproven**. jsdom has no WebGL, so the suite structurally
could not have proven context recovery, repaint suppression, or the visible fallback.

That gap is now closed. The two components were mounted in real headless Chrome against a
local Vite server with real Bangkok data, and all three fixes were observed working.

| Defect | Production before | After the fix, real browser |
| --- | --- | --- |
| `prefers-reduced-motion` ignored | chart kept animating `[false, true]` | **both stop** `[false, false]` |
| Context loss never recovered | `lost 2/2, restored 0/2`, silent freeze | **`lost` then `restored` on both, scene animating again** |
| No text alternative | `aria-hidden`, empty parent, no label | **`aria-describedby` resolves to real text + figcaption, data-backed** |

The fallback message now appears on context loss and clears on recovery:
"ไม่สามารถแสดงภาพสามมิติได้ในอุปกรณ์นี้" / "ไม่สามารถแสดงกราฟสามมิติได้ในอุปกรณ์นี้".

## Files changed

| file | what |
| --- | --- |
| `docs/3d/R29_REAL_BROWSER_VERIFICATION_20260928.md` | the verification record |
| `reports/SIRINX_CO_R29_REAL_BROWSER_VERIFY_20260928.md` | this report |
| `receipts/SIRINX_CO_R29_REAL_BROWSER_VERIFY_20260928.md` | paired receipt |
| `reports/SIRINX_CO_R29_LANE_PLAN_AND_DISPATCH_20260928.md` | edited to correct an overstatement |

Two temporary harness files were created, used, and **deleted**:
`apps/public-web/client/__r29_harness.html` and `client/src/__r29_harness.tsx`.
Their absence was confirmed after deletion. No application source file was modified.

## Commands run

| command | result |
| --- | --- |
| `npx vite --port 5199` | ready in 637 ms, harness served 200 on both HTML and TSX |
| `verify_fixes_real_browser.py` | 2 cases, both canvases `ok` WebGL; reduced-motion `[false, false]` |
| `verify_restore_path.py` | `lost`→`restored` on both, fallback shown then cleared, animating after restore |
| `pkill -f "vite --port 5199"` | 0 processes remain |
| `rm` harness files, then `ls` | both confirmed absent |
| `npm test` after cleanup | **47 files / 358 tests passed** |

## Validation

- **Every number came from a real browser with a real WebGL context**, not from jsdom and
  not from reading the code.
- The data in the harness was imported from `shared/provinceEnergyData` and `shared/sunMath`
  rather than typed in, so the accessibility text that quotes `5.12`, `1401.4`, rank 15 of
  77 and `+2.03%` is demonstrably derived, not asserted.
- Cleanup was verified, not assumed: server processes gone, harness files absent, and the
  full suite re-run afterwards to prove nothing was left broken.

## Two errors I made, kept in the record

Both of my first-pass readings were measurement artifacts, and both would have become
confident false findings:

1. I read `restored: 0` as "the fix failed". `WEBGL_lose_context.loseContext()` is a
   *simulated* loss; the spec only restores on `restoreContext()`. Real driver loss is
   restored automatically precisely because the app calls `preventDefault()`, which it
   does. Re-testing with an explicit restore showed the fix working. I nearly recorded a
   working fix as broken.
2. I read `roleStatus: []` as "no fallback message". My probe sampled accessibility state
   *before* forcing the loss. Sampling after the loss shows the fallback rendering on both
   components. That was a bug in my probe, not a defect in the app.

This is the third time this round that an unscoped or mis-ordered probe produced a
plausible-but-wrong reading (the earlier one being the rAF frame counter). The method that
survives is the scoped, ordered one.

## Risks

1. **`WEBGL_lose_context` is not a real driver crash.** It is the supported way to exercise
   this path, and the handler follows the documented pattern, but confidence is high rather
   than absolute.
2. **`SolarHeroScene` remains unverified in a browser.** It is not wired into any page, so
   it has no production path to exercise, and its lifecycle tests are jsdom only.
3. **The fixes are still not deployed.** Verification was against a local build. Production
   still carries the three defects until this is committed and released, and that is a
   separate approval.
4. Headless Chrome, one machine, no mobile GPU, no Safari, no field data.

## Approval needed

None for this verification. It consumed no gate and made no external change.

Unchanged and still open: `APPROVE_PAID_IMAGE_PROVIDER_CALL` (with a budget cap),
`APPROVE_EXTERNAL_LANE_DISPATCH` for the VM lane, `APPROVE_PUSH_TO_MAIN_SIRINX_CO` to
release any of this, and `APPROVE_MOTION_HOME_ENABLED_TRUE` once the flag-on variant has
been measured.

## Next action

1. Commit and release, under `APPROVE_PUSH_TO_MAIN_SIRINX_CO`, so the three fixes reach
   production and the defects stop being user-facing.
2. Re-run `WEBGL_PERF_BUDGET_20260928.md`'s production probe afterwards to confirm the
   live site, not just the local build, now passes all three checks.
3. Add the same real-browser harness pattern to CI if this is to stay true after the
   commits, because jsdom will keep passing regardless.
