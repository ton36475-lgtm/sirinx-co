# Git Evidence Review Panel Spec

Status: SPEC READY - WAITING FOR APPROVE_IMPLEMENTATION

## Feature

Git Evidence Review Panel

## Goal

Show local Git diffs, changed files, version history, and evidence packet links
inside Mission Control.

## Why

Turn code changes into proof-linked project memory. A diff is not just a code
change; it is evidence that a specific artifact changed at a specific local
state.

## Scope

- Local Git diff viewer.
- Changed files list.
- Commit and timeline mapping.
- Evidence packet placeholder.
- Approval status.

## Explicitly Blocked

- No push.
- No deploy.
- No external GitHub verification.
- No provider call.
- No live message send.
- No remote mutation.

## Users

| User                    | Need                                         |
| ----------------------- | -------------------------------------------- |
| Project Lead            | See what changed and decide approval state   |
| Codex Worker            | Link local work to spec, tests, and evidence |
| Oracle Provenance Agent | Convert diffs into proof-linked memory       |
| QA Guardrail Agent      | Verify tests and risk before approval        |

## User Flow

```text
Open Mission Control
-> Open Git Evidence Review Panel
-> Select workspace/repo
-> View changed files
-> Select file
-> Review diff
-> Inspect linked spec/evidence/timeline state
-> Assign approval status
-> Generate local evidence packet
-> Stop before push/deploy/external verification
```

## Screens

### Screen 1 - Git Evidence Overview

Purpose: summarize current local Git state.

States:

- clean
- dirty
- untracked files present
- blocked by risk
- ready for local approval review

### Screen 2 - Changed Files List

Purpose: show files grouped by type and risk.

Groups:

- tracked modified
- added
- deleted
- untracked
- generated build outputs
- secret-risk files

### Screen 3 - Diff Viewer

Purpose: show selected file diff with additions/deletions.

Requirements:

- preserve line context
- show file path
- show change kind
- no remote calls
- local-only source from `git diff`

### Screen 4 - Timeline Mapping

Purpose: link work to Oracle timeline.

Fields:

- timeline event id
- proof status
- related spec path
- related task path
- related evidence ids

### Screen 5 - Evidence Packet Placeholder

Purpose: show what evidence must be captured before approval.

Fields:

- diff summary
- test command and result
- secret scan result
- screenshot or local preview reference
- approval decision

### Screen 6 - Approval Status

Purpose: gate action.

Allowed statuses:

- NEEDS_SPEC
- NEEDS_TESTS
- NEEDS_EVIDENCE
- READY_FOR_LOCAL_APPROVAL
- APPROVED_FOR_LOCAL_IMPLEMENTATION
- BLOCKED_NO_PUSH

## Data Contract Draft

```json
{
  "panel_id": "git-evidence-review",
  "repo_path": "/Users/sirinx/SIRINXDev/sirinx-agent-native-os",
  "branch": "feat/unified-agent-native-monorepo",
  "mode": "local-only",
  "git_state": "dirty",
  "changed_files": [
    {
      "path": "docs/product-design/GIT_EVIDENCE_REVIEW_PANEL_SPEC.md",
      "status": "added",
      "risk": "low",
      "proof_status": "LOCAL"
    }
  ],
  "timeline_links": [
    {
      "event_id": "te-20260605-git-evidence-review-panel-intake",
      "proof_status": "LOCAL"
    }
  ],
  "evidence_packet": {
    "status": "placeholder",
    "required": [
      "diff_summary",
      "test_result",
      "secret_scan",
      "approval_decision"
    ]
  },
  "approval": {
    "status": "NEEDS_IMPLEMENTATION_APPROVAL",
    "blocked_actions": [
      "push",
      "deploy",
      "external_github_verification",
      "provider_call"
    ]
  }
}
```

## Acceptance Criteria

- Panel reads only local Git state.
- Panel does not push, deploy, or call providers.
- Panel shows changed files and selected diff.
- Panel can link at least one timeline event placeholder.
- Panel can show evidence packet placeholder.
- Panel can show approval status and blocked actions.
- Panel output can be captured as an evidence artifact.

## Test Checklist

- `git status --short --branch` is parsed correctly.
- `git diff --name-status` is parsed correctly.
- selected file diff renders without truncating path or status.
- untracked files are clearly marked as untracked.
- generated/dist files are visually separated from source/spec files.
- no secret values are displayed.
- blocked actions remain visible.
- no remote network call is made by the panel.

## Evidence Requirements

- Local screenshot or browser capture of panel.
- `git status --short --branch` output.
- `git diff --check` result.
- targeted test result.
- secret scan result.
- timeline event id.
- approval decision.

## Implementation Gate

Do not implement UI/source code until the operator sends:

```text
APPROVE_IMPLEMENTATION
```
