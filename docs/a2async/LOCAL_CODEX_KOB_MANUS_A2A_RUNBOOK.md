# Local Codex + KOB CLI + Manus A2A Runbook

This runbook wires the local planner/executor/artifact loop without opening a
public server:

```text
KOB CLI planner -> A2A local file queue -> Codex local executor
Manus artifact -> A2A metadata adapter -> Codex local review
```

## Roles

| Peer            | Role                                  | Execution boundary                                                            |
| --------------- | ------------------------------------- | ----------------------------------------------------------------------------- |
| KOB CLI         | Plan, route, compress context         | Dry-run by default; provider execution only with explicit operator intent     |
| Codex local     | Repo edits, docs, scripts, validation | Current Codex session or local CLI; never KOB-hosted Codex for repo execution |
| Manus           | Visual/spec artifact producer         | Metadata-only handoff until exported files are reviewed                       |
| A2A local queue | Task, artifact, and state bus         | Files under runtime root, no public port                                      |

## Correct Local Commands

Do not paste Python source directly into `sh`. Run scripts as files:

```bash
cd /Users/sirinx/SIRINXDev/sirinx-agent-native-os
python3 scripts/a2a/a2a_init_runtime.py
python3 scripts/a2a/a2a_healthcheck.py
python3 scripts/a2a/a2a_repo_registry.py --validate
```

Create a KOB dry-run plan artifact:

```bash
python3 scripts/a2a/a2a_kob_adapter.py \
  --model opus-5 \
  --prompt "Plan the next GHOSTCLAW local Codex task. Do not call providers from A2A."
```

Create a Codex local handoff plan artifact:

```bash
python3 scripts/a2a/a2a_codex_adapter.py \
  --model codex-local \
  --goal "Review the latest Manus artifact metadata and prepare scoped repo tasks."
```

Sync a Manus artifact summary without an exported file:

```bash
python3 scripts/a2a/a2a_manus_adapter.py \
  --title "GHOSTCLAW SPEC_DRIVING.html" \
  --kind interactive_html_spec \
  --summary "Manus created an interactive GHOSTCLAW HTML spec." \
  --next-action "Locate the exported SPEC_DRIVING.html file and run hash-backed review."
```

Sync a Manus artifact after export:

```bash
python3 scripts/a2a/a2a_manus_adapter.py \
  --title "GHOSTCLAW SPEC_DRIVING.html" \
  --kind interactive_html_spec \
  --source-path /absolute/path/to/SPEC_DRIVING.html \
  --summary "Manus exported the interactive GHOSTCLAW HTML spec." \
  --next-action "Codex should inspect and convert stable sections into scoped docs/UI tasks."
```

Dispatch one local task in dry-run mode:

```bash
python3 scripts/a2a/a2a_dispatch.py --once --dry-run
python3 scripts/a2a/a2a_collect_artifacts.py
python3 scripts/a2a/a2a_daily_summary.py
```

## Isolated Smoke Test

Use the test to prove the KOB/Codex/Manus local loop without touching the real
runtime:

```bash
python3 -m unittest tests.a2a.test_local_codex_kob_manus_sync
```

The test sets `A2A_RUNTIME_ROOT` to a temporary folder, creates KOB/Codex dry-run
artifacts, syncs a temporary Manus HTML file, dispatches the A2A task, and
asserts that no full HTML content is embedded in the task manifest.

## Hard Boundaries

- No public A2A server.
- No Manus UI automation in this lane.
- No browser profile or app session copying.
- No secret reads or secret printing.
- No push, deploy, publish, provider call, Docker start, or connector
  activation.
