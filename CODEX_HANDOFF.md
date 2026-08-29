# Codex Worker Handoff Protocol

How any external worker (Codex, Hermes executor, another Claude
session) picks up SIRINX work. Same plan, same rules, one queue.

## 1. Onboard (once per session)

1. Read `AGENTS.md` → `MASTER_PLAN.md` → the doc your task links to.
2. Register on the mesh (when a control node is reachable):

```bash
curl -s -X POST $CONTROL/api/a2a/sync \
  -H "Authorization: Bearer $CONTROL_API_TOKEN" -H "content-type: application/json" \
  -d '{"node":{"id":"agent:codex","name":"Codex worker","capabilities":["coding","rust-build","node-test"],"endpoint":"","priority":0},"knownWorkIds":[]}'
```

## 2. Claim work

Work comes from ONE place — the shared queue (`web_pending_work` on
Supabase, surfaced at `GET $CONTROL/api/pending-work`). Items created
by planners carry `detail.planRef` pointing at the `MASTER_PLAN.md`
section (e.g. `"B1"`). Take the oldest item whose `planRef` is
unblocked; announce by commenting on the tracking PR if one exists.

## 3. Execute — the method (non-negotiable)

ทวนคำสั่ง → Context → Plan → Implement → Verify → Report → Commit,
exactly as written in `.claude/skills/sirinx-master-plan/SKILL.md`.

- Branch: work on the branch named in the task detail; never push
  elsewhere. No PR creation unless the task says so.
- Verification chain (all must pass before claiming done):
  `cargo fmt --all --check` · `cargo clippy --workspace --all-targets -- -D warnings`
  · `cargo test --workspace` · `npm run check` · `npm run control:test`
- Every feature ships with tests. Failing checks are reported as
  failing (Truth Protocol) — never marked done.

## 4. Hard limits (identical to AGENTS.md)

- Gated actions (deploy, Cloudflare/DNS, Telegram send, customer
  messaging, AdaptiveSync) never execute — produce the dry-run plan
  and stop. Opening gates is the human operator's act, with a ticket.
- No secrets in the repo. No `.env` with real values. No paid API
  calls without approval.
- Update `MASTER_PLAN.md` section A/B status in the same commit.

## 5. Report back

Finish = commit pushed + `MASTER_PLAN.md` updated + a short report:
what changed, proof (test counts), anything blocked and why.
