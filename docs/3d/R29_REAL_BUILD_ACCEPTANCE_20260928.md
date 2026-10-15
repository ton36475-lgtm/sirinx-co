# R29 acceptance on the real build — corrections and final result (2026-09-28)

Supersedes the harness-based verification for acceptance purposes. The harness proved the
components behave correctly **in isolation**; this is the shipped route.

## What the real path showed

Built with `vite build`, served with `vite preview`, driven with Playwright + Chrome 154.

**Route sweep — the project's public interface:**

| route | status | canvases | WebGL | page errors |
| --- | --- | --- | --- | --- |
| `/` | 200 | 1 | `[true]` | none |
| `/solar-carport/bangkok/` | 200 | 2 | `[true, true]` | none |
| `/strategy` | 200 | 0 | — | none |
| `/solutions` | 200 | 0 | — | none |

**Context loss and recovery, on the real route — PASS:**

```
c0:lost, c1:lost, c0:restored, c1:restored
before        OK, OK       fallback: none
after-loss    LOST, LOST   fallback: "ไม่สามารถแสดงกราฟสามมิติได้ในอุปกรณ์นี้" (both canvases)
after-restore OK, OK       fallback: cleared
```

**Text alternative, on the real route — PASS.** Both canvases are `aria-hidden="true"` and
resolve `aria-describedby` to real content: the yield chart to
`yield-description-bangkok` quoting the 77-province comparison, the solar scene to
`solar-description-13.7525-100.49416667` quoting sun elevation and azimuth.

## Correction: reduced motion passes, and my first real-route reading was a false alarm

The first acceptance run reported the canvases as still animating under
`prefers-reduced-motion`, contradicting the harness. Taken at face value that would mean
the fix does not hold on the shipped route.

**It does hold.** The difference is how it was measured, and the resolution is a control:

| | normal | reduced-motion |
| --- | --- | --- |
| `requestAnimationFrame` calls in 2 s | **274** | **0** |
| canvas-clipped hash changed | true | true |
| **static `<h1>` control region changed** | **true** | **true** |

The 3D schedules **zero** animation frames when reduced motion is on. The canvas rectangle
changes because **page-level motion moves pixels inside that bounding box** — and the
control proves it, because plain static `<h1>` text changed too.

**A screenshot-hash test of a canvas is only meaningful alongside a static control region.**
Without the `<h1>` control I would have reported a working fix as broken, and someone would
have gone to "fix" a fix. This is the sixth time this round that a plausible-looking proxy
measurement gave a wrong answer. The rAF count is the ground truth here; the hash was not.

## Bundle cost, measured in a real build — the gap I flagged is now closed

Earlier I recorded that the production **bundle delta** had not been measured and that it
was the thing that would decide the motion flag. It has now been measured, both variants
built and compared:

| | total JS (91 chunks) |
| --- | --- |
| flag off | 5162.0 kB raw / 1004.4 kB gzip |
| flag on | 5162.5 kB raw / 1004.6 kB gzip |
| **delta** | **+0.5 kB raw / +0.2 kB gzip** |

Essentially zero, and the reason is structural: `vendor-motion-BsD3OiIS.js` (123.6 kB,
40.4 kB gzip) is **already in the shipped bundle regardless of the flag**, because 13 other
pages import `framer-motion` directly. Every visitor is already paying for it. Home not
using it costs nothing extra, and Home using it costs nothing extra.

Combined with the earlier runtime result (median LCP delta +4 ms desktop, +8 ms mobile,
CLS unchanged), **the objection to enabling motion on the homepage is now measured empty
on both axes — runtime paint cost and bundle cost.**

## A mistake I made, and its honest consequence

To measure the bundle I ran `rm -rf dist/public` followed by `npx vite build` alone. That is
a **partial build** — the project's real build also runs `server/staticSeoBuild.ts`, which
produces the prerendered HTML. Deleting the output turned
`shared/crawlReachability.test.ts` red, because that test walks the real `<a href>` graph
in `dist/public`.

The suite went to **2 failed / 356 passed** and stayed there until I ran the full
`npm run build`, restoring 108 prerendered HTML files. Final state: **47 files / 358 tests
passed, `tsc --noEmit` exit 0**, flag restored to `false`.

Two things worth keeping from this:

1. **`npm test` is not a pure source check.** It has a hidden dependency on a full build
   being present. Anyone who runs a partial build will get a red suite that has nothing to
   do with their change, and the failure message points at crawl links, not at the build.
2. I should have run `npm run build` rather than reaching for `npx vite build`. The build
   step is not interchangeable with the build-plus-prerender step, and the difference is
   invisible until a test that reads the output fails.

## State after all of this

- `MOTION_HOME_ENABLED = false` — verified by file read, and by `motionFlags.test.ts`.
- 47 files / 358 tests passing, `tsc --noEmit` exit 0.
- Dev and preview servers stopped, 0 processes remaining.
- Nothing committed, nothing pushed, no gate consumed.

## Still true

- `hero-solar-core/` still coexists with `SolarHeroScene.tsx`.
- `components/Layout.tsx` still has hardcoded motion values.
- The three fixes are verified on the real build but **not deployed**; production still
  carries the original defects until `APPROVE_PUSH_TO_MAIN_SIRINX_CO`.
- `SolarHeroScene` remains unwired, so it is still unexercised by any route.
