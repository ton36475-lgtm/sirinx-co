# Report — R30-P1 solar hero duplicate resolution (2026-09-28)

- Pair: `receipts/SIRINX_CO_R30_P1_HERO_DUPLICATE_20260928.md`
- Lane A (freebuff in cmux) · package **R30-P1** · order `docs/media/ORDINER_SIRINX_CO_ILLUSTRATION_R30_20260928.md` §3
- Deliverable: `docs/3d/HERO_DUPLICATE_DECISION_20260928.md` — **written**
- Gate consumed: **NONE**. Nothing deleted, nothing committed, nothing pushed, nothing deployed.

## Verdict

**MERGE — the 1,200-point solar dust flow only — then retire `hero-solar-core/` under
`APPROVE_HERO_DUPLICATE_DELETE`.**

`hero-solar-core/` holds exactly one thing with no counterpart in the repo: the particle
flow. `grep` over `client/src/components/three/` finds no `Points` or particle code
anywhere else, and the art-engineering brief §8 already budgets "Particles (hero) ~1,200"
against this module. It was ported. Everything else in the folder was rejected with a
recorded reason: the distortion/Fresnel core shader (a look change that adds a second GLSL
program per hero), `solar-core.css` (styles a `.hero-solar` section no route renders, with
hardcoded brand hexes), `hero-preview.html` (an inline fork of the class that will drift,
carrying non-i18n copy, shipping nowhere), the `SolarEnergyCore` class itself (duplicates
the React lifecycle and breaches four R29 requirements as written), and the
`IcosahedronGeometry(2, 64)` core (~84,500 wireframe triangles for a shape the live scene
renders at detail 4).

## Files touched

| File | Status |
| --- | --- |
| `docs/3d/HERO_DUPLICATE_DECISION_20260928.md` | owned deliverable, new |
| `apps/public-web/client/src/components/three/SolarHeroScene.tsx` | owned if verdict is merge — merged, sha256 `3e8817dc252f44efcd4341bdd12ddac8a2c96e9e5fde868cc70e871286dc69f3` |
| `apps/public-web/client/src/components/three/SolarHeroScene.test.tsx` | **declared deviation from the §2 ownership list** — see below |
| `apps/public-web/dist/**` | build artifacts, gitignored, regenerated (see incident) |
| `reports/`, `receipts/` pair + sidecars | this report |

**Deviation.** The package grants edits to `SolarHeroScene.tsx` only. The merge could not
be completed inside that grant: the existing test mocks `three` with a fixed class list, so
the new `Points` / `BufferGeometry` / `BufferAttribute` / `PointsMaterial` paths hit the
mock, throw inside `import("three")`, and are swallowed by the component's
`.catch(() => setIsSupported(false))` — every test in the file goes red. The file edited is
that component's own test (4 mock classes added, 1 test added), it is untracked R29 work no
other lane owns, and the DoD's red-proof requirement only exists if the merged feature is
covered. Flagged here rather than hidden.

## Red proof — yes (two mutations, both observed)

- Remove `Points` from `disposeGpuResources` → new test red:
  `expected "spy" to be called 1 times, but got 0 times` — `1 failed | 7 passed (8)`.
- Delete `renderer.dispose();` from cleanup → pre-existing dispose test red:
  `expected "spy" to be called 1 times, but got 0 times` — `1 failed | 7 passed (8)`.
- Both mutations are real defects (retained GPU buffers; retained renderer). Source restored
  after each run and sha256-verified: the mutation runs were made against
  `c60e0e30…58703`, and the final file is one comment line later at `3e8817dc…c69f3`, after
  which the focused run (8/8), `tsc` and the full suite (47 / 359) were green again.

## Green state

- `pnpm exec tsc --noEmit` — exit 0.
- `pnpm vitest run --root . client server shared` — **47 files / 359 tests pass** (R29
  baseline 47 / 358; the +1 is the merged feature's test), re-run green after the final
  comment edit.
- `pnpm build` — exit 0; prerendered pages regenerated.
- Measured cost of the merge: hero lazy chunk 6,489 → 7,059 B min (2,871 → 3,130 B gzip);
  the shared three chunk is byte-identical (746,766 B / 190,351 B gzip); the entry chunk
  imports only `vendor-react` + `vendor-data` and never reaches three.

## Unverified (stated, not papered over)

- **No real-browser render.** Playwright/puppeteer are not installed here and
  `~/Library/Caches/ms-playwright` is empty; installing a browser stack needs its own
  approval. A direct headless-Chrome attempt against the local built site aborted before
  dumping the DOM (`CVDisplayLinkCreateWithCGDisplay failed`). Compiles, type-checks, tests
  green, present in a real build — but **how it looks on `/` is not verified**.
- The particle field was authored for another camera (fov 55 / z 6 vs the receiving fov 45
  / z 8.5), so the wrap span is wider than the frustum and particles drift through the
  frame. Source tuning preserved deliberately; nobody has looked at the real page.
- 3 of the 7 pre-existing tests assert on the component's source text
  (`expect(source).toMatch(...)`) rather than on behaviour, so they do not prove the
  hidden-tab pause, offscreen pause or context-loss recovery. Left as-is — tightening them
  is a change to the same file outside this package's scope.

## Incident caused by this lane (recorded, then repaired)

A bare `vite build` in this tree wipes `dist/public` (`emptyOutDir: true`), which destroyed
the prerendered province pages and made the two pre-existing tests in
`shared/crawlReachability.test.ts` fail (they crawl built HTML). The full `pnpm build` was
run, which regenerates them through `server/staticSeoBuild.ts`; the suite returned to 47 /
359 green. `dist/` is gitignored and nothing outside it changed.

## Side effects

```
network: localhost only (python3 -m http.server on 127.0.0.1:8123 for one headless-Chrome
         attempt against the local build; no external request; both processes stopped)
provider_calls: 0 · install: false · secrets_read: false · deploy: false
commit: none · push: none · git clean/checkout/stash/reset: none · delete: none
```
