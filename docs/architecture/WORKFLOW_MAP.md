# Workflow Map

Status: full-auto canonical flow.

## Canonical Flow

```text
Goal -> Autopilot Router -> Policy Engine -> Execution Lease -> Execute -> Verify -> Retry/Rollback -> Audit Log -> Memory Writeback
```

## Stage Definitions

| Stage            | Output                                           | Policy Result                           |
| ---------------- | ------------------------------------------------ | --------------------------------------- |
| Goal             | Clear user intent and target repo                | Ambiguous root becomes `policy_blocked` |
| Autopilot Router | Worker/tool selection                            | Unknown tool becomes `policy_blocked`   |
| Policy Engine    | Allow/block/quarantine decision                  | Missing policy fails closed             |
| Execution Lease  | Scoped lease with budget/rate/rollback           | Invalid lease blocks execution          |
| Execute          | Local or external action within lease            | Violation triggers rollback/quarantine  |
| Verify           | Tests, syntax checks, screenshots, health, or QA | Failure triggers retry/rollback         |
| Retry/Rollback   | Recovery result                                  | Exhausted retries quarantine            |
| Audit Log        | Durable runtime evidence                         | Secret values must be masked            |
| Memory Writeback | Summary and decisions                            | Only non-secret summaries are written   |

## Worker Rule

Workers may execute leased jobs without asking for manual approval. Workers must
not cross policy boundaries.

## Evidence Rule

Every claim must be linked to local evidence, current command output, checked
files, or explicitly marked as memory-derived and potentially stale.

## Budget Rule

Before any public launch, fleet run, paid provider call, or production deploy,
the policy engine must identify cost surfaces: compute, database, storage,
egress, AI API, email, analytics, queue, and worker runtime. Missing usage
limits are a policy block.

## Revenue Rule

For AI Money System work, every task must map to at least one revenue loop:

- market
- offer
- content
- lead
- sales
- delivery
- proof
- metrics
- scale

If a task only creates knowledge without moving one of these loops, route it to
research backlog instead of active execution.

## Research-Memory Routing Rule

Use Text RAG for simple text sources. Use Visual RAG for layout, table, chart,
datasheet, dashboard, or screenshot-heavy sources. Use Hybrid RAG when document
type is uncertain or OCR/text extraction confidence is low.

PixelRAG is a candidate backend only; do not route production work to it until
official source verification is complete.

## Dataset Candidate Rule

For gated or disputed training datasets, use this flow:

```text
Dataset metadata -> Provenance record -> License review -> Access request draft -> Readiness score -> Row audit -> Training eval plan
```

Gated datasets stop before row audit until the requester has accepted access
terms truthfully, raw files are stored outside git, a file hash manifest exists,
and license obligations are reviewed. Reasoning traces stay internal-only and
must not be exposed in user-facing outputs.

## A2A Sync Routing Rule

Use A2A Sync Bridge v2 when work needs planner/executor separation:

```text
Goal -> KOB plan/compress -> A2A task manifest -> Codex execute/validate -> Artifact manifest -> KOB memory summary -> NEXT_ACTIONS
```

KOB and Codex must not mutate the same repo lane concurrently. In scaffolding,
the bridge produces local command plans and artifacts only. Real clone, Docker,
provider calls, push, deploy, publish, or connector activation require the
matching adapter policy and runtime validator to pass.
