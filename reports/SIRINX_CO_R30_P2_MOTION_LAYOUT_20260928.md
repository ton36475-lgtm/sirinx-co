# Report — R30-P2: Layout motion is tokenised; the flag stays off

- Pair: `receipts/SIRINX_CO_R30_P2_MOTION_LAYOUT_20260928.md`
- Lane: jcode (cmux `surface:2`) on the Mac mini M2
- Date: 2026-09-28 · Gate consumed: **NONE** · `MOTION_HOME_ENABLED` remains `false`
- Order: `docs/media/ORDINER_SIRINX_CO_ILLUSTRATION_R30_20260928.md` §5

## Summary

`Layout.tsx` had four hardcoded motion values and no tokens. All four now read from
`shared/motionTokens.ts`, with values unchanged — this names what already ships, it does not
retune it. A guard proves no hardcoded value can go back in, and I proved the guard goes
red.

**Step 3 of the order — the browser A/B re-measurement — was not done.** It is the reason
`APPROVE_MOTION_HOME_ENABLED_TRUE` still cannot be granted, and it is stated as outstanding
rather than approximated.

## Why this lane ran twice and failed before it ran at all

Two worker attempts died before writing anything. The first reported only
*"I'll start by reading the order"*; the second got as far as *"Now STEP 1 — tokenising
Layout.tsx"*. Both left the tree untouched — `Layout.tsx` unmodified, suite still green at
48 files / 381 tests. No damage, no partial state, nothing to clean up.

Two failures in a row on the same package is a signal rather than bad luck, so I took the
package over directly instead of spawning a third attempt with the same prior.

## What was hardcoded

```tsx
// line 92   — scroll-progress bar
className="... transition-all duration-300 ..."

// line 280  — mobile navigation overlay
transition={{ type: "spring", damping: 28, stiffness: 300 }}

// line 340  — dropdown chevron rotation
className="... transition-transform duration-200 ..."

// line 386  — mobile submenu expand
transition={{ duration: 0.2 }}
```

## What it is now

Two new tokens, carrying the shipped values:

```ts
// motionTokens.ts
MOTION_DURATIONS.scrollProgress = 0.3        // was duration-300
MOTION_DURATIONS.micro         = 0.2        // already existed; was duration-200 and 0.2
MOTION_SPRINGS.overlay = { stiffness: 300, damping: 28, mass: 1 }   // was inline
```

and four call sites:

```tsx
import { MOTION_DURATIONS, MOTION_SPRINGS } from "@shared/motionTokens";

<nav style={{ transitionDuration: `${MOTION_DURATIONS.scrollProgress}s` }} … >
<motion.div transition={{ type: "spring", ...MOTION_SPRINGS.overlay }} … >
<ChevronDown style={{ transitionDuration: `${MOTION_DURATIONS.micro}s` }} … />
<motion.div transition={{ duration: MOTION_DURATIONS.micro }} … >
```

`duration-200` and `duration: 0.2` are the same 200 ms, and `MOTION_DURATIONS.micro` is
already `0.2`, so those two sites map to an existing token with no new one. Only two tokens
were added, and both hold values that were already in the file.

## The guard, and a mistake I made writing it

`motionTokens.test.ts` gains a `Layout motion contract` block with four tests. The last one
is the regression guard: strip comments from `Layout.tsx`, then assert no `duration-<n>`
Tailwind utility and no inline numeric `duration:` / `damping:` / `stiffness:` in a
transition survive.

**The first version of that test failed, and it was the test's fault.** The explanatory
comment I put above the `<nav>` contains the literal string `duration-300`, and the guard
matched its own documentation:

```
× leaves no hardcoded motion values in Layout.tsx
  → expected [ 'duration-300' ] to deeply equal []
```

Stripping comments before scanning fixed it. Recording this because a guard that is
satisfied by editing a comment is a guard that will be satisfied by accident later.

Three of the four new tests are generic on purpose. The pre-existing tests name individual
keys — `microFast`, `micro`, `heroEnter` — so a token added tomorrow would escape all of
them. The new ones iterate over `Object.entries`, which is why `scrollProgress` and
`overlay` are covered at all.

## Red proof

