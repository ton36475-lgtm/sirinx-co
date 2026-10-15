# PKG-1b Motion Flag Shim Report

Date: 2026-09-28
Scope: conditional homepage/layout motion shim, default gated off.

## Files created / modified

- Created `apps/public-web/shared/motionFlags.ts` (`MOTION_HOME_ENABLED = false`; comment explains LCP measurement gate).
- Created `apps/public-web/shared/motionFlags.test.ts` (default-off invariant, static-props stripping, enabled-props forwarding).
- Modified `apps/public-web/client/src/lib/static-motion.tsx` (conditional static shim vs actual Framer Motion exports).
- Modified `apps/public-web/client/src/pages/Home.tsx` only to source fade-up duration/easing/stagger from shared motion tokens.
- Created `docs/3d/MOTION_FLAG_WIRING_20260928.md`.
- Created this report and matching receipt, each with SHA-256 sidecars.
- No `client/src/pages/Layout.tsx` exists. The actual `client/src/components/Layout.tsx` is outside this lane's ownership and was not modified. It contains additional motion instances/timings that should be tokenized in a separately approved scope before setting this flag true.
- Did not edit any forbidden B2, HeroSlideshow, or docs/media files. No request to another lane is required for this patch; before enabling motion, a correctly scoped Layout tokenization follow-up and actual LCP measurement are required.

## Verification evidence

### Focused command exactly as assigned

Command:

```sh
cd /Users/sirinx/SIRINXDev/sirinx-co/apps/public-web
npx vitest run shared/motionFlags.test.ts shared/motionTokens.test.ts
```

Actual output:

```text
 RUN  v2.1.9 /Users/sirinx/SIRINXDev/sirinx-co/apps/public-web/client

filter:  shared/motionFlags.test.ts, shared/motionTokens.test.ts
include: **/*.{test,spec}.?(c|m)[jt]s?(x)
exclude:  **/node_modules/**, **/dist/**, **/cypress/**, **/.{idea,git,cache,output,temp}/**, **/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*

No test files found, exiting with code 1
```

The Vite config sets Vitest root to `client/`, so the exact shared-path command does not discover tests. With the repository test root override, the focused suite passed:

```text
$ npx vitest run --root . shared/motionFlags.test.ts shared/motionTokens.test.ts

 RUN  v2.1.9 /Users/sirinx/SIRINXDev/sirinx-co/apps/public-web

 ✓ shared/motionTokens.test.ts (8 tests) 3ms
 ✓ shared/motionFlags.test.ts (3 tests) 30ms

 Test Files  2 passed (2)
      Tests  11 passed (11)
   Start at  15:35:01
   Duration  460ms (transform 91ms, setup 0ms, collect 102ms, tests 33ms, environment 0ms, prepare 167ms)
```

TypeScript command:

```text
$ npx tsc --noEmit
```

Actual result: exit code 0, no output.

Full project suite:

```text
$ npm test
> sirinx@1.0.0 test
> vitest run --root . client server shared

 RUN  v2.1.9 /Users/sirinx/SIRINXDev/sirinx-co/apps/public-web

 Test Files  44 passed (44)
      Tests  343 passed (343)
   Start at  15:35:25
   Duration  3.99s (transform 2.30s, setup 0ms, collect 7.67s, tests 2.21s, environment 399ms, prepare 3.09s)
```

The full output also contained existing test stderr from the local lead queue and mocked LLM-error handling; the suite passed. The router test reported writing its expected local fixture beneath `.jcode/scratch`.

### Deliberate red proof

Changed only the flag source default temporarily from false to true, ran the default assertion, observed failure, and restored false. Actual failing evidence:

```text
 RUN  v2.1.9 /Users/sirinx/SIRINXDev/sirinx-co/apps/public-web

 ❯ shared/motionFlags.test.ts (3 tests | 1 failed) 25ms
   × MOTION_HOME_ENABLED > ships disabled until LCP is measured 4ms
     → expected true to be false // Object.is equality

 FAIL  shared/motionFlags.test.ts > MOTION_HOME_ENABLED > ships disabled until LCP is measured
AssertionError: expected true to be false // Object.is equality

- Expected
+ Received

- false
+ true

 Test Files  1 failed (1)
      Tests  1 failed | 2 passed (3)
   Start at  15:36:08
   Duration  319ms (transform 40ms, setup 0ms, collect 37ms, tests 25ms, environment 0ms, prepare 51ms)
```

Red proof succeeded. The passing focused and full suites were observed with the restored default `false`; static and enabled shim paths are both covered via isolated mocked flag imports.

### DOM compatibility

The static-path test confirms motion-only props are stripped, content/normal attributes are preserved, and the result is a native `<div>`. The required separate rendered-output capture from before editing was not taken before the work began. Therefore a literal before/after DOM capture comparison is **unverified**, not claimed as proven. Test instrumentation injects a `data-loc` attribute into rendered JSX.

## Unverified / blocked

- Exact pre-change vs post-change rendered DOM capture: **unverified** because no pre-edit capture existed.
- The requested no-override focused Vitest command: blocked by config root `client/`; it returns “No test files found.” Equivalent tests passed using `--root .` and the repo's `npm test` script.
- Layout/page-transition timings and behavior are not updated because the assigned `pages/Layout.tsx` path is absent and the real `components/Layout.tsx` is outside the lane's owned-file list. Keep the flag false until this follow-up and LCP measurement are complete.
- Not run: Rust workspace chain (`cargo fmt`, `cargo clippy`, `cargo test`) or root npm checks, since scope is apps/public-web and its own TypeScript/full test commands were run.

## Side effects

- network: none
- provider_calls: none
- deploy: false
- secrets_read: false
- git commit/push: none
