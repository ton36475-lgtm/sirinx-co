# Receipt — R29 real-browser verification of the three 3D fixes (2026-09-28)

- Pairs with: `reports/SIRINX_CO_R29_REAL_BROWSER_VERIFY_20260928.md`
- Lane: coordinator (cmux `surface:7`, jcode) on the Mac mini M2
- Gate consumed: **NONE**
- Detail: `docs/3d/R29_REAL_BROWSER_VERIFICATION_20260928.md`

## What was actually done

Lane B3 fixed three defects that had been measured on live production. Its tests are
jsdom, and jsdom has no WebGL, so the suite could not possibly have verified the two
behaviours that matter most. Rather than repeat the claim, the two components were loaded
in real headless Chrome against a local Vite dev server and the fixes were observed.

## What was checked

- Both components mount, create live WebGL contexts, and render.
- `prefers-reduced-motion: reduce` confirmed active via `matchMedia`, then each canvas
  tested for repaint by hashing screenshots clipped to its own rectangle.
- A full context-loss cycle: `webglcontextlost`, the visible fallback message, an explicit
  `restoreContext()`, `webglcontextrestored`, and whether the scene animates again.
- Both canvases' `aria-describedby` targets resolved to real text, and every figure in that
  text traced back to `provinceEnergyData` or `sunMath`.

## What was deliberately NOT done

- **No gate consumed.** A localhost dev server is not an external effect.
- **No deployment, no commit, no push.** Production still carries the three defects.
- **No application source file was modified.** This was verification only.
- **No claim of real driver-level GPU loss.** `WEBGL_lose_context` simulates a loss; it is
  not a GPU process crash, and that limit is stated in the verification record.
- **`SolarHeroScene` was not included**, because it is not wired into any page and has no
  production path to exercise. That omission is recorded, not glossed.

## Temporary artifacts created and removed

`apps/public-web/client/__r29_harness.html` and `apps/public-web/client/src/__r29_harness.tsx`
were created to mount the components with real data, then deleted. Absence confirmed by
`ls` after deletion, the Vite process confirmed stopped, and the full suite re-run
afterwards: 47 files / 358 tests passed.

## Errors I made during this verification, recorded rather than removed

1. I initially read `restored: 0` as evidence the fix had failed. It had not. A simulated
   loss only restores when `restoreContext()` is called, and a real loss is restored
   automatically because the app calls `preventDefault()`. Re-tested properly, the fix
   works on both canvases.
2. I initially read an empty `role="status"` list as "no fallback message". My probe
   sampled that state before forcing the loss. Sampled after, the fallback is present.

Both were my measurement errors, and both would have been written up as confident findings
about the application if I had stopped at the first result. The earlier rounds of this same
session produced two more readings of the same kind — an rAF frame counter used as an
animation proxy, and a whole-page screenshot diff used as a canvas-scoped one.

## Findings

All three defects are fixed and verified in a real browser: reduced motion now stops both
canvases, context loss now produces a user-visible message and then fully recovers with
the scene animating again, and both canvases now resolve to real, data-backed descriptive
text.

## Side effects, declared

| effect | value |
| --- | --- |
| network | localhost only (`127.0.0.1:5199`) |
| provider_calls | none |
| installs | none |
| deploy / commit / push | none |
| secrets_read | false |
| dev server | started and stopped, 0 processes remaining |
| temp files | 2 created, 2 deleted, absence confirmed |
| gates consumed | none |

## Next action

Release under `APPROVE_PUSH_TO_MAIN_SIRINX_CO`, then re-run the production probe to confirm
the live site passes all three checks, and consider putting this real-browser pattern into
CI — because jsdom will keep reporting green either way.
