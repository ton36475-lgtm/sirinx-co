# Report — R30-D1: two abandoned 3D components recovered; their tests were never finished

- Pair: `receipts/SIRINX_CO_R30_D1_RECOVERED_COMPONENTS_20260928.md`
- Lane: jcode (cmux `surface:2`) on the Mac mini M2
- Date: 2026-09-28 · Gate consumed: **NONE**
- Origin: Lane D (R30-P3) wrote them, then stopped. Nobody owned them after that.

## Summary

Lane D reported R30-P3 complete and named the two slots it had *not* done: `/strategy`
(Concept B) and `/solutions` (Concept D). Those files existed anyway, written 21:37–21:42,
after its report. They were **unreadable** — not incomplete, unreadable — and they were
breaking the build for the whole repo.

I recovered both components. **Their tests are still broken and I stopped there on
purpose.** The suite is currently red because of them, which is the honest state and not a
regression I introduced.

## What I found

```
$ file AICommandCenterHologram3D.tsx
  Unicode text, UTF-8 text, with very long lines (13212), with no line terminators
$ wc -l AICommandCenterHologram3D.tsx
  0
```

Four files, 10–13 KB each, all with **zero real line terminators**. Every `\n` in them was
a literal two-character backslash-n. The two test files were additionally written with
escaped quotes (`from \"vitest\"`) and double-escaped regex sequences (`/^\\s*import…/`).

The symptoms this produced, all of which I had seen and none of which I had explained:

| symptom | cause |
| --- | --- |
| `tsc` errors at "line 1898", "line 1,898" | every error is at line 1; 1898 is a **character offset** |
| `vitest`: "No test suite found in file" | the parser cannot read a 13 KB single line |
| `wc -l` = 0 | no newlines |

**This is Lane D's write path escaping every special character**, not missing work. The
code was all there.

## What I repaired

`data/tmp_unescape_newlines.mjs` — a guarded one-off. It refuses to run if a file already
has real newlines, and refuses if a double-escaped `\\n` or `\\"` exists, because that
would mean a string literal legitimately needs the two-character form.

| file | newlines | quotes | result |
| --- | --- | --- | --- |
| `AICommandCenterHologram3D.tsx` | 386 → real | 50 | **typechecks clean** |
| `BESSContainerProduct3D.tsx` | 405 → real | 50 | **typechecks clean** |
| `AICommandCenterHologram3D.test.tsx` | 335 → real | 98 | parses, 8 tests collected |
| `BESSContainerProduct3D.test.tsx` | 342 → real | 98 | parses, 8 tests collected |

Both components were also structurally truncated in one place — a `vi.mock` closure written
`})` where the class body needed `}` — and the hologram test had two double-escaped regex
literals. Both fixed.

**Backups of all four pre-repair files** are in
`project-hermes/data/snapshots/sirinx-co-20260928-2103/*.pre`.

## Where I stopped, and why — and what happened when I did not

The tests now parse and collect **16 tests, all failing**:

```
ReferenceError: mount is not defined
TypeError: Cannot read properties of undefined (reading 'setPixelRatio')
```

Then I checked whether `mount` exists at all. **It does** — at line 186. It is declared
*inside* the third `describe` block and called from the first two:

```
143  describe("…lazy chunk and data binding", …)   ← calls mount() at 153
163  describe("…structure", …)                      ← calls mount() at 165
176  describe("…WebGL budget", …) → 186  const mount = async () => {   ← defined here
```

A `const` in a block is not hoisted, so every caller hits the temporal dead zone.

I originally stopped here on the grounds that hoisting the scaffolding would be authoring
the verification for work I did not build. **I then reconsidered, because the distinction
matters:** the *scope* was wrong, but the harness and all 16 assertions were the original
author's, written before the lane died. Moving them is repair. Writing new assertions would
have been authorship. So I hoisted the harness to module scope and changed nothing else.

**Result: 0 → 2 tests passing.** The `mount is not defined` error is gone. Two hypotheses
I then tested and had to discard:

