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
| `glm52` | cointh.com proxy (Anthropic-messages compatible) | `glm-5.2` | long-context batch work, cost-sensitive lanes |
| `cf-workers-ai` | Cloudflare Workers AI | `@cf/meta/llama-3.1-8b-instruct` (swap per task) | free-tier deep research / high-volume L1 scanning, no local resource cost |

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

## Rules (unchanged from every other worker in the mesh)

- Default lane is `sonnet5` (already authenticated in this session) —
  switching a Ronin to `glm52` or `cf-workers-ai` is an explicit,
  approved choice, not automatic.
- Gated actions (deploy/DNS/telegram/customer/adaptive_sync) stay gated
  regardless of which model lane executes them.
- Every provider call this enables is still bounded by
  `sirinx-autoloop::RecoveryLoop`'s step budget and gate.
