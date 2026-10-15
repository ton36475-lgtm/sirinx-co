# LANE ASSIGNMENT — SIRINX.CO ILLUSTRATION WORK (Round R29, 2026-09-28)

> Companion to `ORDINER_SIRINX_CO_ILLUSTRATION_20260928.md` (the uniform command set).
> That file is the **what**. This file is the **who owns which file**.
> If the two disagree about ownership, this file wins.

issued-by: jcode (surface:7) · 2026-09-28 08:35 · gates consumed by issuer: **NONE**
Read both files completely before touching anything.

---

## 0. VERIFIED STATE — read from disk at 08:30, not copied from any report

| Item | Real state | Evidence checked |
| --- | --- | --- |
| PKG-1 motion tokens | **DONE, red-proved** | `shared/motionTokens.ts` + `.test.ts` + `docs/3d/MOTION_DECISION_20260928.md` + report/receipt/sidecars |
| PKG-1 addendum B1–B5 | **NOT STARTED** | no `shared/motionFlags.ts` · `static-motion.tsx` unmodified · `grep MOTION_HOME_ENABLED` = 0 hits |
| PKG-2 hero 3D | **PARTIAL and unproven** | `SolarHeroScene.tsx` + `EnergyFlowShader.ts` exist · **0 test files import them** · R28a has no `.sha256` · `hero-solar-core/` still duplicated + untracked |
| PKG-3 AI image | **PARTIAL** | `generate-illustrations.mjs` has `--dry-run` default and names the gate correctly · `.media-staging/_quarantine/` exists · **`docs/media/prompts/` does NOT exist** |
| PKG-4 coverage | **DONE** | `ILLUSTRATION_COVERAGE_20260928.md` + report/receipt/sidecars |
| PKG-5 WebGL perf | **NOT STARTED + BLOCKED** | no file · browser bridge not responding (needs a manual Chrome extension toggle) |
| PKG-6 art brief | **NOT STARTED** | no file |

**R28a lesson, written down so it is not repeated:** R28a reported "82 tests passed"
while no test imported the code it had just written. Green that does not cover the new
code is not evidence. Every package below repeats the red-proof requirement.

---

## 1. LANE ROSTER (verified against cmux and the tailnet, not the A2A registry)

| Lane | What it actually is | Can receive work? |
| --- | --- | --- |
| **A — freebuff** | cmux `surface:8`, Gemini 3.8 Flash, TUI agent | YES, local |
| **B — macmini m2 workers** | spawned agents **on this machine** (`MacminiSirinx`, `Mac14,3`, Apple M2, 8 cores) | YES, local |
| **C — VM server** | `vm-2-126-ubuntu`, `100.72.202.12`, linux, online, tx 2.2 MB / rx 491 KB | **NO — SSH is an external action, needs `APPROVE_EXTERNAL_LANE_DISPATCH`** |

Note on the A2A registry: `A2A-QUEUE-ONE-WAY` is `AWAITING_APPROVAL` with 92 submitted
tasks and no consumer, and 0/15 model bindings are `ROUTE_ACTIVE_VERIFIED`. A2A is
therefore **not** the dispatch channel. cmux and local spawn are. Do not wait on A2A.

Note on this machine: session `surface:7` **is** the macmini m2. Lane B is not a different
computer from the coordinator; it is parallel agents on the same M2.

---

## 2. OWNERSHIP MATRIX — no two lanes touch the same file

```
LANE A  freebuff (surface:8)
  PKG-6  docs/media/ART_ENGINEERING_BRIEF_20260928.md          (new)
  PKG-3b docs/media/prompts/**                                  (new)
         docs/3d/IMAGE_SYNTHESIS_PROMPT_CATALOG_20260928.md     (extend, do not replace)

LANE B1 macmini worker — MOTION FLAG
  PKG-1b apps/public-web/shared/motionFlags.ts                  (new)
         apps/public-web/shared/motionFlags.test.ts             (new)
         apps/public-web/client/src/lib/static-motion.tsx       (conditional shim)
         docs/3d/MOTION_FLAG_WIRING_20260928.md                 (new)

LANE B2 macmini worker — 3D EVIDENCE
  PKG-2  apps/public-web/client/src/components/three/SolarHeroScene.test.tsx  (new)
         apps/public-web/client/src/components/three/EnergyFlowShader.test.ts  (new)
         apps/public-web/client/src/hero-solar-core/**          (merge-or-delete verdict)
         reports/SIRINX_CO_THREEJS_MOTION_ENGINEERING_20260928.md.sha256       (sidecar)
         receipts/SIRINX_CO_THREEJS_MOTION_ENGINEERING_20260928.md.sha256      (sidecar)

LANE C  VM server — HELD, no files assigned
  Nothing is assigned to Lane C until a gate lands. When it is admitted it takes
  PKG-5 measurement only (read-only, no repo writes), because that is the one job
  that benefits from a machine that is not also rendering the page it measures.

COORDINATOR (surface:7) — jcode
  docs/media/LANE_ASSIGNMENT_20260928.md   (this file)
  PKG-5 attempt + honest "not measured" report if blocked
  reports/ + receipts/ in /Users/sirinx/project-hermes
```