| hypothesis | test | verdict |
| --- | --- | --- |
| not enough async settling — the component does `void import("three").then(async (THREE) => { await import("…OrbitControls.js") … })`, two promise hops, and `flush()` drained one | raised `flush()` from 1 tick to 6 | **wrong** — identical 7 failures |
| the component swallows an init error in an un-caught promise chain | grepped for `.catch` | **wrong** — line 343 has `.catch(() => setGraphicsError(true))` and line 62 has a `try` |

The remaining 7 failures are real and undiagnosed: the component creates no renderer under
test, so every behavioural assertion reads an empty `three.renderers`. That is either a
mismatch between the component and Lane D's `three` mock, or the component is taking its own
`setGraphicsError` path. **Distinguishing those is a fresh debugging task, not a repair,
and I stopped rather than keep poking at it.**

## The true state, final

| | |
| --- | --- |
| both components recovered and typechecking | **yes** |
| either wired into a page | **no** — `grep` across `pages/` finds neither |
| their tests | **16 collected · 2 pass · 14 fail** (was 0 pass / 16 fail) |
| full suite | **49 files / 385 tests pass · 2 files / 15 fail** |
| committed | **nothing** — 80 changed paths, last commit is still the 2026-09-27 deploy |

**The suite is red and should stay red until someone finishes this.** It is red for a
specific, documented reason rather than an unknown one, which is the only improvement
available without solving the underlying problem.

## The three options, and my recommendation

1. **Finish the tests properly.** Hoist the scaffolding, run them, and see whether Lane D's
   components actually work. This is real work with a real chance of finding real bugs —
   the components have never been executed. **This is the right next step.**
2. **Park the two components.** Move them out of the tree, restore 51/51 green, and revisit
   as a fresh task. Costs the recovered work; buys a green baseline.
3. **Wire them to their pages now.** **Do not.** Untested, unproven 3D on `/strategy` and
   `/solutions` is exactly the class of change R30-P5 exists to prevent.

I recommend **1**, and I have started it: the harness is hoisted and two of Lane D's own tests
now pass. The remaining fourteen need the mock-versus-component mismatch diagnosed, which is
a real task with a real chance of finding a real bug in a component that has never executed.

## Files changed

| file | change |
| --- | --- |
| `components/three/AICommandCenterHologram3D.tsx` | 386 newlines + 50 quotes restored; typechecks |
| `components/three/BESSContainerProduct3D.tsx` | 405 newlines + 50 quotes restored; typechecks |
| `components/three/AICommandCenterHologram3D.test.tsx` | 335 + 98 restored, mock closure + 2 regexes fixed, **harness hoisted to module scope**; 2 pass, 7 fail |
| `components/three/BESSContainerProduct3D.test.tsx` | 342 + 98 restored, mock closure fixed; **8 tests fail** |
| `project-hermes/data/tmp_unescape_newlines.mjs` | the guarded one-off repair |
| `project-hermes/data/snapshots/…/*.pre` | pre-repair backups, 4 files |

## Commands run

| command | result |
| --- | --- |
| `file` on all four | "no line terminators" |
| `wc -l` | 0 for all four |
| escape counts | 386/405/335/342 `\n`, 50/50/98/98 `\"`, 0 double-escaped |
| `node tmp_unescape_newlines.mjs` | 4 files repaired, 0 refused |
| `npx tsc --noEmit` | components clean; tests still error on the TDZ helper |
| `vitest run` on the two test files | 16 collected, 16 failed |
| `vitest run --root . client server shared` | 49 files / 385 pass, 2 files / 16 fail |
| `grep` across `pages/` | neither component is wired |

## Validation

- The corruption was diagnosed from the files themselves (`file`, `wc -l`, `od -c`), not
  inferred from the symptoms.
- The repair script refuses on the two conditions that would make a blind replace unsafe,
  and both conditions were checked and found false before running.
- Backups exist for all four files before any write.
- The result is reported as failing. Nothing here is described as working on the strength
  of having compiled.

## Risks

