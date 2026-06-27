# Automated Code Review Workflow Integration

Status: local-only review plan.

This document converts the exported `AUTOMATED CODE REVIEW WORKFLOW.md` into a
GHOSTCLAW A2A lane that can be reviewed in Mission Control without executing a
wide code-review engine from browser UI or external agents.

## Source

The current source artifact is expected at:

```text
/Users/sirinx/Downloads/🤖 AUTOMATED CODE REVIEW WORKFLOW.md
```

The A2A integration stores only metadata, file size, line count, and SHA-256 in
runtime reports and the Mission Control fixture. It does not import the raw
document into production code.

## Operating Boundary

The workflow is useful as a review blueprint, but its engine example is not
installed as live code in this phase. The first phase is intentionally
non-destructive:

- read changed-file metadata
- plan lint/type/test/security/doc checks
- generate local Markdown and JSON reports
- show broker decisions in Mission Control
- keep patch suggestions behind executor lease and lane lock

The following remain blocked:

- `git add .`
- commit, push, deploy, or release
- secret reading or export
- provider calls or connector writes
- running broad unknown scripts
- applying patches without executor lease
- mutating repo files from browser UI

## A2A Flow

```text
Exported workflow markdown
-> hash and metadata snapshot
-> Codex Command Broker action decisions
-> runtime JSON/Markdown report
-> Mission Control static fixture
-> operator reviews safe next action
```

The generator is:

```bash
python3 scripts/a2a/a2a_code_review_workflow.py
```

Outputs:

```text
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/automated_code_review_workflow.json
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/automated_code_review_workflow.md
apps/mission-control/src/fixtures/automatedCodeReviewStatus.json
```

## Broker Mapping

| Review action                    | Broker decision           |
| -------------------------------- | ------------------------- |
| `read_repository_files`          | `auto_allow_dry_run`      |
| `diff_review`                    | `auto_allow_dry_run`      |
| `code_review_dry_run`            | `auto_allow_dry_run`      |
| `code_review_report`             | `auto_allow_dry_run`      |
| `security_review_plan`           | `auto_allow_dry_run`      |
| `run_lint`                       | `auto_allow_dry_run`      |
| `run_unit_tests`                 | `auto_allow_dry_run`      |
| `create_non_destructive_patches` | `requires_executor_lease` |
| `production_deploy`              | `blocked`                 |
| `external_api_write_actions`     | `blocked`                 |

This keeps code review fast while preserving the safety boundary: a review may
recommend work, but it cannot apply that work without a separate scoped lane.

## Mission Control

Mission Control reads `automatedCodeReviewStatus.json` as a static fixture. The
panel can display:

- source artifact metadata
- planned review stages
- broker decisions
- changed-file sample count
- blocked workflow actions

The panel does not read runtime files directly, run shell commands, inspect
secrets, call external providers, or sync connectors.

## Acceptance Criteria

- The workflow source is hash-synced before review.
- Safe review actions resolve to `auto_allow_dry_run`.
- Patch/refactor suggestions resolve to `requires_executor_lease`.
- Push, deploy, provider calls, connector writes, and secret access remain
  blocked.
- Runtime reports and Mission Control fixture can be regenerated locally.
- No stage, commit, push, deploy, clone, Docker start, or external API call is
  performed by this lane.
