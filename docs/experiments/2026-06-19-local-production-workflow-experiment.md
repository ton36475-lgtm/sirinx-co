# Local Production Workflow Experiment - 2026-06-19

## Scope

This report records a local-only experiment on the current SIRINXDev / GHOSTCLAW working tree.

Hard boundaries:

- No deploy
- No push
- No provider call
- No live Telegram send
- No live Facebook publish
- No external mutation
- No secret printing

Repository state at experiment time:

- Project root: `/Users/sirinx/SIRINXDev/sirinx-agent-native-os`
- Branch: `feat/unified-agent-native-monorepo`
- Latest relevant commit: `aa926e2 fix(mission-control): guard browser command execution`
- Active dirty lanes remain present and must be staged separately.

## Research Question

Can the current local program be improved from prototype assets and dashboard screens into a real, safer production workflow without crossing external execution boundaries?

## Hypotheses

### H1 - Mission Control Can Be Production-Ready If Browser Runtime Execution Is Guarded

If the browser dashboard does not directly import or execute local shell/runtime adapters, then Mission Control can safely become a visible command dashboard while delegating risky execution to an approval-gated backend bridge later.

### H2 - Content Factory Can Already Produce Real Draft Work Artifacts

If the content factory can generate a complete local artifact pack from the current brand and pipeline definitions, then it is already useful as a draft production workflow even before live publishing is enabled.

### H3 - Shared Packages Can Support a Local Product Workspace

If shared packages and local dashboard packages build cleanly, then the repo has enough technical foundation to continue toward a local creative operating system, provided generated files and source lanes are committed separately.

## Experiment Matrix

| Area | Test | Result | Interpretation |
| --- | --- | --- | --- |
| Mission Control | Typecheck and production build | Passed | The guarded dashboard builds cleanly after removing direct browser-side command execution. |
| Mission Control | Search generated output for browser-external/node-only leaks | Passed | No detected `__vite-browser-external`, `child_process`, `OpenHandsAdapter`, or direct `executeCommand` usage remained in the built Mission Control output. |
| Content Factory | Build package | Passed | The local content pipeline package is buildable. |
| Content Factory | Run dry-run artifact generation | Passed | The pipeline generated a full draft pack locally without live publish. |
| Shared Foundation | Build config/types/dev-command-center packages | Passed | Shared packages are viable for local product wiring. |

## Evidence

### Mission Control Guard

Observed behavior after the guard change:

- Mission Control typecheck passed.
- Mission Control build passed.
- The previous Vite browser-external warning for Node-only modules was no longer observed.
- Generated Mission Control output did not contain direct references to the guarded execution adapter patterns.

Scientific conclusion:

The dashboard can safely display command intent, logs, status, and approval state, but direct local command execution should remain blocked in the browser. A backend bridge can be tested later under an explicit local-only approval gate.

### Content Factory Dry Run

Dry-run output directory:

`/tmp/ghostclaw-experiment-20260619/2026-06-19`

Generated counts:

- Episodes: 2
- Posts: 2
- Image jobs: 2
- Video jobs: 2
- QC jobs: 2
- Publish jobs: 2
- Files: 16

Generated artifact pack:

- `approval-packet.md`
- `daily-money-plan.md`
- `facebook-live-publish-contract.json`
- `facebook-posts.json`
- `facebook-posts.md`
- `image-prompts.json`
- `image-prompts.md`
- `pipeline-board.md`
- `pipeline-manifest.json`
- `publisher-dry-run.json`
- `schedule-queue.json`
- `telegram-work-report.md`
- `video-production-queue.json`
- `video-production-queue.md`
- `video-qc-checklist.json`
- `video-qc-checklist.md`

Safety signals:

- `livePublishEnabled` remained `false`.
- Live publish remained blocked by approval.
- The required live gate was recorded as `APPROVE_ADS_ANDROMEDA_FACEBOOK_LIVE_PUBLISH`.
- The Facebook publish contract required environment-provided credentials instead of embedding secrets.

