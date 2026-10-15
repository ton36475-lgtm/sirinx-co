# PKG-7 WebGL defects — Province scenes

Date: 2026-09-28. Scope: `ProvinceYieldChart3D.tsx`, `ProvinceSolarScene.tsx`, and focused test file only.

## Work completed

- `ProvinceYieldChart3D` now consults `prefers-reduced-motion`, draws a single static frame in reduce mode, and does not schedule its recurring rAF there.
- Both components prevent default on context loss, cancel the loop, dispose scene GPU geometry/material resources once for that loss, listen for restoration, and render/restart the scene following restoration. Three.js owns its renderer context restoration; this implementation depends on that behavior to recreate GPU-side resources when it renders again.
- Both show a visible `role=status` message on renderer construction/lazy import failure and while context is lost. A successful restore dismisses the transient loss message.
- Both supply an `aria-describedby` text equivalent. The chart reads its yield and rank from `provinceYieldSummary`; the scene computes solar elevation/azimuth using `solarPosition` from `shared/sunMath` and its real coordinates.

## Red then green proof

Deliberate red: temporarily removed the parentheses around the reduced-motion media query in the test's expected string. Real output:

```text
FAIL client/src/components/three/ProvinceScenes.test.ts > province WebGL scenes > renders only one chart frame when reduced motion is requested
AssertionError: expected ... to contain 'window.matchMedia("prefers-reduced-motion: reduce").matches'
Test Files 1 failed (1)
Tests 1 failed | 4 passed (5)
```

Restored the correct test assertion. Final focused run:

```text
✓ client/src/components/three/ProvinceScenes.test.ts (5 tests)
Test Files 1 passed (1)
Tests 5 passed (5)
```

These are source-contract assertions, not mounted-component/WebGL lifecycle tests. Runtime behavior remains unverified by automated tests.

## Verification output

`cd apps/public-web && npx tsc --noEmit`: exit 0, no diagnostics.

`cd apps/public-web && npx vitest run --root . client shared`:

```text
Test Files 1 failed | 32 passed (33)
Tests 6 failed | 201 passed (207)
Errors 6 errors
```

All six failures are in the concurrently owned, unmodified `client/src/components/three/SolarHeroScene.test.tsx`, with renderer state undefined, expected `visibilitychange` / context events absent, and matchMedia missing in test setup. This includes files B2 owns; not changed here.

`cd apps/public-web && npm test`:

```text
Test Files 1 failed | 46 passed (47)
Tests 6 failed | 352 passed (358)
Errors 6 errors
```

Same six B2 `SolarHeroScene.test.tsx` failures. Focused assigned tests and TypeScript check pass. Full test gates do not pass.

## Status by defect

1. Reduced motion: implemented; source-contract test passes. Browser-level paint/rAF behavior not independently remeasured, so runtime verification remains unverified.
2. Context loss: prevent-default, stop, scene resource disposal, restore event handling, fallback and restore render/restart are implemented. Actual forced-loss/restore, idempotent disposal behavior, and permanent-loss UX are **partial/unverified** without an integration/runtime test. Renderer context/resource reconstitution depends on Three.js behavior.
3. Text alternative: implemented with real yield/rank and computed sun position, paired by `aria-describedby`; source-contract test passes. Screen-reader/manual accessibility validation unverified.

No files owned by B2 were changed. No request to another lane at this time.

Side effects: `network: none` · `provider_calls: none` · `deploy: false` · `secrets_read: false` · no commit/push.
