# Ghostclaw Master Architecture

Status: local-only control-plane specification.

## Purpose

GHOSTCLAW / SIRINXDev Agent-Native OS coordinates AI-assisted work across local
development, research, memory, automation, model routing, and downstream
business projects. Codex and other workers are execution agents, not command
authority. The human commander and Hermes approval gate own final decisions.

## Architecture Map

```text
Human Commander
  -> Hermes Command Gate
     -> Policy Gate
     -> Approval Gate
     -> Memory Writeback Gate
  -> Worker Layer
     -> Codex
     -> Claude Code
     -> OpenCode
     -> OpenClaw
     -> OpenHands
  -> Ponytail Code Minimalism Gate
  -> Odysseus Private Workspace UI
  -> Model Layer
     -> Ollama / llama.cpp
     -> GLM-5.2 API
     -> OpenRouter Fusion Router
     -> Approved remote GPU servers
  -> Cost And Fleet Control
     -> Budget governor
     -> Usage quotas
     -> Agent concurrency limits
     -> Kill switch
  -> Automation Backbone
     -> n8n
     -> MCP servers
     -> thClaws runtime
  -> Memory Source Of Truth
     -> Obsidian Vault
     -> Hermes memory
     -> Chroma / Qdrant / pgvector
     -> Evidence logs
  -> Downstream Projects
```

## Human Commander

The human commander approves or rejects risky actions, reviews
PRE_APPROVAL_PACKET files, confirms external service use, and decides when
local-only work can become live runtime work.

## Hermes Command, Policy, And Approval Gate

Hermes receives goals, normalizes task packets, applies policies, checks
approval requirements, routes to worker layers, and blocks unsafe actions.
Hermes must not be bypassed for deploy, push, publish, provider, public access,
or live-message operations.

## Codex / Claude / OpenCode Worker Layer

Workers inspect repo state, draft plans, create docs, implement approved patches,
run verification, and report evidence. Workers do not own project authority and
must stop when a task needs secrets, network mutation, public access, or
unapproved runtime changes.

## Ponytail Code Minimalism Gate

Ponytail is the planned code review/minimalism gate. It should be used after
diff creation and before milestone completion to identify over-engineering,
unnecessary abstractions, unsafe shortcuts, and missing validation.

## Odysseus Private Workspace UI

Odysseus is planned as an external, private, localhost-only AI workspace for
chat, agents, research, documents, file workflows, shell/MCP tools, and local
model routing. It must be treated as an admin console, not a public web app.
Odysseus AGPL source must not be vendored into this monorepo.

## Model Routing

- Local-first: Ollama and llama.cpp handle private and lightweight tasks.
- GLM-5.2: optional API-first long-context coding and repo reasoning layer.
- OpenRouter Fusion: optional multi-model debate and judge route after approval.
- Remote GPU: optional heavy workload target after explicit approval.

## Cost And Fleet Control

The `$100/month product stack` and multi-agent fleet plan are part of the core
operating model. Product lanes should start on free/usage-based infrastructure,
but every lane must define quota, budget cap, retry limit, queue concurrency,
and kill switch before public usage.

Fleet execution is bounded by the human commander and Hermes approval gate:
headless Codex workers and visible tmux coders may run only scoped task packets,
must report callbacks, and must stop before merge, push, deploy, publish, live
send, or paid provider calls.

Reference:
`docs/architecture/LOW_COST_PRODUCT_AND_MULTI_AGENT_FLEET_PLAN.md`

## n8n / MCP Automation Layer

n8n and MCP provide automation backbones only after approval. Planned use cases
include task routing, workflow logs, memory sync, and approved connector calls.
No external connector activation is allowed by default.

## Obsidian / Hermes Memory Layer

Obsidian and Hermes memory hold durable decisions, task packets, ADRs, evidence,
and next actions. Memory is not truth until backed by local evidence or approved
external evidence.

## Downstream Project Registry

- SIRINX Solar / OPAL pricing engine.
- AGM AUTOFLOW / AUTOGLOW creative production workflow.
- กุศลา / Final Farewell.
- Phitsanulok United News.
- Ads Andromeda / ADS Queen.
- AI content and creative automation projects.

## Default Operating Principle

Goal -> Plan -> PRD -> Issues -> Tasks -> Diff -> Verify -> Approval Packet ->
Stop.
