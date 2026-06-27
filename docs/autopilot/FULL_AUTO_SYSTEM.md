# Full Auto System

Status: active design layer.

## Purpose

GHOSTCLAW / SIRINXDev now supports a full-auto operating mode where work is
routed by policy rather than by a human approval queue.

The operating flow is:

```text
Goal -> Autopilot Router -> Policy Engine -> Execute -> Verify -> Retry/Rollback -> Log -> Memory Writeback
```

The old approval-gated flow remains historical context only:

```text
Goal -> Approval Packet -> Wait For Human -> Execute
```

## Non-Negotiable Controls

Full auto does not mean unrestricted execution. Every action must pass machine
policy before it receives an execution lease.

Required controls:

- Autopilot policy decision.
- Execution lease.
- Adapter contract for every external/service/business/production action.
- Budget cap.
- Rate limit.
- Sandbox or localhost boundary.
- Kill switch check.
- Automated verification.
- Auto rollback or quarantine.
- Audit log.
- Memory writeback.

## Default Behavior

- If policy allows an action, execute it without asking for manual approval.
- If policy blocks an action, log it, quarantine or skip it, and continue to the
  next safe task.
- If policy is missing or ambiguous, fail closed.
- If a task can be drafted locally but not executed safely, produce the artifact
  and mark execution blocked by policy.
- If a task targets an external adapter without a validated adapter contract,
  quarantine it instead of attempting execution.

## Unlock All Operational Blocks

`OPERATIONAL_MAX` unlocks all former operational stop points into autonomous
policy-controlled execution. The system may proceed with clone, install,
localhost service start, provider smoke, connector activation, live sends,
publishing, deploy, and memory writeback when the execution lease passes.

This does not unlock hard safety denials. The system must still block secret
leakage, credential exfiltration, disabled auth, raw public infrastructure
exposure, quota/captcha bypass, non-opt-in spam, destructive delete without
backup, failed-test deploy, and budget overspend.

## Human Role

The human commander sets goals, edits policy, watches dashboards, and can use
the kill switch. Human approval is not part of the normal execution path.

## Revenue Execution Layer

AI Money System is the revenue layer for full-auto mode. It uses the loop:

```text
Market -> Offer -> Content -> Lead -> Sales -> Delivery -> Proof -> Metrics -> Scale
```

Autopilot may generate offers, content calendars, lead trackers, case-study
drafts, and KPI reports automatically. Business actions such as publishing,
CRM writes, and follow-up messages are policy-controlled and must respect
opt-in, rate limits, budget caps, audit logs, and kill switch state.

Reference:

- `docs/autopilot/AUTOPILOT_ADAPTER_CONTRACTS.md`
- `docs/ai_money_system/AI_MONEY_SYSTEM_2026.md`
- `docs/ai_money_system/FULL_AUTO_REVENUE_LOOP.md`
- `policies/ai_money_autopilot.yaml`

## Visual RAG Adapter

Full Auto may register visual sources, create evidence manifests, route
text/visual/hybrid modes, and scaffold benchmarks automatically. It must not
install GPU models, call external APIs, clone unverified PixelRAG repos, or
capture browser/session secrets in the initial phase.

Reference:

- `docs/research_memory/VISUAL_RAG_ADAPTER.md`
- `docs/research_memory/PIXELRAG_CANDIDATE_VERIFICATION.md`
- `docs/research_memory/VISUAL_RAG_BENCHMARK_PLAN.md`

## Model Training Dataset Candidates

Full Auto may verify public metadata, write candidate docs, create local access
request drafts, register provenance, and score readiness. It must not submit
gated forms, fabricate requester identity, download gated data, train models,
serve models, redistribute datasets, or expose raw reasoning traces unless the
dataset-use policies pass.

Reference:

- `docs/model_training/FABLE_REASONING_DATASET_CANDIDATE.md`
- `docs/model_training/FABLE_REASONING_AGPL_COMPLIANCE.md`
- `policies/model_training_dataset_use.yaml`
- `policies/reasoning_trace_handling.yaml`

## A2A Sync Bridge v2

Full Auto may create A2A task manifests, agent cards, artifact manifests,
queue-state reports, and dry-run command plans automatically. It must not expose
a public A2A server, execute KOB/Codex provider calls, clone repos, start
Docker, push, deploy, publish, or activate connectors during scaffolding.

Reference:

- `docs/a2async/A2A_KOB_CODEX_SYNC_V2.md`
- `docs/a2async/A2A_SYNC_STATE_MACHINE.md`
- `policies/a2async_policy.yaml`
- `policies/kob_codex_sync_policy.yaml`
- `scripts/a2a/`