**Nobody may edit a file outside their own row.** If you believe you also need another
lane's file, stop and write it into your report as a request. Do not take it.

---

## 3. SHARED WORKING TREE WARNING

All lanes write to the **same working tree** of `/Users/sirinx/SIRINXDev/sirinx-co`
on branch `main`. There is no per-lane branch.

- Read the file immediately before you edit it, not from memory.
- If a file you own already changed under you, re-read and merge rather than overwrite.
- **Do not run `git clean`, `git checkout --`, `git stash`, or `git reset` — ever.**
  `client/src/hero-solar-core/` is untracked and holds real unmerged work; a `git clean`
  destroys it with no way back.
- Nobody commits. Nobody pushes. Nobody deploys.

---

## 4. PER-LANE ORDERS

### LANE A — freebuff — PKG-6 then PKG-3b

**PKG-6 → `docs/media/ART_ENGINEERING_BRIEF_20260928.md`**
One document. Every single claim must cite a real file in the repo. Required sections:
art direction · palette · typographic scale · motion grammar (easing / duration / stagger,
sourced from `shared/motionTokens.ts`) · 3D camera language (sourced from
`ProvinceSolarScene.tsx`, `ProvinceYieldChart3D.tsx`, `SolarHeroScene.tsx`) ·
illustration style rules · accessibility rules · asset budget.
If you cannot point at a file for a claim, cut the claim. Do not pad.

**PKG-3b → `docs/media/prompts/`** (directory does not exist yet — create it)
- Read real values from `shared/provinceEnergyData.ts` (yield, rank) and
  `shared/sunMath.ts` (sun position). Import or parse them; **never invent a number**.
- Every prompt that asserts a yield or an installation result carries a disclaimer
  string in the file.
- Cross-check `docs/3d/IMAGE_SYNTHESIS_PROMPT_CATALOG_20260928.md` from R28a and
  **extend** it. Its current prompts are not bound to the real data. Say which ones you
  bound and which you left and why.
- `docs/media/generate-illustrations.mjs` already defaults to `--dry-run` and already
  names `APPROVE_PAID_IMAGE_PROVIDER_CALL`. **Leave that behaviour alone.** Do not add
  an execute path that skips the gate.

### LANE B1 — macmini worker — PKG-1b, the Commander-approved conditional motion shim

The decision is already made: **Path B** (motion on Home + Layout), but **gated off by
default** until LCP is actually measured. Home is the primary conversion path, so the
default must not change production behaviour.

1. `shared/motionFlags.ts` — single export `MOTION_HOME_ENABLED`, default `false`,
   with the reason written in a comment next to the value.
2. `shared/motionFlags.test.ts` — must fail if the default flips to `true`.
3. `client/src/lib/static-motion.tsx` — conditional shim:
   - `MOTION_HOME_ENABLED === false` → current behaviour (props stripped, plain `<div>`),
     **byte-identical output to today** when the flag is off;
   - `MOTION_HOME_ENABLED === true` → re-export the real `framer-motion` elements.
4. Wire the wrapper in `Home.tsx` and `Layout.tsx`, hero region only. Every duration and
   easing must be read from `shared/motionTokens.ts`. **No hardcoded durations.**
5. Tests must prove both branches, and must be shown to go red: prove it by mutating the
   flag default to `true` and showing the "flag off" test fails, then restore.
6. **Never flip the flag to `true` in a committed default.** It ships `false`.
7. Do not touch `ProvinceSolarScene.tsx`, `ProvinceYieldChart3D.tsx`,
   `SolarHeroScene.tsx`, `EnergyFlowShader.ts`, `HeroSlideshow.tsx` — Lane B2 owns the
   evidence for those and they are already modified in the working tree.

### LANE B2 — macmini worker — PKG-2, prove the 3D work or mark it unproven

