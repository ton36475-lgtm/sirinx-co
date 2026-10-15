# R30-P3 · ILLUSTRATION DELIVERY ON THE REAL ROUTES

```
package:  R30-P3 (Concept C)   lane: D (hermes, Mac mini M2)
route:    /solar-carport
date:     2026-09-28
status:   done · red_proof: yes (3 mutations, all recorded below)
gates:    none consumed
```

---

## 1. What is on disk

| file | state | what it is |
| --- | --- | --- |
| `apps/public-web/client/src/components/three/CarportExplodedDiagram3D.tsx` | **new** | the 3D exploded technical diagram |
| `apps/public-web/client/src/components/three/CarportExplodedDiagram3D.test.tsx` | **new** | 18 tests, real mount against a mocked three.js |
| `apps/public-web/client/src/pages/SolarCarport.tsx` | edited | `lazy()` import + one section, product page only |
| `apps/public-web/client/src/i18n/pages/solarCarport.ts` | edited | 3 new copy keys (th/en/cn), nothing existing touched |

No other file was touched. `SolarHeroScene.tsx`, `HeroSlideshow.tsx` and
`pages/Home.tsx` were read and **not** edited. No commit, no push, no deploy.

## 2. The slot

`docs/media/ILLUSTRATION_COVERAGE_20260928.md` §2 puts **3D exploded technical
diagram (Concept C)** at Priority 1 on `/solar-carport`, and §1 says the route
already had `SolarCarportViewer` and `ProvinceSolarScene` but "ต้องการ Exploded
Diagram แสดงชั้นโครงสร้าง C-Channel". That gap is now filled.

What it draws: the carport separates into its seven real installation layers —
foundation, steel columns, rain gutter, inverter and control cabinet, main
beams, mounting rails, PV module array — on a 9-second breath between assembled
and fully exploded, with a slow orbit and drag-to-look. The key light sweeps
the real sun azimuth and elevation between the real sunrise and sunset, so the
scene is lit by the site's own astronomy rather than by a decorative preset.

The other slots were **not** touched:

- `/` (Concept A) — `SolarHeroScene` already covers the 3D half, and another
  lane owns that file. No second hero was started.
- `/strategy` (Concept B) and `/solutions` (Concept D) — untouched. See §8.

## 3. Every number is computed, not typed

The order requires that every figure in the text alternative is read from
`shared/provinceEnergyData.ts` or `shared/sunMath.ts`. The component takes a
province `slug` and looks the record up itself, so the caption cannot drift from
the dataset. For the HQ reference province on `/solar-carport`
(`phitsanulok`, the same record the page already uses for its viewer):

| figure | value | where it comes from |
| --- | --- | --- |
| latitude / longitude | 16.826 / 100.26 | `provinceEnergyData.ts` |
| global horizontal irradiation | 4.97 kWh/m²/day | `provinceEnergyData.ts` |
| specific yield | 1338.7 kWh/kWp/year | `provinceEnergyData.ts` |
| **panel tilt** | **20.09°** | **derived** — 90° minus the mean solar-noon elevation of the two equinoxes and two solstices at those coordinates, via `sunMath.solarPosition` |
| June-solstice noon elevation | 83.39° | `sunMath.solarPosition` |
| sunrise / sunset (equinox) | 06:30 / 18:24 local | `sunMath.daylightWindow` |

The tilt derivation is in `seasonalTiltDeg()`, and the test recomputes the same
quantity independently from `solarPosition` on a different scan step (5 minutes
instead of 4) and compares. It is not asserted against itself.

The panel tilt is honestly framed in the caption as *derived from the seasonal
mean noon sun*, not as a manufacturer's recommendation, and the figure carries
"ภาพจำลองเพื่ออธิบายโครงสร้าง ไม่ใช่แบบก่อสร้างจริง" (a visualization to explain the
structure, not a construction drawing).

## 4. House-standard contract, item by item

| requirement | how it is met | where it is checked |
| --- | --- | --- |
| dynamic `import()`, never a static three entry | `void import("three")`; the only `three` import is `import type` | real build (§6) + test |
| DPR capped at 2, re-capped on resize | `Math.min(dpr, 2)` at creation **and** inside `onResize` | test, mutation B |
| rAF paused on `document.hidden` | `visibilitychange` listener + a `document.hidden` guard inside `schedule()` | test, mutation C |
| rAF paused offscreen | `IntersectionObserver` with `threshold: 0.05` | test |
| `webglcontextlost` handled, `webglcontextrestored` recovers, text in between | both listeners, `role="status"` fallback | test |
| `dispose()` idempotent, geometry + material + texture + renderer | `scene.traverse` release, guarded by a per-resource `Set`, plus a texture sweep | test, mutation A |
| `prefers-reduced-motion` → exactly one static frame | one `render()` call, frozen fully exploded, zero frames queued | test |
| canvas `aria-hidden` + real text alternative via `aria-describedby` | canvas hidden, `<p lang="en">` description linked by id | test |
| alt text citable, numbers read from the dataset | see §3 | test |
| tests go red on a real defect | see §5 | — |

