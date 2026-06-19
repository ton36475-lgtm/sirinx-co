# Git Evidence Review Panel Proof Model

Status: LOCAL SPEC - WAITING FOR APPROVE_IMPLEMENTATION

## Claim

Git diffs can become evidence-linked project memory when they are tied to a
timeline event, evidence packet, and approval status.

## Proof Boundary

Local Git evidence can support `LOCAL`, `EVIDENCED`, and `COMMITTED` states. It
cannot support `EXTERNAL` or `PROVEN` by itself.

## Local Evidence Sources

| Source                        | Proof use                       |
| ----------------------------- | ------------------------------- |
| `git status --short --branch` | current branch and dirty state  |
| `git diff --name-status`      | changed file inventory          |
| `git diff -- <path>`          | line-level change evidence      |
| `git diff --check`            | whitespace/syntax safety signal |
| test command output           | QA evidence                     |
| secret scan output            | safety evidence                 |

## Promotion Rules

| From       | To        | Required                                    |
| ---------- | --------- | ------------------------------------------- |
| UNVERIFIED | LOCAL     | local Git command output exists             |
| LOCAL      | EVIDENCED | evidence packet has hash and metadata       |
| EVIDENCED  | COMMITTED | commit SHA, Git note, or tag anchors packet |
| COMMITTED  | EXTERNAL  | approved remote verification or attestation |
| EXTERNAL   | PROVEN    | complete reproducible chain is documented   |

## Blocked Promotions

- Do not mark GitHub verified from local files.
- Do not mark PROVEN from `git diff` alone.
- Do not hide generated or dist output in evidence summaries.
- Do not treat untracked files as committed evidence.

## Timeline Event Template

```text
event_id: te-YYYYMMDD-git-evidence-review-panel-<slug>
title: Git Evidence Review Panel local review
proof_status: LOCAL
claims:
  - Local Git diff was reviewed.
  - Changed files were classified.
  - Evidence packet placeholder was generated.
evidence_refs:
  - ev-YYYYMMDD-git-status
  - ev-YYYYMMDD-diff-summary
  - ev-YYYYMMDD-test-result
```
