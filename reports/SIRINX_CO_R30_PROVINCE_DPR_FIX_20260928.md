# Report — R30: the province scenes never re-capped their pixel ratio on resize

- Pair: `receipts/SIRINX_CO_R30_PROVINCE_DPR_FIX_20260928.md`
- Lane: jcode (cmux `surface:2`, coordinator) on the Mac mini M2
- Date: 2026-09-28 · Gate consumed: **NONE**
- Origin: found by Lane D (R30-P3), fixed by Lane B

## Summary

Lane D handed over a note rather than a task: *"for whoever picks up the province scenes,
`ProvinceSolarScene.tsx` and `ProvinceYieldChart3D.tsx` cap DPR at creation but not on
resize. That is exactly mutation B."* I checked it, it was true, and I fixed it in both
files with a regression guard that I proved goes red.

The defect is small and it is the kind that survives review because the code looks correct:
the constructor caps the pixel ratio, the resize handler updates the camera and the size,
and the eye reads that as "resize is handled". The pixel ratio is the one thing on that list
that is not a constant.

## The defect, as it was

```ts
// ProvinceSolarScene.tsx:75  and  ProvinceYieldChart3D.tsx:67 — at construction
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ProvinceSolarScene.tsx:283  and  ProvinceYieldChart3D.tsx:223 — on every resize
const onResize = () => {
  const w = host.clientWidth || 640;
  const h = host.clientHeight || 360;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);          // ← aspect and size handled; pixel ratio is not
};
```

`setPixelRatio` appeared exactly once in each file, at construction.

**What actually goes wrong.** `window.devicePixelRatio` changes without a reload when a
window is dragged to a display with a different scale factor, and when browser zoom
changes. The renderer keeps the ratio it was born with. A canvas that started at DPR 1 on
an external 1x display and is then moved to the Retina built-in display renders at half
resolution and looks soft; the reverse renders four times the pixels needed and costs
frame time for nothing. Neither failure throws, neither appears in a console, and neither
is visible in a screenshot taken on a single display.

**How the new component already gets it right.** Lane D's `CarportExplodedDiagram3D.tsx`
re-caps inside `onResize`, because the R30 order requires it:

```ts
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
```

So the repo had a live component following the standard and two shipped ones not following
it. That inconsistency is the finding, not the missing line on its own.

## The fix

One line per file, before `setSize`, with a comment saying why:

```ts
// Re-cap DPR on every resize, not just at construction. Dragging the window
// to a different-DPI display, or changing browser zoom, changes
// window.devicePixelRatio; without this the framebuffer keeps the ratio it
// was born with. Matches CarportExplodedDiagram3D.
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
```

## Red proof

The guard was added to `ProvinceScenes.test.ts` as an `it.each` over both scenes. The
whole file is source-level rather than behavioural, and the new test follows that
convention deliberately — see the limitation below.

```
# fix in place
$ npx vitest run --root . client/src/components/three/ProvinceScenes.test.ts
  Test Files  1 passed (1)
  Tests       7 passed (7)

# revert the fix in ProvinceSolarScene.tsx only
$ npx vitest run --root . client/src/components/three/ProvinceScenes.test.ts
  × province WebGL scenes > re-caps device pixel ratio inside the resize handler for solar scene
    → expected 'const onResize = () => {\n        con…' to match /setPixelRatio\(/
  AssertionError: expected 'const onResize = () => {\n        con…' to match /setPixelRatio\(/
  Test Files  1 failed (1)
  Tests       1 failed | 6 passed (7)

# restore
$ npx vitest run --root . client server shared
  Test Files  48 passed (48)
  Tests       379 passed (379)
$ npx tsc --noEmit
  (no output)
```

The guard extracts the `onResize` body by regex and asserts the cap is inside it, plus
asserts `setPixelRatio` occurs at least twice in the file — once at construction, once in
the handler. Both assertions failed when the fix was reverted, and the failure message
names the defect rather than just the line number.

## The limitation, stated plainly

**This is a source-level guard, not a behavioural one.** It proves the line is present in
the handler body. It does **not** prove that a browser re-renders the canvas correctly at
the new ratio, because jsdom has no WebGL and no real `devicePixelRatio` change to observe.

The behavioural check is **unverified**. To close it: load
`https://www.sirinx.co/solar-carport/bangkok/`, read
`canvas.width / canvas.clientWidth` before and after a DPR change, and confirm the ratio
tracks. That needs either a real browser at two display scales or Chrome's
`Emulation.setDeviceMetricsOverride`, and no lane has run it.

I could have written a real mount test with a mocked three.js, as Lane D did for its own
component. I did not, because the mock setup for these two components is substantially
larger than the fix, and a source guard that is honest about its own scope is better than
a behavioural test I rush. **This is a judgement call and a reader may reasonably disagree
with it.**

## Files changed

| file | change |
| --- | --- |
| `apps/public-web/client/src/components/three/ProvinceSolarScene.tsx` | +5 lines in `onResize` |
| `apps/public-web/client/src/components/three/ProvinceYieldChart3D.tsx` | +5 lines in `onResize` |
| `apps/public-web/client/src/components/three/ProvinceScenes.test.ts` | +28 lines, `it.each` guard for both |
| `reports/` + `receipts/` + sidecars | this report and its receipt |

