# Motion flag A/B — measured 2026-09-28 (R29)

For `APPROVE_MOTION_HOME_ENABLED_TRUE`. **The flag remains `false` in the working tree.**
This document supplies evidence; it does not grant anything.

## What was missing

The order's addendum held `MOTION_HOME_ENABLED` at `false` because Home is the primary
conversion path and LCP had never been measured. PKG-5 then measured production and found
the 3D was never the LCP element. What was still missing is the thing that actually decides
the question: **the flag-ON variant had never been rendered anywhere at all.**

## Method

Same page, same machine, same dev server, one variable changed. Three samples per variant
per viewport, because the first single-sample run was misleading (see below).

```
flag=false → 3 loads  ·  flip flag=true → 3 loads  ·  flip back to false
```

The flag was restored to `false` immediately afterwards and the restore was verified by
reading the file and re-running the flag tests. The dev server was stopped.

## Result

| viewport | variant | LCP samples (ms) | median | max CLS |
| --- | --- | --- | --- | --- |
| desktop | off | 596, 600, 768 | **600** | 0.0002 |
| desktop | on | 604, 612, 600 | **604** | 0.0002 |
| mobile | off | 568, 576, 588 | **576** | 0 |
| mobile | on | 560, 584, 592 | **584** | 0 |

**Median delta: desktop +4 ms (+0.7%), mobile +8 ms (+1.4%).**

Also identical across all 12 loads:

- **CLS** — 0.0002 desktop, 0 mobile, in both variants. Enabling motion does not
  destabilise layout.
- **DOM node count** — 916 in every single load. The flag does not bloat the tree.
- **LCP element** — `IMG.h-full`, the hero image, in every load. Motion does not become the
  largest paint.
- **Page errors** — none, in either variant.

**There is no measurable LCP or CLS cost to enabling motion on the homepage.**

## The single-sample trap, and why it matters here

The first pass, one sample per cell, reported **+96 ms desktop and +32 ms mobile** — a
result that reads as "motion costs about a tenth of a second on the conversion path", and
would have been a perfectly plausible reason to leave the flag off forever.

With three samples per cell the same comparison gives **+4 ms and +8 ms**. The first
number was noise.

This is the same failure mode as the rAF frame counter and the whole-page screenshot diff
earlier in the round: a single cheap measurement that looks decisive and is not. It is
recorded here rather than quietly replaced, because the *reason* the flag was held at
`false` for a day was "we fear motion costs LCP" — and that fear was never measured, was
sometimes guessed at, and the one time it was measured properly it did not survive.

## What this does not establish

1. **This is a Vite dev server, not a production build.** Dev serves unbundled,
   unminified modules with no tree-shaking. Enabling motion pulls `framer-motion` onto
   the Home path — in dev it is already resident, so its cost is invisible here. **In a
   production build that is a real bundle-size delta** and it has not been measured.
2. **Runtime cost and bundle cost are different things.** This rules out a runtime paint
   cost. It says nothing about bytes over the wire, which on a mobile connection in
   Thailand is the cost that actually matters.
3. Lab data, one machine, headless Chrome, no field or mobile-GPU data.
4. `components/Layout.tsx` still has hardcoded motion values — a Tailwind `duration-300`
   and a framer-motion spring at `damping: 28, stiffness: 300`, neither read from
   `shared/motionTokens.ts`. Turning the flag on would leave Layout inconsistent with Home.

## Recommendation

The LCP objection is answered: there is no runtime paint penalty. Before flipping, close
the two real gaps rather than the one that was imagined:

1. **Build for production and measure the bundle delta** with the flag on and off. That is
   the measurement that is still missing, and it is the one that would decide it.
2. **Tokenise `components/Layout.tsx`**, so flipping the flag does not leave two motion
   grammars in the codebase.

Both are local, reversible and ungated. After that, `APPROVE_MOTION_HOME_ENABLED_TRUE` is a
decision with real evidence behind it rather than a guess that survived a day because
nobody measured it.

## Side effects

`network: localhost only` · `provider_calls: none` · `deploy: false` · `secrets_read: false`
· flag flipped twice and restored to `false`, verified by file read and by re-running
`motionFlags.test.ts` (3 passed) and the full suite (47 files / 358 tests passed) ·
dev server started and stopped, 0 processes remaining
