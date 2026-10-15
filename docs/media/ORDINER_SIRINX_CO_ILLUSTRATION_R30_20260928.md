# ORDINER SIRINX-CO-ILLUSTRATION-2026-09-28 (R30)

```
═══════════════════════════════════════════════════════════════════
repo:     /Users/sirinx/SIRINXDev/sirinx-co     branch: main (dirty)
issued:   2026-09-28  ·  issuer: jcode (Lane B, macmini M2)  ·  gates consumed: NONE
copy:     identical text to every lane. Read this file first. Do not
          ask the issuer to re-send it.
═══════════════════════════════════════════════════════════════════
```

## 0. What R29 already finished. Do not redo it.

R29 is done and red-proved. Reading it first saves you from duplicating work:

| Done | Where |
| --- | --- |
| motion tokens + red-proofed tests | `apps/public-web/shared/motionTokens.ts` + `.test.ts` |
| motion flag + red-proofed tests | `apps/public-web/shared/motionFlags.ts` + `.test.ts` |
| WebGL defects fixed (reduced motion, context loss, screen-reader text) | `components/three/ProvinceSolarScene.tsx`, `ProvinceYieldChart3D.tsx`, `SolarHeroScene.tsx` |
| LCP measured on production: 684 ms desktop / 916 ms mobile, CLS 0.000 | `docs/media/WEBGL_PERF_BUDGET_20260928.md` |
| Real-build acceptance on `/` and `/solar-carport/bangkok/` | `docs/3d/R29_REAL_BUILD_ACCEPTANCE_20260928.md` |
| Motion flag A/B measured, both variants rendered | `docs/3d/MOTION_FLAG_AB_MEASUREMENT_20260928.md` |
| Art direction brief + data-bound prompt set (77/77 provinces) | `docs/media/ART_ENGINEERING_BRIEF_20260928.md`, `docs/media/prompts/` |
| Image generation pipeline, dry-run default | `docs/media/generate-illustrations.mjs` |

Current verified state: **47 test files / 358 tests pass**; `https://www.sirinx.co/` 200.

## 1. PRE-FLIGHT — every lane, no exceptions

```
1. cd /Users/sirinx/SIRINXDev/sirinx-co && git status
2. Read AGENTS.md in the repo before you touch anything.
3. NO commit. NO push. NO deploy. NO git clean / checkout -- / stash / reset.
   The working tree holds 30+ uncommitted files from R29. One `git clean`
   destroys the whole round. This is the single most expensive mistake
   available to you right now.
4. Touch ONLY the files listed under your OWNERSHIP. Another lane is
   writing in the same tree at the same time.
5. NO paid API call, NO image-provider call, NO install, NO SSH off this
   machine without its own named approval string.
6. Never read or print a secret. Resolve keys at run time; never log them.
7. If you hit a gate: write a proposal, stop, do not wait and do not
   substitute your own judgement.
```

## 2. LANE OWNERSHIP — one package per lane, no overlap

| lane | host | package | files you own |
| --- | --- | --- | --- |
| **A** | freebuff in cmux | **R30-P1** hero duplicate | `docs/3d/HERO_DUPLICATE_DECISION_20260928.md`, and `components/three/SolarHeroScene.tsx` **only if** your verdict is "merge" |
| **B** | hermes on macmini M2 | **R30-P4** image readiness + **R30-P6** safety | `docs/media/IMAGE_EXECUTION_READY_20260928.md`, `.media-staging/_quarantine/**` |
| **C** | hermes on VM server | **R30-P5** independent measurement | `reports/SIRINX_CO_VM_MEASUREMENT_20260928.md` on the VM. **Nothing in this repo.** |
| **D** | macmini M2, any free agent | **R30-P2** motion Layout | `components/Layout.tsx`, `shared/motionTokens.ts`, `docs/3d/MOTION_FLAG_AB_MEASUREMENT_20260928.md` (append only) |
| **E** | macmini M2, any free agent | **R30-P3** illustration delivery | the new 3D components and pages named in §4 |

If you are a lane with no package assigned, take **R30-P2** or **R30-P3**. Take exactly one.

---