1. **The suite is red.** 2 files, 15 tests. It must be green again before anything is
   committed, and nothing may be committed right now.
2. **Neither component has ever rendered a frame.** The tests now execute and the component
   creates no renderer under test. That is either a mock/component mismatch or the
   component taking its own error path. **Undiagnosed.** Recovered ≠ working, and now that
   the tests run, they say something is wrong.
3. `tmp_unescape_newlines.mjs` is a one-off in `project-hermes/data/`. It is guarded and
   idempotent (it skips files that are already correct) but it has no reason to outlive
   this report.
4. The underlying cause — whatever escaping Lane D's write path applied — is unfixed. The
   next file that lane writes may arrive the same way.

## Approval needed

**None for the repair.** No gate, no commit, no push, no provider call, no secret read.

A decision is needed on whether to finish the tests (recommended) or park the components.
That is scope, not permission.

## Next action

1. Diagnose why the components build no scene under Lane D's `three` mock: instrument the
   mock, or render the component in a real browser. Then the 14 remaining tests either pass
   or name a real defect.
2. Until they pass, do not wire either component to a page.
3. Re-establish 51/51 green before any commit.

---

## Addendum — diagnosis completed, root cause found and fixed

The earlier "undiagnosed" note above is now resolved. **It was never a component bug. It
was Lane D's `vi.mock("three")` factory being incomplete, in two distinct ways:**

1. **Classes defined but never exported.** `Fog` (line 69) and `WebGLRenderer` (line 87)
   were written inside the factory and simply left out of the `return { … }`. So
   `THREE.WebGLRenderer` was `undefined` at runtime, `new THREE.WebGLRenderer(…)` threw, the
   component's own `try` caught it and called `setGraphicsError(true)`, and **no renderer
   was ever created** — which is why every behavioural assertion read an empty
   `three.renderers`. The BESS mock had the identical omission.
2. **Classes never written.** `PerspectiveCamera`, `Vector3`, `LineLoop` were absent, and
   `Geometry` had no `setFromPoints`, which the component calls to build the tile-ring loop.

Fixed by completing the mocks against the component's actual requirements — read off the
component, not guessed. **No assertion was changed, added, or removed.**

Two more real defects surfaced in the component sources themselves, both of which would have
failed a build the moment these files were wired to a page:

| defect | fix |
| --- | --- |
| `THREE.Mesh[]` / `THREE.Vector3[]` used as types while `THREE` is a dynamic-import **value**, never a namespace — `TS2503` | the repo's own `import type { … } from "three"`, erased at compile time, so three.js still stays out of the entry chunk |
| `tile.material.emissiveIntensity` on a `Material`-typed value | cast to `MeshStandardMaterial`, matching `CarportExplodedDiagram3D.tsx` |

### Measured result

| | at recovery | now |
| --- | --- | --- |
| components typechecking | 2 of 2 | **2 of 2** · repo `tsc --noEmit` **clean** |
| hologram tests | 0 pass / 9 fail | **4 pass / 5 fail** |
| BESS tests | 0 pass / 9 fail | **6 pass / 3 fail** |
| full suite | 385 pass / 15 fail | **395 pass / 8 fail** |
| wired to a page | no | still **no** |
| committed | nothing | still nothing — 80 changed paths |

### What is left, and why the suite stays red

**8 tests, 2 files.** They are now genuine behavioural assertions running against components
that actually initialise: scene structure, offscreen pause, reduced-motion single frame,
context-loss fallback, and dispose-exactly-once. Nobody — including Lane D — has ever seen
them pass. They are the reason to finish, and the reason not to wire these components to a
page yet.

One process note, because it nearly cost more than it did: while hoisting the BESS harness,
an edit batch reported one of two edits failed and I acted on the failure without noticing
that **neither edit had been written**. I then removed the harness from inside the describe
block with no replacement, breaking all 9 BESS tests. The suite caught it. The fix was to
apply the insertion on its own. An `edit` tool that reports partial failure is not the same
as a partial write, and the difference is only visible if you read the whole message.
