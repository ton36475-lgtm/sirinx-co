# HERO_DUPLICATE_DECISION — R30-P1 (Lane A) · 2026-09-28

- Order: `docs/media/ORDINER_SIRINX_CO_ILLUSTRATION_R30_20260928.md` §3 (R30-P1)
- Lane A · package R30-P1 · host freebuff in cmux
- Verdict: **MERGE — the 1,200-point solar dust flow only. Delete the rest, and only under
  `APPROVE_HERO_DUPLICATE_DELETE`.**
- Nothing was deleted by this lane. No gate was consumed.

```
components/three/SolarHeroScene.tsx   + test   wired: HeroSlideshow.tsx:9 (React.lazy) → :343
client/src/hero-solar-core/           4 files  untracked · 0 importers · 404 in production
```

`hero-solar-core/` is untracked, so it never appears in a `git status` skim, and it is the
first thing a `git clean -fd` destroys. It is invisible to production: no module imports
it, and `hero-preview.html` is not a Vite entry, so it is not emitted at all.

## 1. What each implementation actually does

Read from source, not inferred. Sizes measured on disk; bundle figures measured from a
real `vite build` of this tree (see §5).

| | `SolarHeroScene.tsx` (wired) | `hero-solar-core/` (unwired) |
| --- | --- | --- |
| Files | 1 component + 1 test, 338 lines, 13.1 KB source | 4 files: `hero-solar-core.ts` 10,181 B · `solar-core.css` 2,912 B · `hero-preview.html` 6,601 B · `README.md` 638 B |
| Technique | React function component; `useEffect`; mounted through `React.lazy` and `Suspense` | Imperative class `SolarEnergyCore(container, opts)`, `start()` / `dispose()`; the demo page re-implements the same scene inline |
| three.js load | `void import("three")` inside the effect — three stays in its own chunk | **static `import * as THREE from "three"`** at module top |
| Shader | shared `EnergyFlowShaderDef` (`EnergyFlowShader.ts`) on 8 conduit cylinders; core uses `MeshStandardMaterial` wireframe (no custom vertex stage) | own GLSL pair: vertex distortion wave (`sin/cos` lobes on `position × normal`) + Fresnel-rim fragment; wireframe `IcosahedronGeometry(2, 64)` ≈ 84,500 triangles |
| Particle count | 0 before R30-P1 → **1,200 after** | 1,200 `THREE.Points`, CPU position loop, fixed 16 ms step |
| Draw calls | 8 conduits (shared geometry/material) + 1 core (+1 Points after merge) | 1 core + 1 Points |
| Lifecycle | IntersectionObserver (threshold 0.05) pauses offscreen · `visibilitychange` pauses · `webglcontextlost` handled, `restored` recovers · DPR capped at 2 and re-capped on resize · dispose idempotent (`disposed` + `resourcesDisposed` guards) · renderer, geometries, materials disposed, canvas removed | resize listener + `visibilitychange`; **no offscreen pause**; **no context lost/restored handling** · DPR capped at 2 and re-capped on resize · `dispose()` idempotent, disposes lights/geometries/materials/renderer and detaches the canvas |
| a11y | canvas `aria-hidden="true"`; container `role="img"` + `aria-label="Decorative animated solar energy visualization"` | **none** — canvas appended with no `aria-hidden`, no role, no accessible name |
| Reduced motion | exactly one static frame (`if (reduceMotion) animate()`), no rAF scheduling, no mouse listener | **not implemented** — `@media (prefers-reduced-motion: reduce)` only removes a CSS transition; the rAF loop keeps running and the core keeps rotating |
| Test coverage | `SolarHeroScene.test.tsx`, **8 tests** (7 pre-existing + 1 added by this merge). 5 of the 7 behavioural, 3 assert on source text (`/visibilitychange/`, `/isVisible/`, `/webglcontextlost/`) — see §6 for why that is weak | **0 tests**. No file in the repo imports or tests it |
| Bundle cost today | own lazy chunk: `SolarHeroScene-*.js` **7,059 B min / 3,130 B gzip** (post-merge) | **0 B** — unreferenced, and not a build entry. Would add a static three dependency (746,766 B / 190,351 B gzip as built) to whichever chunk imported it statically |
| Other | header claimed "Gyroscope lerp damping" that was never implemented (fixed in this merge) | hardcoded brand hexes bypassing the token system; hardcoded marketing copy absent from the i18n catalog (HeroSlideshow uses `t(...)` keys) |

## 2. Verdict and reasons

**MERGE the solar dust flow into `SolarHeroScene.tsx`. Then retire `hero-solar-core/`.**

The merge is one feature deep. It is not a port of the folder; it is the transfer of the
single thing in it that has no counterpart anywhere in the repo, and every other file in
the folder is rejected with a reason below.

### 2.1 What moves, and why each earns its bytes

