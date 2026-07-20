---
name: ronin-model-routing
description: กำหนด model lane ให้ทีม 47 Ronin ทั้งหมด (Sonnet 5 / GLM-5.2 ผ่าน cointh.com proxy / Cloudflare Workers AI) ใช้เมื่อต้อง route agent ไปยัง model ไหน, ตั้งค่า provider ใหม่, หรือแก้ปัญหา model lane Triggers on model routing, GLM, cointh, sonnet 5, cloudflare workers ai, ronin model
---

# 47 Ronin Model Routing

Three lanes, one router (`sirinx_agents::model_routing` — Rust, no
parallel orchestrator). Every lane needs an env-provided credential;
**no API key or token is ever written into this repo.**

## Lanes

| Lane | Provider | Model id | Best for |
| --- | --- | --- | --- |
| `sonnet5` | Anthropic (native, this CLI) | `claude-sonnet-5` | default — everything Claude already does in-session |
| `opus-4-8` | Anthropic (native, this CLI, `/model`) | `claude-opus-4-8` | hard-coding / complex-reasoning tasks — no approval needed, same auth as `sonnet5` |
| `fable-5` | Anthropic (native, this CLI, `/model`) | `claude-fable-5` | QA/verification passes, and the first lane to reach for right after a usage-window reset |
| `glm52` | cointh.com proxy (Anthropic-messages compatible) | `glm-5.2` | long-context batch work, cost-sensitive lanes |
| `cf-workers-ai` | Cloudflare Workers AI | `@cf/meta/llama-3.1-8b-instruct` (swap per task) | free-tier deep research / high-volume L1 scanning, no local resource cost |

`opus-4-8` and `fable-5` are native Anthropic models selectable via this
CLI's own `/model` command — same session auth as `sonnet5`, no
`AgentCard` capability tag or approval doc needed (unlike `glm52`/
`cf-workers-ai`, which are third-party and gated). The failover section
below assumed this; it's made explicit here after an L2 (Jūnai) review
caught the two lanes being referenced without being formally listed.

## Required env vars (operator-provisioned, never in repo)

```bash
# GLM-5.2 via cointh.com — Anthropic-compatible endpoint
export GLM_BASE_URL="https://cointh.com/glm/anthropic"
export GLM_API_KEY="<rotate and paste only into your shell env, never into a file or chat>"

# Cloudflare Workers AI
export CF_ACCOUNT_ID="<account id>"
export CF_WORKERS_AI_TOKEN="<Workers AI API token>"
```

⚠️ **If a GLM/Workers AI key was ever pasted into a chat, treat it as
exposed and rotate it at the provider before relying on it.** A key
visible in a conversation transcript is not a secret anymore.

## Approval gate (same governance as Kimi K3)

Paid provider calls require `docs/approvals/MODEL_ROUTING_KIMI_K3.md`-style
sign-off. Use `docs/approvals/MODEL_ROUTING_RONIN_TEAM.md` (this repo) —
operator fills `APPROVED_BY/DATE/TICKET/BUDGET` by hand before any lane
other than `sonnet5` (the default, already covered by the session's own
Anthropic auth) goes live.

## Wiring a Ronin to a lane

Each Ronin's `AgentCard` (see `sirinx-a2a`) carries an optional
`modelLane` capability tag: `model:sonnet5`, `model:glm52`,
`model:cf-workers-ai`. OmniRoute picks the agent whose card advertises
the requested lane — routing stays inside the existing A2A mesh, no new
dispatcher.

```bash
# Register a Ronin explicitly on the GLM-5.2 lane (after approval + key set):
curl -s -X POST $CONTROL/api/a2a/sync \
  -H "Authorization: Bearer $CONTROL_API_TOKEN" -H "content-type: application/json" \
  -d '{"node":{"id":"agent:junai-17","name":"Junai L2 scorer","capabilities":["coding","model:glm52"],"endpoint":"","priority":1},"knownWorkIds":[]}'
```

## Failover order (what happens when a lane errors or hits a limit)

A real company doesn't stop working because one vendor is down; it has a
documented fallback, not a silent guess. Same here — when the active
lane returns an error, a rate limit, or a usage-window reset, the next
step is deterministic, not improvised:

1. **`sonnet5`** (default, everyday work) — if this errors/limits, retry
   is bounded by `sirinx-autoloop::RecoveryLoop` (existing step budget),
   not an unbounded loop.
2. **`opus-4-8`** — hard-coding / complex-reasoning tasks route here
   first, per operator preference, before falling back further.
3. **`fable-5`** — used for QA/verification passes, and as the
   "session reset" lane: when a usage window resets, resume with Fable 5
   first (cheapest verification pass) before returning to Opus for the
   next hard-coding task.
4. **`glm52` / `cf-workers-ai`** — last resort only, and only if already
   approved per `docs/approvals/MODEL_ROUTING_RONIN_TEAM.md`. A lane
   that isn't approved does not get silently tried as a fallback.

This is a policy for *this CLI session's own model picker* (`/model`)
plus the AgentCard `modelLane` tag for other Ronin — it is not a new
retry engine. The actual bounded-retry mechanics stay exactly
`RecoveryLoop` from `sirinx-autoloop`; this section only fixes the
*order* agents/operators should reach for next.

## Rules (unchanged from every other worker in the mesh)

- Default lane is `sonnet5` (already authenticated in this session) —
  switching a Ronin to `glm52` or `cf-workers-ai` is an explicit,
  approved choice, not automatic.
- Gated actions (deploy/DNS/telegram/customer/adaptive_sync) stay gated
  regardless of which model lane executes them.
- Every provider call this enables is still bounded by
  `sirinx-autoloop::RecoveryLoop`'s step budget and gate.
