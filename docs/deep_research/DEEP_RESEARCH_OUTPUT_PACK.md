# Deep Research Output Pack

Status: local-only output contract

This pack defines the standard files that a GHOSTCLAW Deep Research job should
produce before it becomes a business decision, sales claim, public article, or
automation input.

## Required Files

| File                        | Owner                    | Purpose                                           |
| --------------------------- | ------------------------ | ------------------------------------------------- |
| `job_packet.json`           | Research Governor        | scope, source policy, budget, hard stops          |
| `source_registry.json`      | Input Grounder           | source IDs, paths, hashes, confidentiality        |
| `claims.json`               | Claim Miner              | atomic claims and claim types                     |
| `evidence_units.json`       | Evidence Builder         | timestamp/page/crop evidence records              |
| `source_quality_table.csv`  | Verification Gate        | authority, recency, directness, bias scores       |
| `claim_evidence_matrix.csv` | Verification Gate        | claim-to-evidence mapping                         |
| `contradiction_log.md`      | Red Team Agent           | conflicts, weak assumptions, unresolved questions |
| `scenario_model.json`       | Financial/Modeling Agent | assumptions, ranges, sensitivity values           |
| `research_report.md`        | Synthesis Agent          | full report with confidence labels                |
| `executive_summary.md`      | Synthesis Agent          | short decision brief                              |
| `action_roadmap.md`         | Research Governor        | next actions, owners, blockers                    |
| `memory_pulse.md`           | Obsidian Sync            | concise non-secret digest entry                   |
| `control_plane_status.json` | Codex / Mission Control  | sanitized read-only status for dashboards         |

## Report Sections

```text
Summary
Decision Context
Inputs
Claim Inventory
Evidence Matrix
Conflicts
Models And Assumptions
Confidence Assessment
Business Feasibility
Risks
Recommended Next Actions
Sources
Appendix
```

## Confidence Language

Use these labels exactly:

- `supported`
- `partially_supported`
- `contradicted`
- `unverified`
- `out_of_scope`

Do not promote a claim from `unverified` to `supported` without independent
evidence and source-quality scoring.

## Dashboard Contract

Dashboard fixtures may include counts, paths, status labels, job classes, and
blocked-action names. They must not include raw confidential source text,
tokens, cookies, browser sessions, service-role keys, customer records, or large
logs. Mission Control is a read-only observer until a separate executor lease
opens an action lane.