## 3. R30-P1 — SOLAR HERO DUPLICATE RESOLUTION  [Lane A]

**The problem, stated precisely.** Two solar-hero implementations exist at once:

```
components/three/SolarHeroScene.tsx   wired:  HeroSlideshow.tsx:343  · tested · in the build
client/src/hero-solar-core/          untracked, 4 files, NOT wired, 404 in production
```

`hero-solar-core/` holds `hero-solar-core.ts`, `solar-core.css`, `hero-preview.html`,
`README.md`. It is untracked, so it is invisible to `git status --porcelain` output most
people skim, and it is the first thing a `git clean -fd` deletes.

**Deliver:** `docs/3d/HERO_DUPLICATE_DECISION_20260928.md`

1. Read both implementations. Write what each one actually does, in a table: technique,
   shader, particle count, lifecycle handling, a11y, reduced-motion, test coverage,
   bundle cost.
2. Give a verdict of **merge** or **delete**, with the reason. If merge: list the specific
   features that must move into `SolarHeroScene.tsx`, and the reason each earns its bytes.
   If delete: state what is lost, and whether it is already covered.
3. If and only if the verdict is merge, you may edit `SolarHeroScene.tsx`. If the verdict
   is delete, **do not delete anything** — write the verdict and stop. Deleting is the
   issuer's call, not yours.
4. Whatever the verdict, your test must be able to go red. If you merge, prove the
   merged file still fails its tests when you break `dispose()`.

**Out of scope:** do not touch `HeroSlideshow.tsx`, do not touch Home.

---

## 4. R30-P3 — ILLUSTRATION DELIVERY ON THE REAL ROUTES  [Lane E]

This is the point of the whole round: **illustrations on the actual website pages.**

From `docs/media/ILLUSTRATION_COVERAGE_20260928.md` §2, Priority 1 and 2 are still open:

| priority | route | what is missing |
| --- | --- | --- |
| P1 | `/` | Master hero visual (Concept A). `SolarHeroScene` now covers the 3D half — say so if it already satisfies this, do not build a second hero |
| P1 | `/solar-carport` | 3D exploded technical diagram of the carport structure (Concept C) |
| P2 | `/strategy` | AI energy command-center hologram (Concept B) |
| P2 | `/solutions` | BESS container industrial product visual (Concept D) |

**Deliver at least one**, and be honest if a slot is already satisfied by existing work.

Hard requirements, inherited from the components R29 already shipped:

- dynamic `import()` + lazy, never a static `import * as THREE` in an entry chunk
- DPR capped at 2, re-capped on resize
- rAF paused on `document.hidden` and when the canvas leaves the viewport
- `webglcontextlost` handled, `webglcontextrestored` recovers, fallback text shown in between
- `dispose()` idempotent, returns geometry, material, texture, renderer
- `prefers-reduced-motion` → exactly one static frame
- canvas `aria-hidden` with a real text alternative via `aria-describedby`
- alt text citable on its own, and every number in it read from
  `shared/provinceEnergyData.ts` or `shared/sunMath.ts`, never typed by hand
- tests that go red on a real defect, not just on a changed assertion

**Out of scope:** no provider image API. If a slot genuinely needs a generated bitmap,
write the prompt into `docs/media/prompts/` and stop.

---

## 5. R30-P2 — MOTION: TOKENISE LAYOUT, THEN RE-MEASURE  [Lane D]

`MOTION_HOME_ENABLED` is `false` and the A/B measurement says turning it on costs
**+4 ms desktop, +8 ms mobile, CLS unchanged**. It is still not flipped, for one reason:
`components/Layout.tsx` still has hardcoded timings, so flag-on leaves the layout
animating on values nobody controls.

**Deliver, in this order:**

1. Replace the hardcoded timings in `Layout.tsx` with `shared/motionTokens.ts` values.
2. Extend `motionTokens.test.ts` to cover anything you add.
3. Re-run the A/B measurement with the tokenised Layout, flag on and off, ≥3 samples per
   variant per viewport, and append the result to
   `docs/3d/MOTION_FLAG_AB_MEASUREMENT_20260928.md`. Restore the flag to `false`
   afterwards and verify the restore by reading the file and re-running the flag tests.
