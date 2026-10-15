# Motion Flag Wiring (2026-09-28)

## Decision

`apps/public-web/shared/motionFlags.ts` exports the single compile-time switch `MOTION_HOME_ENABLED`, whose shipped value is `false`. The flag stays off until a real homepage LCP baseline is measured and a separate approval is given.

## Shim behavior

`apps/public-web/client/src/lib/static-motion.tsx` selects its exports using that shared flag:

- `false`: preserve the existing static shim. `AnimatePresence` returns children unchanged and `motion.div`, `motion.img`, and `motion.button` remove motion-only props before rendering native elements.
- `true`: expose the `framer-motion` `AnimatePresence` and `motion` exports directly.

The test suite imports the shim under both mocked flag values. The default invariant separately asserts that the shipped export remains false. `shared/motionFlags.test.ts` exercises stripping and forwarding, and its default assertion was observed failing when the source default was deliberately changed to true.

## Homepage timing

`client/src/pages/Home.tsx` retains its existing motion wrappers, but its shared fade-up variant now reads duration, easing, and stagger timing from `shared/motionTokens.ts`. Motion remains disabled by default, so the change does not opt users into animation.

The instructed `client/src/pages/Layout.tsx` does not exist in this checkout. The actual `client/src/components/Layout.tsx` is outside this lane's file ownership and was not edited. It contains other motion wrappers and hardcoded durations/spring settings. Those need a separately authorized, correctly scoped follow-up before enabling the flag. `HeroSlideshow.tsx` is also owned by another lane and was not read or edited beyond the assignment's explicit instructions.

## Verification caveat

The requested focused Vitest command without `--root .` resolves the configured Vitest root to `client/` and reports no test files for the `shared/` paths. Running the same test files with `--root .` discovers and executes them. The full project `npm test` uses that root override and passed.

The flag-off test verifies the static DOM output and stripped motion attributes. A separately captured pre-edit runtime rendering was not recorded before implementation, so literal before/after capture equality is **unverified**. The statically rendered output matches the legacy native-element/children contract, aside from Vite's injected `data-loc` instrumentation attribute.

## Side effects

- network: none
- provider_calls: none
- deploy: false
- secrets_read: false