Two places where this component is stricter than the existing house components,
both deliberate:

1. `ProvinceSolarScene.tsx` and `ProvinceYieldChart3D.tsx` cap DPR at creation
   but **not** on resize. The diagram re-caps. That is what mutation B proves.
2. Those two call `window.matchMedia(...)` unguarded. jsdom 24 does not implement
   `matchMedia`, which is how the missing guard was found here; the diagram uses
   the optional form already used by `SolarHeroScene`, so an engine without it
   animates rather than throwing into a swallowed `catch`.

The diagram does **not** use `OrbitControls`. A hand-rolled pointer-drag orbit
keeps `three/examples/jsm` out of the chunk and keeps the whole lifecycle
disposable from one place. That is a deviation from the sibling components and
is recorded here rather than hidden.

## 5. Red proof

The component was mutated three times. Each mutation was reverted and the suite
re-run. Nothing below is a description of a failure; all three are captured
output.

### Baseline before the work

```
$ npx vitest run --root . client server shared
 Test Files  47 passed (47)
      Tests  359 passed (359)
```

### Mutation A — shared material released twice (the defect the suite found first)

Edit: `release(m as Material)` back to `(m as Material).dispose()` in
`disposeGpuResources`, i.e. the gutter material and the inverter material, each
shared by two meshes, get a second `dispose()` on the same GPU resource.

```
 ❯ client/src/components/three/CarportExplodedDiagram3D.test.tsx (17 tests | 1 failed) 98ms
   × carport exploded diagram: WebGL budget > disposes geometry, material and renderer exactly once, even unmounted twice 6ms
     → expected "spy" to be called 1 times, but got 2 times

 FAIL  client/src/components/three/CarportExplodedDiagram3D.test.tsx > carport exploded diagram: WebGL budget > disposes geometry, material and renderer exactly once, even unmounted twice
AssertionError: expected "spy" to be called 1 times, but got 2 times
 ❯ client/src/components/three/CarportExplodedDiagram3D.test.tsx:545:54
```

This one is worth calling out: **the suite found a real defect in my own code
before the red proof started.** The first version of `disposeGpuResources`
disposed the same material twice. It was fixed with a per-resource `Set`, and
mutation A is the revert that proves the test still guards it.

### Mutation B — DPR cap dropped on resize

Edit: `renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))` →
`renderer.setPixelRatio(window.devicePixelRatio || 1)` in `onResize`. This is
exactly the bug that is still present in the two province scenes.

```
 ❯ client/src/components/three/CarportExplodedDiagram3D.test.tsx (17 tests | 1 failed) 98ms
   × carport exploded diagram: WebGL budget > caps DPR at 2 and re-applies the cap on resize 8ms
     → expected last "spy" call to have been called with [ 2 ]

- Expected
+ Received
  Array [
-   2,
+   3,
  ]
```

The first `toHaveBeenCalledWith(2)` still passes — it is the mount. Only the
`toHaveBeenLastCalledWith(2)` after `resize` fails, which is the point: the
assertion distinguishes the initial cap from the re-cap.

### Mutation C — `document.hidden` guard removed from the scheduler — and the gap it exposed

First attempt: edit `schedule()` to drop `!document.hidden`. The suite stayed
**green**. That is a real gap in my test, not a false green in the code: after
`stop()` no frame is queued, so `schedule()` is never reached again while the tab
is hidden, and the existing test could not see the difference.

The gap was closed by adding a test for the combination that actually matters —
a backgrounded tab that scrolls the diagram back into view:

```
it("does not restart from an intersection callback while the tab is in the background", ...)
```

Green on correct code with the new test (18 passed), then the same mutation
re-applied:

```
 ❯ client/src/components/three/CarportExplodedDiagram3D.test.tsx (18 tests | 1 failed) 101ms
   × carport exploded diagram: WebGL budget > does not restart from an intersection callback while the tab is in the background 7ms
     → expected 1 to be +0 // Object.is equality

- Expected
+ Received

- 0
+ 1

 ❯ client/src/components/three/CarportExplodedDiagram3D.test.tsx:526:32
    526|     expect(pendingFrames.size).toBe(0);
```

