# A2A Manus Sync

Manus is registered as an A2A peer for visual specs, HTML artifacts, slides,
websites, videos, and handoff summaries. In this system Manus does not edit the
repo directly and does not execute shell commands through A2A. It produces
artifacts; Codex reviews and turns accepted artifacts into scoped repo work.

## Role

| Surface            | Role                                                           |
| ------------------ | -------------------------------------------------------------- |
| Manus              | Produce visual/spec artifacts and summaries                    |
| A2A Local Queue    | Record artifact metadata, source paths, hashes, and next tasks |
| Codex local worker | Inspect, adapt, test, and commit repo changes when scoped      |
| KOB planner        | Compress context and route follow-up tasks                     |
| Obsidian Brain     | Store concise non-secret memory pulse after meaningful sync    |

## Current Manus Artifact

The current visible Manus output is an interactive `SPEC_DRIVING.html` artifact
for GHOSTCLAW with cyberpunk styling, navigation, progress tracking, code
examples, and implementation checklists. It should be treated as a candidate
visual specification, not production source, until Codex has reviewed the file
contents and generated a task-scoped patch.

Latest local exported-file sync:

- Source path: `/Users/sirinx/Downloads/SPEC_DRIVING.html`
- Size: `52,704` bytes
- SHA-256:
  `0ca8d018ba8aa7b0b6c22c91688828061339b3bcd83e7599a0b895a6461d078f`
- Runtime artifact:
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-040524-interactive_html_spec.json`
- Runtime task:
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/completed/A2A-20260627-040524-manus-artifact-review.json`

Light static inspection found one inline script and no external URL, `fetch`,
`XMLHttpRequest`, `eval`, `localStorage`, or `document.cookie` markers. This is
not a security approval; it is only enough to keep the artifact in Codex review
queue without importing it into production.

Codex review output:

- Artifact review:
  `docs/a2async/SPEC_DRIVING_ARTIFACT_REVIEW.md`
- Mission Control task backlog:
  `docs/product-design/SPEC_DRIVING_MISSION_CONTROL_TASKS.md`
- Remaining export sync status:
  `docs/a2async/MANUS_REMAINING_EXPORT_SYNC.md`

Decision: convert stable sections into scoped docs and Mission Control tasks;
do not import the generated HTML directly.

## Remaining Manus Files

The Manus delivery summary also lists `AGENT.md`, five `GHOSTCLAW_*_CLAUDE.md`
templates, `GHOSTCLAW_SHIP_PROTOCOL.md`,
`GHOSTCLAW_CREW_REGISTRY_SCHEMA.ts`, `GHOSTCLAW_INTEGRATION_TESTING.md`, and
`server/ghostclaw-orchestrator.ts`.

As of the latest local audit, these files are not exported to the Mac. They were
registered as metadata-only pending A2A artifacts with `source_exists=false` and
dry-run dispatched through the local queue. This records the handoff without
pretending a hash exists.

Manus later reported that the original sandbox files were missing and started
to recreate them from scratch. That run was stopped. Do not treat recreated
files as original exports unless that is explicitly accepted as a separate
regenerated-artifact lane.

A later Mac export package exists at
`/Users/sirinx/Downloads/GHOSTCLAW_COMPLETE_SYSTEM/` and has been hash-synced
through A2A. The package is not complete enough to import directly:
`AGENT.md` and `SPEC_DRIVING.html` are tiny placeholders, the nested
`GHOSTCLAW_SYSTEM` folder only contains a duplicate README, and the standalone
schema, integration testing, and orchestrator source files are still missing.

Additional user-provided exports now exist directly under
`/Users/sirinx/Downloads/` and were hash-synced as individual A2A artifacts:
`SKILL.md`, `ghostclaw-schema.ts`, Marketing/Video/Content CLAUDE templates,
`ghostclaw-zero-prompting-system.skill`, and
`AUTOMATED CODE REVIEW WORKFLOW.md`. These are review inputs only. The skill
package must not be installed, the schema must not be migrated, and the CLAUDE
templates must not replace current agent instructions until a scoped review
lane accepts specific sections.

## Local-Only Sync Flow

```mermaid
flowchart LR
  A["Manus desktop artifact"] --> B["a2a_manus_adapter.py"]
  B --> C["runtime artifacts manifest"]
  B --> D["A2A inbox task"]
  D --> E["Codex local review"]
  E --> F["patch or docs update"]
  F --> G["validation"]
  G --> H["Obsidian pulse"]
```

## Allowed First Phase

- Register a Manus agent card.
- Record artifact metadata such as title, source path, size, hash, and summary.
- Create a local A2A task for Codex to review the artifact.
- Store runtime records under
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/`.
- Append a concise Obsidian pulse after sync.

## Blocked First Phase

- Do not control Manus via UI automation unless explicitly requested.
- Do not call Manus cloud/API from the A2A bridge.
- Do not deploy, publish, push, or open public endpoints.
- Do not copy browser cookies, credentials, app session files, or private
  workspace state.
- Do not import generated HTML into production without Codex review and scoped
  validation.

## Artifact Metadata

The bridge records:

- `source_agent`: `manus`
- `artifact_title`
- `artifact_kind`
- `source_path` when the artifact is available on disk
- `source_exists`
- `source_size_bytes`
- `source_sha256` when a file exists
- `summary`
- `recommended_next_action`

The bridge does not embed full artifact contents in task manifests. Large files
stay in their source/export location or in runtime artifact storage after a
separate copy decision.

## Recommended Next Task

Use Manus for visual/spec drafting, then route a task to Codex:

```bash
python3 scripts/a2a/a2a_manus_adapter.py \
  --title "GHOSTCLAW SPEC_DRIVING.html" \
  --kind interactive_html_spec \
  --summary "Manus created an interactive GHOSTCLAW HTML spec with navigation, checklists, code examples, and implementation workflow." \
  --next-action "Codex should review the exported HTML and convert stable sections into docs/a2async or Mission Control UI tasks."
```

If the exported file exists locally, add:

```bash
--source-path /absolute/path/to/SPEC_DRIVING.html
```