1. `SolarHeroScene.test.tsx` and `EnergyFlowShader.test.ts`, covering: mount/unmount
   releases resources, DPR is capped at 2 and re-capped on resize, rAF stops on
   `document.hidden`, the canvas pauses when off-screen, `webglcontextlost` /
   `webglcontextlost`→`webglcontextrestored` are handled, `dispose()` is idempotent,
   `prefers-reduced-motion` yields one static frame, canvas is `aria-hidden` with a
   screen-reader fallback.
2. **Show the tests can fail.** Break `dispose()` on purpose, confirm red, restore,
   confirm green. Write both results in the report. A test you have not seen fail is an
   `unverified` line in the report, not a pass.
3. Check `SolarHeroScene.tsx` against the two existing components
   (`ProvinceSolarScene.tsx`, `ProvinceYieldChart3D.tsx`) and list every requirement it
   fails, if any.
4. `hero-solar-core/` — give a merge-or-delete verdict with reasons, then do it. Two
   competing solar hero implementations is a defect. Do not delete the unique parts:
   list what is unique before removing anything.
5. Add the two missing `.sha256` sidecars for R28a. Mechanical, and the digest must be
   the real one: `shasum -a 256 <file>` run from the directory that holds the file, and
   the sidecar line must contain the **basename**, not a path — a sidecar naming
   `reports/X.md` fails `shasum -c` when run from inside `reports/`.
6. R28a cites `Gate consumed: AUTHORIZE_ALL_AUTOMATIC_SAFE_PIPELINE`. That is a blanket
   approval and, per the estate rules, does **not** clear any individual item. Note the
   correction in your report. Do not rewrite R28a's history.
7. **Do not wire the hero into the home page.** Wiring waits on real LCP numbers (PKG-5).

---

## 5. DEFINITION OF DONE — identical for every lane

- [ ] No commit, no push, no deploy. Working tree only.
- [ ] No file edited outside your own row of the ownership matrix.
- [ ] No secret read, printed, logged, or written into any file or report.
- [ ] Code → has tests, **and the tests have been shown to fail on a deliberate break**.
      If you cannot demonstrate red, write `unverified` in the report. Do not write "pass".
- [ ] A report in `reports/` and a same-named receipt in `receipts/`.
- [ ] `.sha256` sidecar for both, each verified with `shasum -c` **run from its own directory**.
- [ ] Side effects declared truthfully:
      `network:` `provider_calls:` `deploy: false` `secrets_read: false`

---

## 6. GATES — each needs its own named approval

```
APPROVE_PAID_IMAGE_PROVIDER_CALL       → actually calling ChatGPT Image / Gemini to make images
APPROVE_MEDIA_PROMOTE_TO_PUBLIC        → quarantine/ → client/public/
APPROVE_EXTERNAL_LANE_DISPATCH         → SSH to the VM server = Lane C
APPROVE_NODE_REGISTRATION_VM_SERVER    → register the VM as an A2A node
APPROVE_PUSH_TO_MAIN_SIRINX_CO         → commit + push (push is the deploy path)
APPROVE_MOTION_HOME_ENABLED_TRUE       → flip the flag after LCP is measured
APPROVE_LANE_PROMOTION_TEST_COVERAGE   → carried finding CL-2
APPROVE_LANE_PROMOTION_REGISTER_TICKET → carried finding CL-4
```

"Approve everything" is **not** an approval of any one of these.

---

## 7. THE IMAGE QUESTION, ANSWERED PLAINLY

Two separate things are being conflated, so they are separated here.

**(a) Using a model to help think and write prompts** — text only, no image bytes.
This is what PKG-3b does. It needs no image gate.

**(b) Actually generating image files** by calling ChatGPT Image or Gemini image models.
This spends money against a provider and is `APPROVE_PAID_IMAGE_PROVIDER_CALL`. It has
**not** been granted and a budget cap has not been set, so it is not being done.

Also recorded, because the freebuff lane stated it itself and it is correct:
**freebuff cannot call ChatGPT Image or Gemini image generation as a tool.** It can write
Three.js, GLSL, SVG and CSS, and it can write prompt text. It cannot produce image files
from an image model. Any plan that promises otherwise through that lane is wrong.

Meanwhile the site already has **77 of 77 province illustrations rendered locally** from
real PVGIS data and real NOAA sun-position math, with no external image API at all. The
open question is not "can we get images" — it is which few remaining slots genuinely
need a generated image, and what they should depict. That selection is Lane A's job, and
it is the thing to decide before spending anything.
