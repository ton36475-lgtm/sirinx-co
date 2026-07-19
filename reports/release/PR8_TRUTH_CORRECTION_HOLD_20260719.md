# PR #8 Release Hold — Truth Correction

- Observed at: 2026-07-19T14:10:01+07:00
- Repository: `ton36475-lgtm/sirinx-co`
- Pull request: `#8`
- Remote head: `b7ba23f86471797e330d334de4d6112813b45a9e`
- Superseded local candidate: `929681a`
- Truth-corrected parent: `41bfffa846a269bd0d24bd305f26adec45e0c054`
- Release subject: the exact commit containing this receipt on
  `codex/pr8-release-candidate-20260719`
- Receipt state at authoring: staged, uncommitted; final SHA unresolved
- Canonical receipt rule: only the commit object containing this file is
  immutable evidence
- Decision: **HOLD — TRUTH CORRECTION**

This is a local evidence record, not a push, CI retry, review, merge approval,
gate decision, deployment ticket, or production receipt. Resolve the exact
release subject with `git rev-parse HEAD` only from a clean candidate worktree
after this file is committed. Any later commit creates a new subject and makes
SHA-bound receipts stale.

## Why `929681a` was superseded

The deep-research truth protocol found release-critical claim drift. The
docs-only commits `407355f` and `41bfffa` correct the scoped claims:

- `.claude/agents/` contains 6 agent definition files.
- `crates/sirinx-agents/src/ronin.rs` contains 4 coded lead-agent
  implementations.
- `.claude/skills/` contains 50 direct skill directories.
- `MASTER_PLAN.md` A6 now says the cross-node client loop and external live
  smoke are unverified.
- `MASTER_PLAN.md` A9 now distinguishes the 47-slot architecture from the 6
  definition files and 4 coded Rust agents; skill-directory presence is not
  executable readiness.
- Kimi K3 is a declared OpenRouter lane, but it remains paid-API approval
  required with `canCallProvider: false`.
- The model-routing approval contract still states
  `providerCallRouteExists: false`; no provider inference receipt exists.
- Telegram still uses a module-level `telegram_send` state of `hold`; this is
  not proof of hydration from the durable control-gate store.

The full research artifact is
`/Users/sirinx/SIRINXDev/sirinx-co/reports/agent-inventory/SIRINX_AGENT_MESH_DEEP_RESEARCH_20260719.md`.

## Current release matrix

| Stage | Current evidence | Decision |
|---|---|---|
| Scoped internal truth correction | Corrected locally in `407355f` and `41bfffa`; exact counts rechecked in the candidate worktree | **LOCAL PASS** for the listed claims only |
| Artifact/SHA binding | Last-observed local images were tagged only for `929681a` and carried no OCI revision label; at 14:10 +07 the Docker daemon socket was unavailable, so current image state was not reverified | **STALE/UNVERIFIED — REBUILD/RE-FINGERPRINT REQUIRED** |
| Billing lock | GitHub check annotation says the job was not started because the account is locked due to a billing issue | **BLOCKED — ACCOUNT OWNER** |
| GitHub CI | Run `29652380775` at remote head `b7ba23f…` completed failure; all 3 jobs have `steps: []` | **NOT EXECUTED** |
| Migrations 0003–0004 | A previous disposable Postgres 17 pass was reported for the superseded candidate, but no exact durable receipt path/digest is present in this candidate and the result was not independently reverified here | **REPORTED, NOT INDEPENDENTLY VERIFIED; EXTERNAL CI UNPROVED** |
| Authenticated browser smoke | No fresh protected-target receipt bound to the final SHA | **UNVERIFIED** |
| Independent review | PR has no current approval decision for the final SHA | **MISSING** |
| PR #8 | Open Draft, remote head `b7ba23f…`, merge state `UNSTABLE`; corrected local commits are not pushed | **HOLD** |
| `sirinx-web` deploy | Tracked defaults and migration seed set `deploy=hold`; current hydrated durable gate state was not reverified. No exact immutable final-SHA artifact, target, single-use ticket, or tested rollback receipt exists here | **BLOCKED/UNVERIFIED** |
| `sirinx-control` deploy | Must use a separate target, artifact, ticket, nonce, and rollback receipt | **BLOCKED** |

Billing unlock alone cannot clear this hold.

## Artifact lineage

The tracked Docker build-input fingerprint for `929681a`, `41bfffa`, and the
architecture branch head `00094da` is identical:

```text
af3d379e6093295089c7446c98fb2b2004737546
```

That fingerprint is the Git hash of the `git ls-tree -r` listing for
`Dockerfile`, `.dockerignore`, `Cargo.toml`, `Cargo.lock`,
`rust-toolchain.toml`, and `crates/`. It proves equality of those tracked build
inputs across the listed commits; it does not by itself prove that an image was
built, tested, or bound to the final release subject.

The following artifacts were last observed earlier in this session, before the
Docker daemon became unavailable. They are potential cache inputs only, not
current-state or final-SHA receipts:

| Service | Superseded tag | Last-observed local image digest |
|---|---|---|
| `sirinx-web` | `sirinx-web:pr8-929681a` | `sha256:752254980226a6fe51677e306a1fc2b752cf0314d6ea28bf9dbbfed17f9f0e0e` — **LAST-OBSERVED / UNVERIFIED** |
| `sirinx-control` | `sirinx-control:pr8-929681a` | `sha256:5088f07c5cda0aeca33969732d17bca7b5682c5cfcf08a38abb4222db41a4cc4` — **LAST-OBSERVED / UNVERIFIED** |

## Required order to leave HOLD

1. Commit this receipt and resolve the final clean local candidate SHA.
2. Re-run focused governance/Rust validation and disposable Postgres migrations
   0003–0004 against that SHA.
3. Re-run both Docker target builds with final-SHA tags after recording the
   build-input fingerprint; inspect immutable image digests and run disposable
   local semantic/auth/held-gate smoke. A deterministic cache hit is acceptable
   only when the build command, resulting digest, and inputs are recorded;
   merely adding a new tag without a build receipt is not sufficient.
4. The account owner resolves GitHub billing. Then, and only with explicit push
   authority, push the exact reviewed SHA and obtain a fresh CI run with real
   steps.
5. Run authenticated browser smoke against the approved protected target and
   bind the receipt to the exact SHA.
6. Obtain independent review and a separate exact merge authorization.
7. Rebuild/promote from the reviewed merge SHA and deploy `sirinx-web` and
   `sirinx-control` separately through authoritative, expiring, single-use
   tickets with exact targets and tested rollback receipts.

## Fail-closed rules

- Do not push, rerun CI, mark ready, merge, publish, deploy, open a gate, call a
  paid provider, or send Telegram under this receipt.
- Do not treat `packetShapeValid`, a local image tag, an empty CI job, a browser
  screenshot, or a displayed cmux pane as execution authority.
- Treat timeout or ambiguous external state as `UNKNOWN`, never as success and
  never as permission to retry a mutation automatically.
- Keep the main worktree's unrelated untracked research artifacts untouched.
