# Report — PKG-5 WebGL / Core Web Vitals measured for sirinx.co (2026-09-28)

- Pair: `receipts/SIRINX_CO_PKG5_WEBGL_MEASURED_20260928.md`
- Lane: coordinator (cmux `surface:7`, jcode) on the Mac mini M2
- Gate consumed: **NONE** — all work was read-only
- Deliverable: `docs/media/WEBGL_PERF_BUDGET_20260928.md`

## Summary

PKG-5 was the package every prior round had marked "not measured", blocked on a Chrome
extension that was switched off. That blocker was wrong. The project venv already had
Playwright and the machine already had Google Chrome 154, so a real browser measurement
was available with no install and no gate.

It has now been measured. 7 of 7 runs succeeded.

**Good news, measured:** CLS is 0.000 on all 7 runs. LCP min/median/max is
684/1552/1844 ms, so the site is inside the 1800 ms "good" band on 6 of 7 runs and over
it on one. The 3D was never the LCP element on any page.

**Three defects found, none previously on record:**

1. `ProvinceYieldChart3D` keeps animating under `prefers-reduced-motion: reduce`, on both
   desktop and mobile, while `ProvinceSolarScene` correctly stops. WCAG 2.2.2 / 2.3.3.
2. A lost WebGL context is never recovered. Forced loss produced `webglcontextlost` on
   2/2 canvases and `webglcontextrestored` on 0/2, in all 4 configurations. GL state
   remained `LOST`. The last frame is preserved, so the 3D silently freezes looking like
   a deliberate static illustration, with no message and no resumption.
3. The canvases are `aria-hidden="true"` with no `aria-label`, no `aria-describedby`, no
   text content, and an empty parent. There is no text alternative for the 3D at all.

## Files changed

| file | what |
| --- | --- |
| `docs/media/WEBGL_PERF_BUDGET_20260928.md` | the measured deliverable |
| `reports/SIRINX_CO_PKG5_WEBGL_MEASURED_20260928.md` | this report |
| `receipts/SIRINX_CO_PKG5_WEBGL_MEASURED_20260928.md` | paired receipt |
| `data/tmp_webgl_measure/*.py`, `*.json`, `*.png` | measurement harness and raw output |

No application source file was modified. No file outside `docs/media/`, `reports/`,
`receipts/` and the scratch dir was touched.

## Commands run

| command | result |
| --- | --- |
| `browser` status | bridge not responding — extension off |
| locate browser binary | Google Chrome 154.0.8037.58 present |
| `python -c "import playwright"` (project venv) | already installed |
| `measure_webgl_perf.py` | 7/7 successful, LCP 684/1552/1844, CLS 0.000 |
| `probe_pass2.py` | late canvas count = 2; revealed the rAF-proxy flaw |
| `probe_pass3.py` | ambiguous readback + regex bug — discarded as evidence |
| `probe_pass4.py` | context loss 2/2, restore 0/2, in all 4 configs |
| `probe_pass5.py` | **decisive**: canvas-scoped animation test |
| `probe_pass6.py` | luminance/grey-level analysis before and after loss |
| `npx vitest run --root . shared` (independent check of Lane B1) | 110 passed |

## Validation

- Every number in the deliverable came from a recorded run in this session. Nothing was
  carried over from a prior report.
- The reduced-motion finding was **not** taken from a frame-rate count. Pass 2 produced a
  misleading 60 fps reading because a self-scheduled rAF loop ticks at display refresh
  regardless of whether the scene animates. It was only accepted after pass 5 clipped
  the screenshot diff to the canvas rectangles themselves.
- The "not a blank box" claim was not made from looking at a picture — this session has
  no vision input. It was measured as mean luminance, non-black share and distinct grey
  levels before and after the forced loss.
- Lane B1's motion-flag work was re-verified independently rather than accepted on its
  report: flipping `MOTION_HOME_ENABLED` to `true` made the suite report
  `1 failed | 2 passed`, and restoring it returned `3 passed`.
- Passes 2–4 are retained in the scratch dir specifically so the wrong turns are not
  repeated.

## Risks

1. **Lab, not field.** Single samples, headless, one machine, one network path. No CrUX,
   no RUM. The Browser Agent Bridge is still off, so no field data is being collected and
   nothing here should be quoted as a user-experience number.
2. **The three defects are on live components.** `ProvinceYieldChart3D.tsx` and
   `ProvinceSolarScene.tsx` are shipped and wired. Fixing them is a code change to
   production behaviour and needs an owner in the ownership matrix. It is scheduling, not
   a gate — but it is not something to do unassigned.
3. **This does not clear the motion flag.** Homepage LCP with the flag off is 684/916 ms
   and the 3D is not the LCP element, which is favourable. It is not a measurement of the
   flag on, because that variant has never been built. Measure before flipping, not after.
4. **One run is over the good threshold**: Bangkok desktop 1844 ms with a 599 ms long task
   in the same run. Single sample, so it may be noise, but it is the first place to look.
5. All lanes share one working tree on `main` with no per-lane branch. Three lanes were
   writing during this session.

## Approval needed

None for this package. It consumed no gate.

It does surface one scheduling decision for the Commander: assign an owner for the three
defects in `WEBGL_PERF_BUDGET_20260928.md` §5, in that order. The gates that remain open
across the whole round are unchanged and listed in `LANE_ASSIGNMENT_20260928.md` §6.

## Next action

1. Assign Defect 3 (text alternative) to a lane — smallest change, widest reach.
2. Assign Defect 1 (`prefers-reduced-motion` in `ProvinceYieldChart3D`).
3. Assign Defect 2 (`webglcontextrestored` handling plus a visible fallback message).
4. Re-measure the homepage with `MOTION_HOME_ENABLED = true` against the 684/916 ms
   baseline, then bring the result back for `APPROVE_MOTION_HOME_ENABLED_TRUE`.
5. Turn the Browser Agent Bridge on if field data is wanted; it is still the only route
   to RUM and it is a manual Chrome step.
