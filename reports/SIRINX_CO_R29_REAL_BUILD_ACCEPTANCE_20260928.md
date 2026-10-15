# Report — R29 real-build acceptance, bundle measurement, and a build I broke (2026-09-28)

- Pair: `receipts/SIRINX_CO_R29_REAL_BUILD_ACCEPTANCE_20260928.md`
- Lane: coordinator (cmux `surface:7`, jcode) on the Mac mini M2
- Gate consumed: **NONE** — localhost dev/preview servers only
- Detail: `docs/3d/R29_REAL_BUILD_ACCEPTANCE_20260928.md`

## Summary

The earlier verification of the three 3D fixes ran against a harness page I wrote myself.
That is a synthetic fixture: it proves the components behave correctly in isolation, and
it does not prove the shipped route does. This round replaced it with the project's real
path — a production build, served by `vite preview`, driven through four actual routes.

Three things came out of it: the fixes hold on the real route, the bundle objection to
enabling motion is now measured rather than assumed, and I broke the build myself and had
to repair it.

## What was verified, requirement by requirement, on `/solar-carport/bangkok/`

| requirement | how it was checked on the real route | observed |
| --- | --- | --- |
| reduced motion honoured | `requestAnimationFrame` call count over 2 s, with a static `<h1>` control region | **0 calls** under reduce, 274 when normal; control changed in both, proving the canvas-hash reading was a false positive |
| context loss recovered | forced `WEBGL_lose_context`, then `restoreContext()` | `c0:lost c1:lost c0:restored c1:restored`; `LOST, LOST` then `OK, OK`; fallback text shown on loss, cleared on restore |
| text alternative present | resolve each canvas's `aria-describedby` to its target and read it | both resolve to real, data-bound text; none empty |

**Route sweep, for regressions outside the province page:** `/` 200 with 1 live WebGL
canvas, `/solar-carport/bangkok/` 200 with 2, `/strategy` 200 with 0, `/solutions` 200 with
0. **Zero page errors on all four.**

## Bundle measurement — the gap I had flagged as unmeasured

I had recorded that runtime LCP was measured but production **bundle** cost was not, and
that the bundle number was what would actually decide the motion flag. Both variants were
now built and every emitted chunk measured:

| | total JS, 91 chunks |
| --- | --- |
| flag off | 5162.0 kB raw / 1004.4 kB gzip |
| flag on | 5162.5 kB raw / 1004.6 kB gzip |
| delta | **+0.5 kB raw / +0.2 kB gzip** |

The reason is structural rather than lucky: `vendor-motion-BsD3OiIS.js` (123.6 kB,
40.4 kB gzip) is in the shipped bundle **regardless of the flag**, because 13 other pages
import `framer-motion` directly. Every visitor already pays for it.

With the earlier runtime result (median LCP delta +4 ms desktop, +8 ms mobile, CLS
unchanged, DOM node count identical at 916), both objections to enabling motion on the
homepage are now measured rather than argued.

## The mistake, stated plainly

To measure the bundle I ran `rm -rf dist/public` and then `npx vite build` alone. That is
a **partial build** — the project's real build also runs `server/staticSeoBuild.ts`, which
produces the prerendered HTML. Deleting the output made `shared/crawlReachability.test.ts`
fail, because that test walks the real `<a href>` graph in `dist/public`.

The suite went to **2 failed / 356 passed**. It stayed red until I ran the full
`npm run build`, which restored 108 prerendered HTML files. Final state verified:
**47 files / 358 tests passed, `tsc --noEmit` exit 0**, flag confirmed back at `false`.

The lasting lesson is not about my mistake specifically. It is that **`npm test` in this
repo is not a pure source check** — it silently depends on a full build being on disk, and
a partial build produces a red suite whose error message points at crawl links rather than
at the build. That will mislead the next person too.

## A correction to my own earlier claim

The first real-route run reported the canvases as still animating under reduced motion,
contradicting the harness. Taken at face value that meant the fix did not hold in
production. It does. The canvas rectangle moves because page-level motion shifts pixels
inside that bounding box, and the static `<h1>` control region moved too.