| Moved | Why it earns its bytes |
| --- | --- |
| 1,200-point solar dust flow (`THREE.Points`, additive, `sizeAttenuation`) | It is the only unique visual in the folder: `grep` over `client/src/components/three/` finds **zero** `Points`/particle code anywhere else, so deleting it loses the visual outright. The art-engineering brief already declares it as the hero's budgeted asset — "Particles (hero) ~1,200" in `docs/media/ART_ENGINEERING_BRIEF_20260928.md` §8 — and deleting would leave that documented row describing a module that no longer exists. Measured cost: **+570 B min / +259 B gzip** on a lazy chunk, with the shared three chunk **byte-identical** before and after and the entry chunk untouched. |

Two behaviour changes came with the port, both deliberate and both a fix rather than a
regression:

1. The source stepped a hardcoded `0.45 * 0.016` per frame, so the drift ran at double
   speed on a 120 Hz display. The merged loop uses the frame delta, clamped at 0.1 s.
2. The drift is inside the `!reduceMotion` branch, so `prefers-reduced-motion` still
   yields exactly one static frame, as the R29 contract requires.

### 2.2 What does not move, and why

| Rejected | Reason it does not earn its bytes |
| --- | --- |
| Distortion / Fresnel core shader | A look change, not a capability. The core already renders through `MeshStandardMaterial` under the ambient + key light and the conduits already carry `EnergyFlowShader`; the swap adds a **second GLSL program per hero** (second compile, second thing to keep in sync) for a re-skin no route, brief or ticket has asked for. |
| `solar-core.css` | Styles a `.hero-solar` section that no route renders. Home/HeroSlideshow owns its own layout and Tailwind styling; importing it would introduce a second styling layer and hardcoded brand hexes that bypass the token system. |
| `hero-preview.html` | A fork of the class with the shaders and scene pasted inline, so it drifts from anything merged (its particle step is already a literal `0.0072`). It also carries marketing copy that is not in the i18n catalog. As a `client/src/*.html` it is not a Vite entry, so it ships nowhere and tests nothing. |
| The `SolarEnergyCore` class and its options API | Duplicates the React lifecycle the wired component already implements, and as written breaches four R29 hard requirements (static three import, no reduced-motion frame, no context-loss recovery, no offscreen pause, and no a11y). Adopting it would be a rewrite, not a merge. |
| `IcosahedronGeometry(2, 64)` for the core | ≈84,500 wireframe triangles for a shape the live scene renders at detail 4. A vertex-cost increase with no stated purpose. |

### 2.3 What is lost when `hero-solar-core/` is deleted

- The distortion/Fresnel core look, and the standalone demo page — both recorded in the
  table above and both reproducible from that description if a future round wants them.
- A second, unused stylesheet.
- Nothing else. The particle flow is merged, so no unique, wanted behaviour is dropped.

Deletion itself is **not this lane's action**. It is gated on
`APPROVE_HERO_DUPLICATE_DELETE`, and the folder is still on disk, unchanged, as of this
report.

## 3. The merged change (what is on disk)

`apps/public-web/client/src/components/three/SolarHeroScene.tsx`, sha256
`3e8817dc252f44efcd4341bdd12ddac8a2c96e9e5fde868cc70e871286dc69f3`:

1. module constants for the flow (`PARTICLE_COUNT = 1200`, wrap span ±7, spreads 14/10,
   fall speed 0.45), taken from the source module's tuning;
2. the `THREE.Points` build — geometry from a 14.4 KB `Float32Array`, additive cyan
   (`0x00f0ff`, the same value as `flowUniforms.uColorGlow`, so no new palette token);
3. the per-frame fall loop in `animate()`, frame-delta driven, inside the existing
   `!reduceMotion` branch;
4. `disposeGpuResources()` now matches `THREE.Points` as well as `THREE.Mesh` — without
   that, the 1,200-point geometry and material survive unmount as a GPU leak;
5. the false "Gyroscope lerp damping" claim in the header comment corrected to
   "mouse-parallax camera drift", since no gyroscope code exists.

`apps/public-web/client/src/components/three/SolarHeroScene.test.tsx` was also edited —
**this is a declared deviation from the §2 ownership list.** The merge cannot be done
inside the ownership grant alone: the existing test mocks `three` with a fixed class list,
so the new `Points` / `BufferGeometry` / `BufferAttribute` / `PointsMaterial` paths hit the
mock, throw inside the dynamic import, and are swallowed by the component's
`.catch(() => setIsSupported(false))` — every test in that file goes red. The file edited is
that component's own test, it is untracked R29 work owned by no other lane, and the DoD
requires a red proof that only exists if the merged feature is covered. Change: three
classes added to the mock, one test added.

## 4. Red proof — the test can go red, and was seen to

Run from `apps/public-web` against the merged tree.

**Mutation A — remove `Points` from `disposeGpuResources`:**

```
- if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
+ if (obj instanceof THREE.Mesh) {
```

```
× SolarHeroScene lifecycle > adds the merged solar dust flow and releases its buffers on unmount
  → expected "spy" to be called 1 times, but got 0 times
  Tests  1 failed | 7 passed (8)
```

**Mutation B — break `dispose()` in cleanup (delete `renderer.dispose();`):**

