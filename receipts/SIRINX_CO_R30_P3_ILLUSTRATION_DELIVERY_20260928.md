# RECEIPT · R30-P3 ILLUSTRATION DELIVERY

```
package:   R30-P3 (Concept C)   lane: D (hermes, Mac mini M2)
route:     /solar-carport
issued:    2026-09-28
report:    reports/SIRINX_CO_R30_P3_ILLUSTRATION_DELIVERY_20260928.md
status:    done · red_proof: yes
gates:     none
```

## Files written by this lane

| file | kind |
| --- | --- |
| `apps/public-web/client/src/components/three/CarportExplodedDiagram3D.tsx` | new |
| `apps/public-web/client/src/components/three/CarportExplodedDiagram3D.test.tsx` | new |
| `apps/public-web/client/src/pages/SolarCarport.tsx` | edited (lazy import + 1 section) |
| `apps/public-web/client/src/i18n/pages/solarCarport.ts` | edited (3 additive keys) |
| `reports/SIRINX_CO_R30_P3_ILLUSTRATION_DELIVERY_20260928.md` | new |
| `receipts/SIRINX_CO_R30_P3_ILLUSTRATION_DELIVERY_20260928.md` | new |
| `reports/SIRINX_CO_R30_P3_ILLUSTRATION_DELIVERY_20260928.md.sha256` | new |
| `receipts/SIRINX_CO_R30_P3_ILLUSTRATION_DELIVERY_20260928.md.sha256` | new |

Read but not edited: `three/SolarHeroScene.tsx`, `components/HeroSlideshow.tsx`,
`pages/Home.tsx`.

## Verification, as run

| check | command | result |
| --- | --- | --- |
| baseline | `npx vitest run --root . client server shared` | 47 files / 359 tests pass |
| new suite | `npx vitest run --root . client/src/components/three/CarportExplodedDiagram3D.test.tsx` | 1 file / 18 tests pass |
| full suite | `npx vitest run --root . client server shared` | 48 files / 377 tests pass |
| types | `npx tsc --noEmit` | no output |
| chunking | `npx vite build --outDir "$JCODE_SCRATCH_DIR/p3build" --emptyOutDir` | entry chunk 120,824 B with 0 references to `three.module`; three.js is a separate 746,766 B chunk reached only by `import("./three.module-*.js")` |

The build was written to a scratch directory. No lane's `dist/` was overwritten.

## Red proof summary

| # | mutation | red run | restored |
| --- | --- | --- | --- |
| A | shared material disposed twice | `expected "spy" to be called 1 times, but got 2 times` | green |
| B | DPR cap dropped on resize | `expected last "spy" call to have been called with [ 2 ]`, received `3` | green |
| C | `document.hidden` guard removed from `schedule()` | `expected 1 to be +0` in the background-tab test | green |

Mutation C did not go red on the first attempt; the gap in the test was closed
with a background-tab-plus-intersection test, and the mutation then went red.
Both facts are in the report.

## Not done

`/strategy` (Concept B) and `/solutions` (Concept D) were not started. `/` was
deliberately left alone. See report §8.

## Side effects

No commit. No push. No deploy. No install. No provider call. No secret read or
written. No destructive git command.

---

network: none · provider_calls: 0 · install: false · secrets_read: false · deploy: false
