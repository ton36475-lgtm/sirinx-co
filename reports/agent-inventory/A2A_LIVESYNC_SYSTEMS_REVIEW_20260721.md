# A2A LiveSync — Systems Engineering Review (QA lens)

Date: 2026-07-21 (Asia/Bangkok) · Reviewer role: senior full-stack engineer, external review session (Claude Cowork)
Repo: `/Users/sirinx/SIRINXDev/sirinx-co` · Branch: `agent/b1-b2-command-center` @ `1f05814` (dirty worktree, 5 ahead)

## Verdict

The A2A LiveSync architecture is sound and unusually disciplined. The core design decision — separating **configured → reported → observed → admitted** evidence tiers, with every capability flag fail-closed — is correct and consistently enforced across `a2a-sync.mjs`, `a2a-omniroute.mjs`, `connection-admission.mjs`, and the ACP probe. "Live sync to all agents" is not blocked by missing code; it is blocked by the repo's own admission contract, which is working as designed. The fastest path to live is to finish the contract's runway (disk, migration 0007, one canary peer), not to bypass it.

Strengths worth keeping: loopback-only Hermes probe that discards raw payloads; initialize-only ACP probe with isolated `HOME`, output caps, and SIGTERM→SIGKILL teardown; idempotency cache + body limits + fail-closed live auth on `POST /api/a2a-sync/plan`; single-source-writer (Codex) lease rule; Truth Protocol status strings that never overclaim.

## Agent-by-agent state (cmux, observed 2026-07-21 20:06)

| Agent | State | Blocking issue | Owner action |
|---|---|---|---|
| Hermes CLI | HTTP 401 from z.ai (`glm-5.2`) | expired/invalid provider API key | renew key at provider, run `hermes setup` (human-only; never store the key in repo) |
| OpenCode | testing `orchestrate-codex-worker.sh` (1 test passing; ~25 needed) | that script lives in the `affaan-m__ECC` intake copy, not in `sirinx-co` — decide where hardening lands before writing 25 tests against a vendored path | approve its Tier-A plan only after choosing the canonical location |
| AGY / Antigravity | running, healthy | was **absent from the A2A registry** — unroutable | fixed in this review (see below) |
| Codex | queue-driven per `CODEX_HANDOFF.md`; latest receipts: B3 route-parity static inventory, A33 effect-authority (0007 frozen), B10 surface inventory — all `PRODUCTION_HOLD` | disk below 15 GiB floor (14.4 GiB sampled); migration 0007 absent; PR #1 unreviewed | free disk, review PR, then let Codex implement 0007 |
| Claude Cowork | this session | sandbox could not start (same disk floor) | same disk action |

## Findings

**F1 — Bug (fixed): blocked-goal regex precedence.** `dangerousGoalRules` and the OmniRoute `dangerousPatterns` used ungrouped alternations (`/\bline|dm|…|customer message\b/`), which bound only the first and last alternative. Concrete false positive: any goal containing "linear" (a configured MCP server) was blocked as `customer_message_send`; "dmg" matched `dm`. All alternations are now grouped; the fail-safe over-blocking direction is preserved.

**F2 — Gap (fixed): Antigravity unregistered.** AGY was live in cmux but had no agent entry, lane, route, tmux definition, or card alias, so no sync plan could target it. Registered as `antigravity` (alias `agy`) with status `registered-unverified-runtime`, per the admission contract — configuration, not a claimed handshake. Registry contract moves 15→16 agents/lanes/sessions, 23→25 routes; all six count-coupled test files updated in lockstep.

**F3 — Operational: Hermes 401.** Provider-side credential expiry, not repo code. No secret handling was performed in this review.

**F4 — Operational: disk floor breached everywhere.** 14.4 GiB free < the 15 GiB admission floor. This simultaneously holds Codex admission, blocked this session's test runner, and is step 1 of the rollout plan in `MCP_A2A_CONNECTION_PLAN.md`. It is the single highest-leverage unblock.

**F5 — Process risk: same prompt broadcast to four agents.** The identical "handshake all agents" instruction was given to OpenCode, AGY, Hermes and this session. Governance allows exactly one source writer (Codex lease). Concurrent writers on one dirty worktree will collide. Recommendation: route implementation work through the pending-work queue; use non-Codex agents for review/evidence only. Note: this session edited 8 JS files under your direct instruction — they are uncommitted; have Codex/PR review them before commit to stay inside the lease rule.

**F6 — Design gap (known, roadmap): no message persistence.** `notificationRecorded` is always `false`; sync plans and delivery receipts are not durably stored until the Postgres authority (0005/0007) lands. Until then, "live sync" receipts exist only in HTTP responses.

**F7 — QA posture.** Test discipline is excellent (negative-path, forgery, fail-closed tests throughout). Weak spots: count-coupled literals in six files make registry changes brittle (consider deriving expected IDs from one fixture); `runtime-agent-cards` has no card/principal for `antigravity` yet (deliberate — add one only when an execution principal is defined); the vendored ECC worker script has 1/25 of its required tests.

## Changes made in this review (uncommitted)

`services/dev-control-api/src/`: `a2a-sync.mjs` (agent row + regex fix), `a2a-omniroute.mjs` (lane, 2 routes, tmux session, alias, regex fix, version 1.4→1.5), and test-literal updates in `a2a-sync.test.mjs`, `a2a-omniroute.test.mjs`, `codex-autoloop.test.mjs`, `server-a2a-routes.test.mjs`. No governance, gate, or capability semantics were changed; every new surface starts unverified/fail-closed.

## Verification (run after freeing disk — not yet executed)

```bash
cd /Users/sirinx/SIRINXDev/sirinx-co
npx vitest run services/dev-control-api/src/a2a-sync.test.mjs \
  services/dev-control-api/src/a2a-omniroute.test.mjs \
  services/dev-control-api/src/server-a2a-routes.test.mjs \
  services/dev-control-api/src/codex-autoloop.test.mjs
npm run check
```

Static cross-check completed: all `15/23`-pinned assertions in the workspace were inventoried; the six updated files are the complete set (remaining `toBe(15)` hits are the separate connector registry and runtime-agent-cards, both untouched and still correct).

## Ordered path to actual live sync (from the repo's own contracts)

1. Free ≥15 GiB (unblocks Codex admission, test runs, and this plan's step 1).
2. Renew the z.ai key; `hermes setup` (human).
3. Run the verification block above; commit via the Codex lease/PR flow.
4. Review draft PR #1 and today's B3/A33/B10 receipts.
5. Let Codex implement migration 0007 (13 action/circuit rows, all HOLD).
6. Read-only evidence pass: `GET /api/omniroute?probeHermes=true` + ACP initialize probes (kimi/opencode/copilot/hermes-check) — evidence stays `reported-not-admitted`, as designed.
7. One canary peer only: `CONNECTOR_ACTIVATION` ticket → A2A TCK + security negatives → single-use `A2A_EGRESS` grant. Never all peers at once.
8. Telegram lane live send: durable OPS-TG gate + explicit `dryRun=false` per message, receipts recorded against the ticket.