### Restored

```
$ npx vitest run --root . client/src/components/three/CarportExplodedDiagram3D.test.tsx
 ✓ client/src/components/three/CarportExplodedDiagram3D.test.tsx (18 tests) 109ms
 Test Files  1 passed (1)
      Tests  18 passed (18)

$ npx vitest run --root . client server shared
 Test Files  48 passed (48)
      Tests  377 passed (377)

$ npx tsc --noEmit
(no output)
```

Baseline was 47 files / 359 tests. Now 48 / 377: one new file, 18 new tests, no
existing test touched, no existing test broken.

## 6. Real build proof that three.js is not in an entry chunk

Not a source inspection — an actual production build, written to a scratch
directory so no lane's `dist/` was touched:

```
$ npx vite build --outDir "$JCODE_SCRATCH_DIR/p3build" --emptyOutDir
$ grep -o '<script[^>]*>' index.html
<script type="module" crossorigin src="/assets/index-D3858AEn.js">
$ grep -c "three.module" index-D3858AEn.js
0
$ ls -laS assets/*.js | head -3
2930734  ProvinceLongform-Tr40_zUY.js
 746766  three.module-Dljb2UHm.js
 237851  vendor-react-BfAccxxP.js
$ wc -c assets/CarportExplodedDiagram3D-*.js
12612 CarportExplodedDiagram3D-BgzfWEk2.js
$ grep -o 'import("[^"]*three[^"]*")' assets/CarportExplodedDiagram3D-*.js
import("./three.module-Dljb2UHm.js")
```

The entry chunk is a single 120,824-byte script with **zero** references to
`three.module`. Three.js is a separate 746,766-byte chunk that the 12,612-byte
diagram chunk reaches only through a dynamic import. `SolarCarport` itself is a
132,716-byte lazy chunk that the entry does not pull in either.

No LCP claim is made here. The R29 measurement
(`docs/media/WEBGL_PERF_BUDGET_20260928.md`) predates this work and was not
re-measured; the diagram is below the fold, lazily loaded, and pauses itself
offscreen, but nobody has measured its effect and this report does not guess.

## 7. The 18 tests, in one place

Lazy chunk and data binding: no static three import in the source **and** the
page must reach the component through `lazy()` (fails if someone swaps it for a
static import); the caption quotes the province's own PVGIS record and the
derived tilt; the tilt matches an independent recomputation from `solarPosition`
and rises with latitude; the daylight window is ordered and in range; a province
with no PVGIS record renders no canvas and no figure at all.

Structure: seven layer groups, indexed 0–6, none empty, named in installation
order; unique explode offsets with the foundation at zero; the explode curve
stays inside 0..1, touches both ends, and returns to 0 after a full cycle; the
module layer really rises on a driven clock while the foundation does not move.

WebGL budget: DPR capped at 2 and re-capped on resize; frames stop when the
document is hidden and resume when it returns; frames stop offscreen and resume
on intersection; a hidden tab is not restarted by an intersection callback;
reduced motion renders exactly one frame, fully exploded, with zero frames
queued; context loss shows text and restore removes it and repaints; every
geometry and material is disposed exactly once even when the root is unmounted
twice; the canvas is `aria-hidden` and its description is reachable by id and
carries the province name, the specific yield and the honesty clause; the legend
has one row per layer with the exact colour the geometry uses.

## 8. What was not done, and why

- **`/strategy` (Concept B) not started.** One slot was the floor and the P1 slot
  is the one the order ranks highest. A second component plus a second red proof
  was a larger commitment than the remaining budget allowed, and a half-built
  hologram scene with an unproven test is worse than none. The slot is open.
- **`/solutions` (Concept D)** is a product photograph, not a scene. It needs a
  generated bitmap, which is out of scope for this package and belongs to the
  R30-P4 prompt pipeline.
- **`/` (Concept A)** deliberately untouched. `SolarHeroScene` covers the 3D
  half and another lane owns that file.
- **No LCP/CLS re-measurement** after the change. R29's numbers are still the
  last measured state of the site and this report does not pretend otherwise.
- **The i18n file was edited.** The order's ownership is "the new 3D components
  and pages named in §4". Three additive keys in
  `client/src/i18n/pages/solarCarport.ts` were the price of not hardcoding Thai
  copy in the page. No existing key was changed.

## 9. Gates

None requested, none consumed. No push, no deploy, no provider call, no install,
no secret read.

---

network: none · provider_calls: 0 · install: false · secrets_read: false · deploy: false