## Commands run

| command | result |
| --- | --- |
| `grep -n "setPixelRatio\|onResize" Province{SolarScene,YieldChart3D}.tsx` | 1 occurrence each, at construction only |
| `sed -n` on both `onResize` bodies | confirmed no `setPixelRatio` |
| `vitest run ProvinceScenes.test.ts` (fix present) | 7 passed |
| `vitest run ProvinceScenes.test.ts` (fix reverted) | **1 failed \| 6 passed** |
| `vitest run --root . client server shared` (restored) | **48 files / 379 tests passed** |
| `npx tsc --noEmit` | no output |

## Validation

- Lane D's claim was **checked before being acted on**, not taken on trust. It was true.
- The guard was shown red on a real defect and green on the fix, with output quoted.
- The full suite and typecheck were run after the restore, not inferred from the
  single-file run.
- Nothing committed, nothing pushed, no provider call, no secret read.

## Risks

1. **The behavioural half is unverified.** See the limitation section. This is the real
   risk and it is not closed by the passing test.
2. `setPixelRatio` before `setSize` is the correct order — `setSize` multiplies by the
   current ratio, so capping first is what makes `setSize` land on the right framebuffer.
   The order is right, but it is untested behaviourally for the same reason.
3. Two more scenes were not audited for the same class of defect. A repo-wide sweep for
   `setPixelRatio` outside an `onResize` is the natural follow-up and nobody owns it.

## Addendum — the sweep found a third instance, and it was live

The report above fixed the two files Lane D named. Lane D's handover also said the natural
follow-up is a repo-wide sweep, so I ran it rather than leaving it as a suggestion.

```
$ grep -rn "setPixelRatio" apps/public-web/client/src docs/seo | grep -v node_modules
```

| file | occurrences | verdict |
| --- | --- | --- |
| `components/three/ProvinceSolarScene.tsx` | 75, 292 | **fixed above** |
| `components/three/ProvinceYieldChart3D.tsx` | 67, 232 | **fixed above** |
| `components/three/SolarHeroScene.tsx` | 80, 299 | already correct (Lane A's merge) |
| `components/three/CarportExplodedDiagram3D.tsx` | 248, 653 | already correct (Lane D) |
| **`components/SolarCarportViewer.tsx`** | **125 only** | **same defect, and it is live** |
| `client/src/hero-solar-core/hero-solar-core.ts` | 263 only | same defect, but that folder is pending `APPROVE_HERO_DUPLICATE_DELETE` — not touched |
| `docs/seo/province-image-render/scene.mjs` | `setPixelRatio(2)` once | **not a defect.** Build-time static image renderer with no window; a fixed 2 is correct there |

`SolarCarportViewer.tsx` is the one that matters. Its handler is named `resize`, not
`onResize`, which is exactly why a sweep keyed on `onResize` would have missed it. It is
imported and rendered — `pages/SolarCarport.tsx:951` — so the defect was shipping, not
dormant.

Its cap is **1.75, not 2**, and I kept it. That is this scene's own budget: it carries the
BESS enclosure and shadow casting, which is why it was capped lower than the province
scenes. Copying the 2 across would have been a silent perf regression dressed as a fix.

```
// components/SolarCarportViewer.tsx, in `resize`, before setSize
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.setSize(width, height, false);
```

Guard in a new `components/SolarCarportViewer.test.ts`, two assertions — the cap is inside
the handler, and it is applied **before** `setSize`, because `setSize` multiplies by the
current ratio and the order is what makes the framebuffer land correctly.

```
# fix present
  Test Files  1 passed (1)   Tests  2 passed (2)

# fix removed
  × re-caps its own device pixel ratio inside the resize handler
    → expected 'const resize = () => {\n        if (d…' to match /setPixelRatio\(/
  × caps the ratio before setSize, since setSize multiplies by the current ratio
    → expected -1 to be greater than or equal to 0
  Test Files  1 failed (1)   Tests  2 failed (2)

# restored
  Test Files  49 passed (49)   Tests  381 passed (381)   tsc --noEmit clean
```

**Same limitation as above, unchanged and still open:** these are source-level guards. The
browser behaviour across a real DPR change is **unverified** for all three components, and
one passing source test does not make it verified.

## Addendum — a sidecar caught me

After appending to this report, `shasum -c` reported:

```
SIRINX_CO_R30_LANE_AUDIT_AND_DISPATCH_20260928.md: FAILED
shasum: WARNING: 1 computed checksum did NOT match
```

The digest was right. I had appended addenda to that report without re-pinning it. Fixed,
and all eight R30 sidecars now verify.

Worth stating plainly because it is the counter-example to §3 of the main report: the
digest check **did** catch a stale claim, on a file I had just written. The mechanism works
when someone runs it.

## Approval needed

**None.** No gate. Local source change, tests, no commit, no push, no deploy. The
`hero-solar-core/` instance of the same defect was deliberately left alone because deleting
that folder is `APPROVE_HERO_DUPLICATE_DELETE`, and fixing code that is about to be deleted
is not worth a gate.

## Next action

1. A browser check of `canvas.width / canvas.clientWidth` across a DPR change closes the
   behavioural gap. Cheap, and nobody has claimed it.
2. Sweep the repo for other `setPixelRatio` calls that only happen at construction.