```
# tokenised
$ npx vitest run --root . shared/motionTokens.test.ts
  Test Files  1 passed (1)
  Tests       12 passed (12)

# revert ONE site — put `duration-200` back on the ChevronDown
$ npx vitest run --root . shared/motionTokens.test.ts
  × leaves no hardcoded motion values in Layout.tsx
    → expected [ 'duration-200' ] to deeply equal []
  Test Files  1 failed (1)
  Tests       1 failed | 11 passed (12)

# restore
$ npx vitest run --root . client server shared
  Test Files  49 passed (49)
  Tests       385 passed (385)
$ npx tsc --noEmit
  (no output)
$ grep MOTION_HOME_ENABLED shared/motionFlags.ts
  export const MOTION_HOME_ENABLED = false;      ← untouched, as the order requires
```

The failure names the exact class of defect and the exact class name that leaked, not just
a line number.

## What was NOT done, and what it blocks

**The flag-on A/B re-measurement was not run.** The order's step 3 asked for ≥3 samples per
variant per viewport against a real page, appended to
`docs/3d/MOTION_FLAG_AB_MEASUREMENT_20260928.md`. I did not do it and I have not appended
anything to that document, because a partially-written measurement appended to a real one
is worse than none.

So the honest state is:

| question | status |
| --- | --- |
| is Layout tokenised? | **yes, and red-proofed** |
| is behaviour preserved? | **by construction** — the token values are pinned to the values that shipped, and a test asserts it |
| does the flag-on homepage still measure +4 ms / +8 ms, CLS 0.000? | **unmeasured since tokenisation.** The R29 numbers predate this change. |
| can `APPROVE_MOTION_HOME_ENABLED_TRUE` be granted? | **no.** Not on this evidence. |

The tokenisation is value-preserving by construction, so the prior measurement is probably
still representative — but "probably" is not a number, and this report will not convert it
into one.

Also not verified: the visual result. That a Tailwind `duration-200` and an inline
`transitionDuration: "0.2s"` compute the same CSS is true in this case and asserted only at
the token level, not observed in a browser.

## Files changed

| file | change |
| --- | --- |
| `apps/public-web/shared/motionTokens.ts` | +2 tokens (`scrollProgress`, `overlay`), values unchanged |
| `apps/public-web/shared/motionTokens.test.ts` | +4 tests, +1 `Layout motion contract` block |
| `apps/public-web/client/src/components/Layout.tsx` | 4 hardcoded values → tokens, 1 import |
| `reports/` + `receipts/` + sidecars | this report and its receipt |

## Commands run

| command | result |
| --- | --- |
| `grep -nE "duration\|transition\|{{\|ease\|stagger"` on `Layout.tsx` | 4 hardcoded sites, listed above |
| `npx tsc --noEmit` (after edit) | clean |
| `vitest run shared/motionTokens.test.ts` (tokenised) | 12 passed |
| `vitest run shared/motionTokens.test.ts` (one site reverted) | **1 failed \| 11 passed** |
| `vitest run --root . client server shared` (restored) | **49 files / 385 tests passed** |
| `npx tsc --noEmit` (restored) | no output |
| `grep MOTION_HOME_ENABLED` | `false`, unchanged |

## Validation

- The guard was shown red on a real regression and green on the fix, with output quoted.
- Values are pinned by test, so a future "improvement" to a number fails rather than
  landing silently.
- The flag was not flipped. It is not mine to flip and the evidence for it does not exist yet.
- Nothing committed, pushed, deployed. No provider call, no secret read.

## Risks

1. **The measurement is missing**, so the gate stays shut. This is the honest cost of not
   doing step 3, and it is larger than the cost of doing it.
2. Two workers failed on this package. The cause is unexplained. If it is a shared-tooling
   fault rather than bad luck, the next lane on any package may fail the same way.
3. `style={{ transitionDuration }}` on the `<nav>` competes with Tailwind's `transition-all`
   shorthand. The inline style wins on specificity, so the value is the token — but this is
   the kind of interaction that should be seen once, not reasoned about.

## Approval needed

**None for what was done.** No gate, no commit, no push.

**`APPROVE_MOTION_HOME_ENABLED_TRUE` still needs a measurement first.** The order of
operations is: measure flag-on, then approve, then flip. The tokenisation is the
prerequisite that is now satisfied.

## Next action

1. Run the A/B measurement with the tokenised Layout and append it to
   `docs/3d/MOTION_FLAG_AB_MEASUREMENT_20260928.md`. One pass, ~10 minutes, Chrome and
   Playwright are already present.
2. Open the mobile nav once in a browser and confirm the overlay and chevron still animate
   as before. Cheap, and it is the one thing this change could have broken invisibly.
3. Decide whether the two worker failures are worth diagnosing before the next round.
