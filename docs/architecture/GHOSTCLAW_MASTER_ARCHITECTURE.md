# Ghostclaw Master Architecture

Status: full-auto policy-driven control-plane specification.

## Purpose

GHOSTCLAW / SIRINXDev Agent-Native OS coordinates AI-assisted work across local
development, research, memory, automation, model routing, and downstream
business projects. Codex and other workers are execution agents. In full-auto
mode, policy owns routine execution decisions through leases, verification,
rollback, audit logs, and kill switch controls.

## Architecture Map

```text
Human Commander
  -> Hermes Autopilot Policy Engine
     -> Task Classifier
     -> Policy Decision
     -> Execution Lease
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
  -> Revenue Execution Layer
     -> AI Money System
     -> Offer ladder
     -> Content engine
     -> Lead / sales / delivery / proof loops
  -> Automation Backbone
     -> n8n
     -> MCP servers
     -> thClaws runtime
  -> Memory Source Of Truth
     -> Obsidian Vault
     -> Hermes memory
     -> Chroma / Qdrant / pgvector
     -> Evidence logs
  -> Research-Memory Pipeline
     -> Text RAG
     -> Web/PDF text extraction
     -> OCR fallback
     -> Visual RAG Adapter
  -> Model Training Dataset Candidate Layer
     -> Public metadata verification
     -> Gated access request drafts
     -> Provenance records
     -> License / AGPL review
     -> Reasoning-trace handling
     -> Tiny local training/eval plans
  -> Downstream Projects
```

## Human Commander

The human commander sets goals, edits policies, monitors dashboards, and uses
the kill switch. The commander does not approve every task in the normal
full-auto path.

## Hermes Autopilot Policy Engine

Hermes receives goals, normalizes job manifests, applies policies, creates
execution leases, routes to worker layers, and blocks or quarantines unsafe
actions. Hermes must not be bypassed for deploy, push, publish, provider,
public access, or live-message operations; those actions require machine policy
allow, budget limits, rate limits, verification, and rollback readiness.

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

Fleet execution is bounded by the Autopilot Policy Engine: headless Codex
workers and visible tmux coders may run only leased jobs, must report
callbacks, and must block/quarantine work that violates policy.

Reference:
`docs/architecture/LOW_COST_PRODUCT_AND_MULTI_AGENT_FLEET_PLAN.md`

## Revenue Execution Layer

AI Money System turns the operating system into a repeatable revenue machine.
It coordinates market research, offers, content, lead generation, sales,
delivery, proof collection, metrics, and scaling.

Primary path:

```text
AI Local Promo Pack -> Prompt/Template Pack -> AI Content Agency -> AI Automation Service
```

Reference:

- `docs/ai_money_system/AI_MONEY_SYSTEM_2026.md`
- `docs/ai_money_system/EXECUTION_LAYER.md`
- `docs/ai_money_system/OFFER_LADDER.md`
- `policies/ai_money_autopilot.yaml`

## n8n / MCP Automation Layer

n8n and MCP provide automation backbones only after approval. Planned use cases
include task routing, workflow logs, memory sync, and approved connector calls.
No external connector activation is allowed by default.

## Obsidian / Hermes Memory Layer

Obsidian and Hermes memory hold durable decisions, task packets, ADRs, evidence,
and next actions. Memory is not truth until backed by local evidence or approved
external evidence.

## Research-Memory Pipeline

SPEC-02 Research-Memory-Pipeline supports text-first retrieval and adds Visual
RAG Adapter for documents where layout matters. Visual RAG is used for PDF
tables, datasheets, charts, rendered web pages, competitor landing pages,
dashboards, and infographics.

PixelRAG is not a dependency yet. It remains a candidate until an official
paper/repo/playground is verified.

Reference:

- `docs/research_memory/VISUAL_RAG_ADAPTER.md`
- `docs/research_memory/HYBRID_TEXT_VISUAL_RAG_ROUTING.md`
- `docs/research_memory/VISUAL_EVIDENCE_SCHEMA.md`

## Model Training Dataset Candidate Layer

Dataset candidates such as `hotdogs/uka-fable-reasoning` are handled as
candidate inputs, not approved training corpora. The layer records public
metadata, access-request drafts, provenance schemas, AGPL compliance notes,
reasoning-trace policy, readiness scores, and small training/eval plans.

Gated datasets must stop before row access until terms are accepted truthfully,
raw files are stored outside git, revision/hash evidence exists, and license
obligations are reviewed.

Reference:

- `docs/model_training/FABLE_REASONING_DATASET_CANDIDATE.md`
- `docs/model_training/FABLE_REASONING_ACCESS_REQUEST_TEMPLATE.md`
- `docs/model_training/FABLE_REASONING_DATA_PROVENANCE_SCHEMA.md`
- `policies/model_training_dataset_use.yaml`

## Downstream Project Registry

- SIRINX Solar / OPAL pricing engine.
- AGM AUTOFLOW / AUTOGLOW creative production workflow.
- กุศลา / Final Farewell.
- Phitsanulok United News.
- Ads Andromeda / ADS Queen.
- AI content and creative automation projects.

## Default Operating Principle

Goal -> Autopilot Router -> Policy Engine -> Execute -> Verify ->
Retry/Rollback -> Log -> Memory Writeback.

Reference docs:

- `docs/autopilot/FULL_AUTO_SYSTEM.md`
- `docs/autopilot/AUTOPILOT_POLICY_SPEC.md`
- `docs/autopilot/EXECUTION_LEASE_SPEC.md`
- `docs/autopilot/AUTOPILOT_ADAPTER_CONTRACTS.md`
- `policies/autopilot_policy.yaml`

## A2A Sync Bridge v2

A2A Sync Bridge v2 is the local task bus between planner models and repo
workers:

```text
KOB CLI Opus/Fable -> A2A local task manifest -> Codex 5.6 executor
-> artifacts -> Ponytail review -> compressed memory summary
```

The bridge is not a public server in this phase. It uses local file queues,
agent cards, registry files, artifact manifests, queue state, and audit logs.
It lets KOB handle planning/context compression while Codex performs concrete
repo work and validation.

Reference:

- `docs/a2async/A2A_KOB_CODEX_SYNC_V2.md`
- `agents/a2a/`
- `registry/external_git_repos.yaml`
- `policies/a2async_policy.yaml`
- `scripts/a2a/`
