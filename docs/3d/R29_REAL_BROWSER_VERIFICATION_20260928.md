# R29 real-browser verification of the three 3D fixes (2026-09-28)

- Owner: coordinator (cmux `surface:7`, jcode) on the Mac mini M2
- Gate consumed: **NONE** — a localhost Vite dev server is explicitly not an external effect
- Verifies: the fixes Lane B3 made to `ProvinceSolarScene` and `ProvinceYieldChart3D`
- Pair: `reports/SIRINX_CO_R29_REAL_BROWSER_VERIFY_20260928.md`

## Why this exists

Lane B3 fixed three defects found by measurement on live production, and its tests are
jsdom. **jsdom has no WebGL.** That means the unit tests could not have proven the two
claims that actually matter — that a lost context is genuinely restored, and that a
canvas genuinely stops repainting. They also could not have proven the visible fallback
message appears, because that message is rendered in response to a real context event.

So the fixes were code-complete and unit-tested, but not behaviourally verified. This
closes that gap. It is the check that a jsdom test suite structurally cannot perform.

## Method

The two real components were mounted in headless Chrome 154 against a local Vite dev
server, using real Bangkok values imported from `shared/provinceEnergyData`
(lat 13.7525, lon 100.49416667, irradiation 5.12 kWh/m²/day, specific yield 1401.4
kWh/kWp/year). Nothing was faked. The harness existed only for this run and has been
deleted; the dev server has been stopped.

Same methodology that proved the defects on production: canvas-clipped screenshot hashes
1.5 s apart to detect repainting, and forced context loss via `WEBGL_lose_context`.

## Result — all three fixes verified in a real browser

### Defect 1 — `prefers-reduced-motion` ✅ FIXED

| case | `matchMedia` confirmed | `ProvinceSolarScene` | `ProvinceYieldChart3D` |
| --- | --- | --- | --- |
| normal | false | animating | animating |
| **reduced** | **true** | **stopped** | **stopped** |

On production this row read `[false, true]` — the chart kept animating while the user had
asked the OS to stop it. It now reads `[false, false]`. Both canvases also report live
`WebGL` contexts (`ok`, `ok`), so the scene is rendered, not blank.

### Defect 2 — context loss, fallback, and recovery ✅ FIXED

Full event sequence observed: `canvas0:lost`, `canvas1:lost`, `canvas0:restored`,
`canvas1:restored`.

| moment | GL state | visible fallback message |
| --- | --- | --- |
| before loss | `OK, OK` | none |
| **1.5 s after loss** | `LOST, LOST` | **shown on both**: "ไม่สามารถแสดงภาพสามมิติได้ในอุปกรณ์นี้" / "ไม่สามารถแสดงกราฟสามมิติได้ในอุปกรณ์นี้" |
| 3 s after restore | `OK, OK` | cleared |

And after the restore the canvases were **animating again** (`[true, true]`), which means
the `webglcontextrestored` handler genuinely rebuilds the scene rather than merely
releasing the GL error flag.

On production the last frame was preserved with no message and no recovery. Now the user
gets a real explanation and the scene comes back.

### Defect 3 — text alternative ✅ FIXED

Both canvases are `aria-hidden="true"` and both now resolve `aria-describedby` to real
content, plus a visible `<figcaption>`:

- **Solar scene** → *"Sun position on June 21 at the fixed scene's local noon: elevation
  80.27 degrees and azimuth 354.28 degrees, calculated by shared/sunMath."* — the figures
  are computed by the real `shared/sunMath`, not typed in. Figcaption carries
  `5.12 kWh/m²/วัน · 1401.4 kWh/kWp/ปี`, matching `provinceEnergyData`.
- **Yield chart** → *"…กรุงเทพมหานคร ได้ 1,401.4 kWh/kWp/ปี อยู่อันดับ 15 จาก 77 จังหวัด"*
  with the PVGIS climate-norm disclaimer, and a figcaption giving rank 15 of 77 and
  `+2.03%` against the mean.

Every number traces to a real data module. The rank and the percentage were not
hand-written.

## Two corrections to my own earlier readings — recorded, not deleted

Both of my first-pass readings were **test artifacts**, and both would have produced
confident, wrong conclusions:

1. **"`restored: 0` — the fix did not work." Wrong.** `WEBGL_lose_context.loseContext()`
   is a *simulated* loss. Per the WebGL spec the context only comes back when
   `restoreContext()` is called. A real driver loss in Chrome is restored automatically
   precisely *because* the app calls `preventDefault()` on the event — which it does. So
   the first result proved only that nothing had triggered a restore. Re-running with an
   explicit `restoreContext()` showed both contexts restored and both scenes animating.
   I nearly recorded a working fix as broken.
2. **"`roleStatus: []` — no fallback message appears." Wrong, and it was my bug.** That
   probe read the accessibility state *before* forcing the loss, so of course no error
   message existed yet. Reading it after the loss shows the fallback rendering correctly
   on both components.

This is the same class of error I made earlier in the round with the rAF frame counter.
It is why the numbers here come from scoped, ordered probes rather than a single pass.

## What remains unverified

- **Real driver-level context loss was not simulated.** `WEBGL_lose_context` is the
  supported way to exercise this path in a test, but it is not identical to a GPU process
  crash. The handler follows the documented pattern; confidence is high, not absolute.
- **`SolarHeroScene` was not included in this harness.** It is not wired into any page, so
  it has no production path to verify and no user-facing impact yet. Its lifecycle tests
  are jsdom only, for the same reason.
- Headless Chrome on this machine. No mobile GPU, no Safari, no field data.

## Files

- Harness: `client/__r29_harness.html`, `client/src/__r29_harness.tsx` — **created, used,
  and deleted**. Confirmed absent.
- Probes: `/Users/sirinx/project-hermes/data/tmp_webgl_measure/verify_fixes_real_browser.py`,
  `verify_restore_path.py`, output in `harness_verify.json` and `harness_restore.json`.
- No application file was modified by this verification.

## Side effects

`network: localhost only` · `provider_calls: none` · `installs: none` · `deploy: false` ·
`secrets_read: false` · dev server started and stopped · harness files removed ·
full suite re-run after cleanup: 47 files / 358 tests passed