Scientific conclusion:

The system already has a real local draft-production loop: content plan, image prompts, video queue, QC checklist, scheduling, publisher dry-run, and approval packet. It is not just a placeholder, but it is not yet a live production publisher.

## Falsifiability

These hypotheses should be considered false or incomplete if any of the following occurs:

- H1 fails if Mission Control requires browser-side shell execution to complete core workflows.
- H1 remains incomplete until a backend execution bridge exists with explicit approval gates and audit logs.
- H2 fails if the content factory cannot generate a new artifact pack from a different brand or campaign brief.
- H2 remains incomplete until human QC can score output quality beyond schema completion.
- H3 fails if shared packages only build because of untracked/generated local state that is not documented and reproducible.

## What Is Real Now

The current program can already support:

- Local production planning
- Local storyboard and content pack generation
- Local prompt and video task queues
- Local QC checklist creation
- Local approval-packet creation
- Browser-visible Mission Control build
- Safe blocking of live publish and browser command execution

## What Is Not Real Yet

The current program should not yet be treated as production-ready for:

- Live provider calls
- Live Telegram sending
- Live Facebook publishing
- Public deployment
- Browser-driven local shell execution
- Autonomous external mutation
- Paid API routing
- Customer-facing publishing without human review

## Improvement Path

### Experiment 1 - Backend Bridge Under Guard

Gate:

`APPROVE_MISSION_CONTROL_LOCAL_BACKEND_BRIDGE_EXPERIMENT`

Goal:

Create a localhost-only backend bridge that receives approved command packets from Mission Control, validates policy, writes audit events, and executes only a small allowlist of safe read-only commands.

Success criteria:

- Browser never imports Node shell modules.
- All execution requests pass through approval and policy validation.
- Audit log records command intent, actor, timestamp, and result.
- Default mode remains dry-run.

### Experiment 2 - Dashboard Imports Content Factory Packs

Gate:

`APPROVE_CONTENT_FACTORY_DASHBOARD_IMPORT_EXPERIMENT`

Goal:

Load the generated content factory artifact pack into Mission Control or Dev Command Center so operators can inspect episodes, prompts, video jobs, QC state, and approval packets visually.

Success criteria:

- Dashboard can load `pipeline-manifest.json`.
- Dashboard can render image/video/publish job status.
- Dashboard does not call live publishers.
- Approval state is visible and blocked by default.

### Experiment 3 - QC Scoring Loop

Gate:

`APPROVE_CONTENT_FACTORY_QC_SCORE_EXPERIMENT`

Goal:

Add local deterministic QC scoring for completeness, missing captions, prompt length, required brand fields, risk flags, and approval readiness.

Success criteria:

- QC scores are reproducible.
- Failed checks explain the missing field or risk.
- No provider call is required.
- Human review remains mandatory before live publishing.

## Risk Register

| Risk | Level | Mitigation |
| --- | --- | --- |
| Dirty worktree still contains multiple lanes | High | Stage and commit only one approved lane at a time. |
| Generated `/tmp` artifacts are ephemeral | Medium | Promote selected dry-run output into a tracked fixture only after approval. |
| Live publishing could leak if gates are bypassed | High | Keep `livePublishEnabled=false` and require explicit live gate. |
| Browser command execution is dangerous | High | Keep browser execution blocked; build backend bridge separately. |
| Content quality may pass schema but fail human standards | Medium | Add deterministic QC plus human review workflow. |
| Generated dist/source changes may mix with docs | Medium | Keep dist/generated/source/docs/package lanes separate. |

## Recommendation

Continue development, but treat the system as a local creative production lab until the next guarded experiments pass.

Recommended next gate:

`APPROVE_STAGE_AND_COMMIT_EXPERIMENT_REPORT_ONLY`

After that, the next useful technical experiment is:

`APPROVE_CONTENT_FACTORY_DASHBOARD_IMPORT_EXPERIMENT`

This gives the current local artifacts a visible operating surface without enabling live publish or external mutation.
