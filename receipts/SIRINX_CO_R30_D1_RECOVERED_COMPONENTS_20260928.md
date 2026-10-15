# Receipt — SIRINX_CO_R30_D1_RECOVERED_COMPONENTS_20260928

- Pair: `reports/SIRINX_CO_R30_D1_RECOVERED_COMPONENTS_20260928.md`
- Issued: 2026-09-28 · Lane: jcode, cmux `surface:2`, Mac mini M2
- Gate consumed: **NONE** · commit: false · push: false · deploy: false

## What this is

Lane D left two 3D components for `/strategy` and `/solutions` that were unreadable —
every newline and every quote in them written as a two-character escape. I recovered both.
**Their tests are still failing and I stopped on purpose rather than finish them.**

## The damage, as measured

| evidence | value |
| --- | --- |
| `file` on all four | "with very long lines", **"with no line terminators"** |
| `wc -l` on all four | **0** |
| literal `\n` counts | 386 / 405 / 335 / 342 |
| escaped `\"` counts | 50 / 50 / 98 / 98 |
| double-escaped `\\n` or `\\"` | **0 in all four** — which is why a blind replace was safe |
| `tsc` symptom | every error at "line 1", column in the thousands — a character offset, not a line |
| `vitest` symptom | "No test suite found in file" |

## The repair, and its guard

`project-hermes/data/tmp_unescape_newlines.mjs`. It **refuses** to run on a file that
already has real newlines, and **refuses** if a double-escaped sequence is present, since
that would mean a string literal legitimately needs the two-character form. Both conditions
were checked and found false for all four files before anything was written.

Pre-repair backups of all four files:
`project-hermes/data/snapshots/sirinx-co-20260928-2103/*.pre`

## What each file is now

| file | state |
| --- | --- |
| `AICommandCenterHologram3D.tsx` | recovered, **typechecks clean** |
| `BESSContainerProduct3D.tsx` | recovered, **typechecks clean** |
| `AICommandCenterHologram3D.test.tsx` | parses, 9 tests, **2 pass / 7 fail** |
| `BESSContainerProduct3D.test.tsx` | parses, 8 tests, **0 pass / 8 fail** |

Structural fixes also applied: a `vi.mock` class closure written `})` instead of `}`, two
double-escaped regex literals, and — in the hologram test — the mount harness hoisted from
inside the third `describe` to module scope, which is what took it from 0 passing to 2.

## Why I stopped

`mount` was not missing; it was declared at line 186, **inside the third `describe`**, and
called from the first two. A block-scoped `const` is not hoisted, so every caller hit the
temporal dead zone.

I hoisted it, and deliberately changed **nothing else** — the harness and all 16 assertions
are the original author's. Writing new assertions would have been authorship; moving a block
that was in the wrong scope is repair.

Two hypotheses I then tested and discarded, recorded because a discarded hypothesis is
still information:

| hypothesis | test | verdict |
| --- | --- | --- |
| async settling — component does two sequential dynamic imports, `flush()` drained one tick | raised `flush()` to 6 ticks | **wrong**, identical 7 failures |
| component swallows an init error in an un-caught promise chain | grepped `.catch` | **wrong** — line 343 has `.catch(() => setGraphicsError(true))`, line 62 has a `try` |

The 7 remaining failures share one cause: **no renderer is ever created**, so every
behavioural assertion reads an empty `three.renderers`. Either the component and Lane D's
`three` mock disagree, or the component is taking its own error path. Diagnosing that is a
fresh task.

## True state, stated without softening

- Full suite: **49 files / 385 tests pass · 2 files / 15 tests fail.**
- The suite is **red**, and should stay red until this is finished. It is red for a
  specific, documented reason rather than an unknown one.
- Neither component is wired to any page.
- **Neither component has ever rendered a frame.** The tests now run, and they say something
  is wrong. Typechecking is not evidence of behaviour, and the tests are the evidence.
- Nothing committed: 80 changed paths, last commit is still the 2026-09-27 deploy.

## Open decision

Finish the remaining 15 tests — the components have never rendered a frame, so this is where
real bugs would surface — or park the two components and restore 51/51 green. Wiring them to
pages before they pass is not an option.

## Side effects

```
network: none · provider_calls: 0 · install: false · secrets_read: false
commit: false · push: false · deploy: false · files deleted: 0
files written: 4 repaired (backed up first) · 1 script · 1 report · 1 receipt
```