**A canvas screenshot-hash test is only interpretable alongside a static control region.**
This is the sixth time this round a plausible proxy measurement produced a confident wrong
answer — after the rAF frame counter, the whole-page screenshot diff, the `restored: 0`
reading, the `roleStatus` ordering bug, the single-sample A/B, and now this. Each was
caught only because a second, differently-shaped measurement was run.

## Files changed

| file | what |
| --- | --- |
| `docs/3d/R29_REAL_BUILD_ACCEPTANCE_20260928.md` | the acceptance record |
| `reports/SIRINX_CO_R29_REAL_BUILD_ACCEPTANCE_20260928.md` | this report |
| `receipts/SIRINX_CO_R29_REAL_BUILD_ACCEPTANCE_20260928.md` | paired receipt |

No application source file was changed by this work. `dist/` was rebuilt, which is
generated output and is git-ignored.

## Commands run

| command | result |
| --- | --- |
| `npx vite build` (flag off) | 91 chunks, 5162.0 kB / 1004.4 kB gzip |
| flip flag true, `rm -rf dist/public`, `npx vite build` | 91 chunks, 5162.5 kB / 1004.6 kB gzip |
| flip flag back to false | verified by file read |
| `npx vite preview --port 5200` | served; `/`, `/solar-carport/bangkok/`, `/strategy`, `/solutions` all 200 |
| `acceptance_real_route.py` | route sweep + full fix verification |
| `diagnose_reduced_motion.py` | rAF instrumentation + `<h1>` control |
| `npm test` after partial build | **2 failed / 356 passed** — my doing |
| `npm run build` | 108 prerendered HTML files restored |
| `npm test` + `tsc --noEmit` | **47 files / 358 tests passed**, tsc exit 0 |
| `pkill -f "vite preview --port 5200"` | 0 processes remaining |

## Validation

- Every claim above is an observation from a run in this session against a real build,
  not an inference from reading code.
- The reduced-motion verdict rests on an rAF count, which is a direct observation of
  whether the component is scheduling frames. The screenshot hash, which disagreed, is
  treated as the unreliable signal it turned out to be.
- The bundle comparison built both variants and measured every emitted chunk, so the delta
  is a whole-bundle number rather than an estimate from one file.
- The repair was verified by re-running the full suite, not by assuming `npm run build`
  fixed it.

## Risks

1. **The fixes are verified but not deployed.** Production still carries all three defects
   until `APPROVE_PUSH_TO_MAIN_SIRINX_CO`.
2. **`SolarHeroScene` remains unwired**, so no route exercises it. Its lifecycle tests are
   jsdom only, and it carries a static-Three-import risk that is now fixed but unproven in
   a browser.
3. **`hero-solar-core/` still coexists with `SolarHeroScene.tsx`** — two competing solar
   hero implementations remain in the tree.
4. **`components/Layout.tsx` still has hardcoded motion values**, so flipping the flag would
   leave two motion grammars in the codebase even though the performance argument is now
   empty.
5. Headless Chrome, one machine, no mobile GPU, no Safari, no field data.

## Approval needed

None for this work. No gate was consumed and nothing external was touched.

Open from earlier in the round and unchanged: `APPROVE_PAID_IMAGE_PROVIDER_CALL` (with a
budget cap), `APPROVE_EXTERNAL_LANE_DISPATCH`, `APPROVE_PUSH_TO_MAIN_SIRINX_CO`, and
`APPROVE_MOTION_HOME_ENABLED_TRUE`.

## Next action

1. Commit and release, so the verified fixes stop being theoretical and the production
   defects stop being user-facing.
2. Re-run the production probe after release to confirm the live site passes all three
   checks, not just the local build.
3. Fold the `<h1>` control region and the rAF instrumentation into a standing check, since
   jsdom will keep reporting green either way.
4. Decide `hero-solar-core/`, and tokenise `Layout.tsx`, so the tree is consistent before
   the motion flag is flipped.
