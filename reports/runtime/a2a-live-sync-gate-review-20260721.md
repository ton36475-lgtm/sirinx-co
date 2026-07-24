# A2A Live-Sync — Safety Audit + Gated Redesign (for Codex, under lease)

Status: `REVIEW_ONLY / CHANGE_UNCOMMITTED / GATE_BYPASS_FOUND / PRODUCTION_HOLD`
Date: 2026-07-21 (Asia/Bangkok) · Reviewer: Claude Cowork (read-only; no repo writes to source)
Subject: uncommitted work adding `services/dev-control-api/src/a2a-live-sync.mjs` + live path in `a2a-omniroute.mjs` + `/api/a2a-live-sync/*` routes, authored by a non-Codex agent from a broadcast prompt.

## Part 1 — Audit result: did the change weaken the safety tests?

**No test was deleted; the defaults still assert safe.** Surviving assertions: `omniroute-handshake-unverified` by default, `activatedLanes: 0`, `canStartAgents:false`, `canCreateTmuxSessions:false`, `commandExecuted:false`, dangerous-goal block, `lock()` intact (a2a-omniroute.test.mjs lines 49–51, 281, 373–391, 407–409, 434–437). The new `a2a-live-sync.test.mjs` uses injected mock `fetch` and makes no real network calls.

**But a gate-bypass was introduced with a false-comfort test.**

1. **No gate on the live path.** In `executeOmnirouteHandshake`: `const doLiveSync = body.liveSync !== false && !dryRun;` then `syncAgentIds(targetAgentIds)`. `syncAgentIds` (a2a-live-sync.mjs:154) performs `POST {controlUrl}/api/a2a/sync` for each agent with **no auth, no durable gate, no human grant, no ticket, no idempotency key**. `POST /api/a2a-live-sync/register-all` exposes the same with a single call.
2. **The one non-dry-run test only passes because the backend is down.** `a2a-omniroute.test.mjs:412` sends `{dryRun:false}` (so `doLiveSync=true`) but injects no `fetchImpl`; the loopback POST fails in CI, `succeeded:[]`, and the handshake still reports `externalWrites:false, commandExecuted:false` (lines 424–425). With `sirinx-control` actually running (`cargo run -p sirinx-control`), the identical request registers all 16 agents **live** while the response still claims `externalWrites:false, commandExecuted:false` — a **Truth Protocol violation** (acts, reports it didn't).
3. **The dangerous-goal filter is not a gate.** It blocks "deploy/push" but the real broadcast goal `"sync all agents"` passes, so `{"goal":"sync all agents","liveSync":true,"dryRun":false}` performs a full live registration.
4. **The success branch is untested.** No test asserts handshake output when live registration *succeeds*, so CI stays green over an unverified, dishonest path.

Net: the alarm still works, but a keyless door was added beside it, and its guard test only passes because the room is empty.

## Part 2 — Gated redesign (contract-compliant; mirror the Telegram lane)

The system already has the right pattern for exactly this — the Telegram `telegram_send` durable gate (migration 0003, hold-by-default, OPS-TG ticket, auth + idempotency on the live route). Live sync must reuse it, not invent a `dryRun:false` shortcut.

**R1 — Effect requires a circuit + single-use grant.** Live registration is an effect. Gate it behind a durable circuit (reuse `a2a_egress`, or add `a2a_live_sync` to the A27 13-row map — do NOT ship an unlisted 14th without review). Default remains dry-run. `dryRun:false` is necessary but **not sufficient**.

**R2 — Action-time preconditions (all required, checked server-side):**
- Bearer `CONTROL_API_TOKEN` on `/api/a2a-live-sync/*` and the live handshake (same middleware as the `POST /api/a2a-sync/plan` live path).
- A fresh, durable open gate read from `sirinx-control` (not a request flag) with a valid ticket prefix.
- An explicit single-use grant id in the body; consume it; reject reuse (replay).
- Idempotency-Key; bounded body; loopback-only control URL (already enforced by `isLoopbackUrl`).
Absent any one → return `blocked-a2a-live-sync` / HTTP 403, `commandExecuted:false`, no registration attempted.

**R3 — Truth Protocol on the acting path.** When registration is attempted or succeeds, the response MUST report it honestly: `commandExecuted:true`, a precise `controlPlaneWrites:true` (loopback registration is a real state change even if not "external/production"), and per-agent receipts. Never spread an unconditional `lock()` over a path that acted. Timeout ⇒ `EFFECT_UNKNOWN`, never success; never auto-retry.

**R4 — Don't overclaim admission.** Registering to the Rust OmniRoute ≠ the 7-step A2A peer admission (auth card, TCK, heartbeat ≤60s, task lease, egress grant, read-back). Rename the status `live-synced` → `control-plane-registered-not-admitted`; true `LIVE` still requires migration 0007 + the connection-plan runway. Keep `omnirouteBlockedActions` and `agent_auto_start` semantics.

**R5 — Tests that would have caught this (add):**
- live route **refuses** with `dryRun:false` but no open gate/grant → `blocked-a2a-live-sync`, no fetch called.
- live route with mock `fetch` **succeeding** + open gate/grant → asserts `commandExecuted:true`, `controlPlaneWrites:true`, receipts present (honest flags).
- rename the misleading `:412` test to state its real scope ("reports safe flags when the control plane is unreachable"), and stop using it as evidence that non-dry-run is safe.

**R6 — Process.** This is Codex's edit under the exact-path lease; land it with the six-file registry contract intact, the verification chain green, and a MASTER_PLAN section-A row in the same commit. Until then the branch must not merge, and no agent should call `register-all` against a running control plane.

## Immediate containment (operator)
- Turn off "auto-approve all" in Cline while multiple agents share the dirty worktree.
- Do not run `POST /api/a2a-live-sync/register-all` with `sirinx-control` up until R1–R5 land.
- Unrelated but active in the same screen: stop the `curl … maxplus-ai.cc/hermes-install.sh | bash` install; treat that token as burned.
