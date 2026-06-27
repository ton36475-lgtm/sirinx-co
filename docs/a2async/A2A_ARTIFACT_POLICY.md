# A2A Artifact Policy

Artifacts are the evidence trail between KOB, Codex, Ponytail, and future
memory writeback.

## Artifact Types

- `command_plan`: dry-run command proposal.
- `repo_report`: README/license/security/package/docker audit summary.
- `patch_summary`: changed file and behavior summary.
- `validation_report`: test/lint/typecheck/build result summary.
- `memory_summary`: compressed status for PROJECT_STATE, NEXT_ACTIONS, or
  Obsidian.
- `policy_block`: reason a task was skipped or quarantined.
- `manus_artifact_metadata`: metadata, hash, and handoff summary for a Manus
  desktop artifact such as an HTML spec, website draft, slide deck, or video
  plan.

## Storage

Runtime artifacts must be written under:

`~/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/`

Repo audit outputs must be written under:

`~/SIRINXDev/.ghostclaw_runtime/a2async/repo_audits/`

## Secret Handling

Artifacts must never include secret values. When an environment variable,
config key, or token-like value is relevant, record only whether it is set and
which policy controlled it.

Manus artifacts are metadata-only in the first phase. The bridge may record a
local file path, byte size, and SHA-256 hash, but must not embed full generated
HTML, browser session state, app state, cookies, tokens, or raw private files
inside task manifests.