```
× SolarHeroScene lifecycle > disposes renderer and GPU resources on unmount, idempotently
  → expected "spy" to be called 1 times, but got 0 times
  Tests  1 failed | 7 passed (8)
```

Both mutations are real defects (a retained GPU buffer; a retained renderer), not a
changed assertion. After each run the source was restored by copying the pre-run file back
and confirmed by sha256. The mutation runs were made against
`c60e0e30a24d4aa4eb36e68ffc8a47f36389d46b191332099550dbed0d158703`; the final file is
`3e8817dc252f44efcd4341bdd12ddac8a2c96e9e5fde868cc70e871286dc69f3`, one comment line later
(“retired” → “duplicate”, because the folder is not deleted yet). That one-line change was
followed by a green focused run (8/8), a clean `tsc --noEmit`, and a green full suite.

## 5. Green state and measured bundle cost

| Check | Command (from `apps/public-web`) | Result |
| --- | --- | --- |
| Types | `pnpm exec tsc --noEmit` | exit 0 |
| Tests | `pnpm vitest run --root . client server shared` | **47 files / 359 tests pass** (R29 baseline: 47 / 358), re-run green after the final comment edit |
| Real build | `pnpm build` (vite build + `tsx server/staticSeoBuild.ts` + esbuild) | exit 0, prerendered pages regenerated |

Chunk measurements from those builds:

| Artifact | With the flow | Without it | Delta |
| --- | --- | --- | --- |
| `SolarHeroScene-*.js` (lazy hero chunk) | 7,059 B min / 3,130 B gzip | 6,489 B min / 2,871 B gzip | **+570 B / +259 B gzip** |
| `three.module-*.js` (shared, imported by 6 lazy consumers) | 746,766 B / 190,351 B gzip | 746,766 B / 190,351 B gzip | 0 B — byte-identical chunk |
| Entry chunk (`index-*.js`) | imports `vendor-react` + `vendor-data` only | same | 0 B |

The "without it" build was produced by deleting only the two merged blocks from the same
file, so the delta isolates the flow. The entry chunk never reaches the three chunk — the
hero arrives through `React.lazy(() => import("./SolarHeroScene-*.js"))` in
HeroSlideshow — so the merge adds nothing to first paint and nothing to LCP.

## 6. Not verified

- **No real-browser render of the merged hero.** Playwright/puppeteer are not installed on
  this host and `~/Library/Caches/ms-playwright` is empty; installing a browser stack is an
  install and needs its own approval. A direct headless-Chrome attempt against the built
  site on `127.0.0.1:8123` aborted before dumping the DOM
  (`CVDisplayLinkCreateWithCGDisplay failed. CVReturn: -6670`). **The fact that the merged
  scene compiles, type-checks, passes its tests and lands in a real build is verified; that
  it *looks* right on `/` is not.**
- **The particle field's appearance on the wired route is unverified.** The visual was
  authored inside a different camera (fov 55, z 6); the receiving scene is fov 45 at z 8.5,
  so the ±7 wrap span is wider than the frustum and particles drift through rather than
  filling the frame. The source tuning was preserved deliberately, but nobody has looked at
  it on the real page.
- **Three of the seven pre-existing tests are source-text assertions** (`expect(source).toMatch(...)`)
  rather than behavioural ones, so "tests pass" overstates coverage for offscreen pause,
  hidden-tab pause and context loss. Not fixed here: tightening them is a change to the
  same file outside this package's stated scope, and it is worth its own package.
- The 7 pre-existing tests are not a substitute for the R29 acceptance run; that record is
  `docs/3d/R29_REAL_BUILD_ACCEPTANCE_20260928.md`.

## 7. Gate status

| Gate | State |
| --- | --- |
| `APPROVE_HERO_DUPLICATE_DELETE` | **not consumed.** The folder is untouched. The merge verdict means the unique part is now preserved inside the wired component, so this gate can be granted without losing work — but the delete is the issuer's call. |
| every other R30 gate | not consumed |

## 8. Side effects

```
network: localhost only (python3 -m http.server on 127.0.0.1:8123 for one headless-Chrome
         attempt against the local build; no external request, both processes stopped)
provider_calls: 0 · install: false · secrets_read: false · deploy: false
commit: none · push: none · git clean/checkout/stash/reset: none · delete: none
build artifacts: apps/public-web/dist/** regenerated (gitignored)
```

One incident, recorded because it is mine: a bare `vite build` in this tree **wipes**
`dist/public` (`emptyOutDir: true` in `apps/public-web/vite.config.ts`), which destroyed the
prerendered province pages and failed the two pre-existing tests in
`shared/crawlReachability.test.ts` (they crawl the built HTML, not the source). The full
`pnpm build` was then run, which regenerates the prerendered output via
`server/staticSeoBuild.ts`; the suite is back to 47 files / 359 tests green. Nothing
outside `dist/` was affected and `dist/` is gitignored. Anyone running a bare
`vite build` in this repo will reproduce that failure.
