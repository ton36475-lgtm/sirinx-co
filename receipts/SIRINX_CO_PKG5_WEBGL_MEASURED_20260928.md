# Receipt — PKG-5 WebGL / Core Web Vitals measured (2026-09-28)

- Pairs with: `reports/SIRINX_CO_PKG5_WEBGL_MEASURED_20260928.md`
- Deliverable: `docs/media/WEBGL_PERF_BUDGET_20260928.md`
- Lane: coordinator (cmux `surface:7`, jcode), Mac mini M2
- Gate consumed: **NONE**

## What was actually done

A read-only measurement of the live production site using the Playwright already present
in the project venv driving the already-installed Google Chrome 154 via `channel="chrome"`.
No dependency was installed, no browser extension was enabled, no service was started.

The package had been carried as "not measured" by earlier rounds because the Browser Agent
Bridge extension was off. That was treated as a hard blocker and it was not one.

## What was checked

- LCP, CLS, FCP, TTFB, long tasks, JS heap across 3 URLs × desktop/mobile, plus a
  reduced-motion run. 7 of 7 runs succeeded.
- The identity of the LCP element on every run.
- Whether each 3D canvas repaints over time, tested by hashing screenshots **clipped to
  the canvas rectangles**, under both normal and `prefers-reduced-motion: reduce`.
- Behaviour under a forced `WEBGL_lose_context`, recording `webglcontextlost` and
  `webglcontextrestored` counts and the GL state afterwards.
- Accessibility attributes on both canvases, and whether any user-facing message exists.
- Quantitative appearance of the canvas before and after context loss, by mean luminance,
  non-black pixel share and distinct grey levels.

## What was deliberately NOT done

- **No gate was consumed and none was assumed.** No paid provider was called.
- **No file in `client/public/` or any application source was modified.** This package is
  measurement only.
- **No fix was applied** for the three defects found. They are reported, not silently
  patched, because they touch shipped components that need an assigned owner.
- **`MOTION_HOME_ENABLED` was not flipped.** The measurement supports flipping it; it
  does not authorise it, and the flag-on variant has never been built or measured.
- **No claim of field/real-user data.** The Browser Agent Bridge is still off, so there
  is no RUM. Everything here is lab data from one machine.
- **No visual inspection of screenshots.** This session has no vision input, so
  appearance was measured numerically rather than eyeballed, and the document says so.

## Findings recorded

1. CLS 0.000 on all 7 runs. LCP min/median/max 684 / 1552 / 1844 ms; 6 of 7 inside the
   1800 ms "good" band, one over it.
2. The 3D was never the LCP element on any page measured.
3. `ProvinceYieldChart3D` animates under `prefers-reduced-motion: reduce` on desktop and
   mobile; `ProvinceSolarScene` correctly stops. WCAG 2.2.2 / 2.3.3.
4. WebGL context loss is never recovered: `lost 2/2`, `restored 0/2`, GL state `LOST`, in
   all four configurations. The last frame persists, so the failure is silent.
5. Both canvases are `aria-hidden="true"` with no label, no description, no text content
   and an empty parent. No text alternative exists for the 3D.

## Corrections made to my own earlier reasoning, kept rather than deleted

- I first read "60 fps" off a `requestAnimationFrame` counter I had scheduled myself. That
  counter ticks at display refresh whether or not the scene animates, so it could not
  support any claim about the 3D. The reduced-motion finding was discarded and re-derived
  from canvas-clipped screenshots.
- I first read canvas pixels with `drawImage`/`toDataURL`. With
  `preserveDrawingBuffer: false` — confirmed false on this site — that read comes back
  cleared, so "unchanged" could not be distinguished from "not animating". Discarded.
- I first compared whole-page screenshots, which can differ for reasons unrelated to the
  3D. The pass-4 result was not accepted as evidence.
- One probe silently returned a meaningless `restored: false` because the event listeners
  had not been attached in that pass. Re-run with listeners attached before the result was
  used.

## Artifacts

`/Users/sirinx/project-hermes/data/tmp_webgl_measure/` — `measure_webgl_perf.py`,
`probe_pass2.py` … `probe_pass6.py`, `vitals.json`, `vitals_pass2.json`,
`vitals_pass3.json`, `vitals_pass4.json`, and the clipped screenshots. The superseded
passes are deliberately retained so the same wrong turns are not repeated.

## Side effects, declared

| effect | value |
| --- | --- |
| network | yes — read-only GETs to `https://www.sirinx.co` and its assets |
| provider_calls | none |
| installs | none |
| deploy | false |
| secrets_read | false |
| source files modified | none |
| gates consumed | none |

## Next action

The three defects in §5 of the deliverable need an owner. The order given there is
deliberate: text alternative first, reduced motion second, context recovery third, then a
re-measurement of the homepage with the motion flag on before
`APPROVE_MOTION_HOME_ENABLED_TRUE` is even put forward.
