# Hermes / Obsidian Memory Protocol

Status: planned memory writeback protocol.

## Principle

Memory is not truth. Memory becomes actionable only when tied to local evidence,
source files, run logs, approvals, or explicitly marked assumptions.

## Sources

- Obsidian Vault.
- Hermes memory.
- Project state files.
- Evidence packets.
- ADRs.
- Fusion run logs.
- Audit logs.

## Memory Delta Format

Each writeback should capture:

- Decision made.
- Evidence path.
- Confidence.
- Open questions.
- Risks.
- Next action.
- Approval state.

## Writeback Gate

No automatic memory writeback to Obsidian/Hermes occurs without approval. For
local planning, draft the delta first and stop for review.

## Folder Intent

```text
00_Inbox
01_Project_State
02_Architecture
03_Decisions_ADR
04_Fusion_Runs
05_Rules
06_Prompts
07_Evals
08_Release_Gates
```