4. Write the recommendation, in numbers, for `APPROVE_MOTION_HOME_ENABLED_TRUE`.

**Do not flip the flag.** Measure it, recommend it, leave it where it is.

---

## 6. R30-P4 — IMAGE GENERATION: EXECUTION READINESS  [Lane B]

No image has ever been generated. The pipeline exists and defaults to dry-run. Nothing
here spends money.

**Deliver:** `docs/media/IMAGE_EXECUTION_READY_20260928.md`

1. Run `docs/media/generate-illustrations.mjs` in its default mode. Prove it runs. Paste
   the actual output, not a description of it.
2. Show that `--execute` refuses to run without its approval token present in the
   environment. Prove the refusal by showing the refusal.
3. Take the 3 selected slots in `docs/3d/IMAGE_SYNTHESIS_PROMPT_CATALOG_20260928.md` §2c
   and give an **exact cost ceiling per slot** in THB and USD, at the real published
   price for the model named. If a price cannot be verified from a primary source, say
   "unverified" and do not estimate.
4. State the single command the Commander runs after approving, and exactly where the
   output lands (`.media-staging/_quarantine/` only).
5. Confirm the prompts bind to real data. `docs/media/prompts/prompts-bound-20260928.json`
   was generated at 08:43 today — verify it still matches
   `shared/provinceEnergyData.ts` and re-run `build-from-real-data.mjs` if it has drifted.

---

## 7. R30-P5 — INDEPENDENT MEASUREMENT FROM THE VM  [Lane C]

Local measurements are complete but they are one machine's numbers. This lane exists to
be a second opinion, not to unblock anything.

**Read-only. Nothing may be written into the sirinx-co repository from the VM.**

1. Confirm the host before anything else: `hostname`, `uname -a`, `free -h`.
2. Measure `https://www.sirinx.co/` and `/solar-carport/bangkok/` from there: LCP, CLS,
   INP, and frame pacing while a canvas is animating.
3. Report the numbers, and report the machine they came from. A number without its host
   is not evidence.
4. If the VM cannot do this without installing a browser stack, **stop and write that
   down**. Installing on the VM is an install and needs its own approval. Do not install.

---

## 8. DEFINITION OF DONE — every package, no exceptions

```
□ no commit, no push, no deploy, no git clean/checkout/stash/reset
□ no file touched outside your OWNERSHIP
□ no secret read, printed, or written into a file, a log, or a report
□ if it is code: it has tests, AND you have demonstrated the test goes red
   on a real defect. If you cannot show that, write "unverified" in the report.
   Writing "passing" without a red proof is the failure mode this project keeps hitting.
□ report in reports/ AND a same-stem receipt in receipts/, with .sha256 sidecars
   whose path is a BASENAME, so `shasum -c` passes from inside the directory
□ the report ends with an honest side-effect line:
     network: ? · provider_calls: 0 · install: false · secrets_read: false · deploy: false
```

## 9. GATES — each needs its own named string. "Approve everything" clears none of them.

```
APPROVE_MOTION_HOME_ENABLED_TRUE     flip the flag after R30-P2 measures it
APPROVE_PAID_IMAGE_PROVIDER_CALL     run R30-P4 with --execute, WITH a budget cap
APPROVE_MEDIA_PROMOTE_TO_PUBLIC      move files out of .media-staging/_quarantine/
APPROVE_HERO_DUPLICATE_DELETE        delete hero-solar-core/ once P1 says delete
APPROVE_EXTERNAL_LANE_DISPATCH       SSH to the VM server, and any install on it
APPROVE_PUSH_TO_MAIN_SIRINX_CO       commit + push; a push is a deploy
APPROVE_NODE_REGISTRATION_VM_SERVER  register the VM as an A2A node (not needed for R30)
```

## 10. Reporting back

When your package is done, write the report and receipt, then post one line to the
issuer:

```
<LANE> PKG=<id> STATUS=<done|blocked|partial> RED_PROOF=<yes|no|unverified> GATES=<names or none>
```

Do not summarise what you plan to do. Report what is on disk.
