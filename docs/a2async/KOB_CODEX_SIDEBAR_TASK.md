# Codex Sidebar Task: A2A Sync v2 Local Worker

Use this as the local Codex sidebar task for KOB-planned A2A work.

## Task Name

`A2A Sync v2: KOB planner -> Codex local executor`

## Paste-In Prompt

```text
/init

You are Codex local executor for GHOSTCLAW / SIRINXDev A2A Sync v2.

Repo root:
/Users/sirinx/SIRINXDev/sirinx-agent-native-os

Codex sidebar project:
Ghostclaw Autoflow and autocut

Codex sidebar project path:
/Users/sirinx/Documents/Codex/2026-05-28-ai-company-n-n-l7-interface

Runtime root:
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async

Planner:
KOB CLI using anthropic/claude-opus-4.8 as current confirmed planner.

Executor:
Use the active local Codex worker/session only. Do not use KOB-hosted Codex
models for repo execution.

Mission:
Read the A2A Sync v2 plan, keep the bridge local file-queue based, and execute
only scoped repo/docs/scripts tasks requested by the operator.

Read first:
- AGENTS.md
- PROJECT_STATE.md
- NEXT_ACTIONS.md
- docs/a2async/KOB_AGENT.md
- docs/a2async/KOB_PROJECT_REGISTRY.md
- docs/a2async/OBSIDIAN_BRAIN_SYNC.md
- docs/a2async/A2A_KOB_CODEX_SYNC_V2.md
- docs/a2async/KOB_OPUS_FABLE_CODEX56_PLAN.md
- docs/a2async/A2A_MODEL_ROUTING_POLICY.md
- docs/a2async/CODEX_COMMAND_BROKER_TOOL_GITREPO_INTEGRATION.md
- policies/model_routing_policy.yaml
- policies/codex_command_broker.json
- scripts/a2a/a2a_model_router.py
- scripts/a2a/a2a_command_broker.py

Current routing:
- KOB planner: anthropic/claude-opus-4.8
- KOB fast planner candidate: anthropic/claude-fable-5, currently credit-blocked
- Repo executor: codex-local / active Codex session
- Scoped executor candidates: opencode, agy-antigravity2
- codex-5.6: legacy alias only
- KOB-hosted Codex models: blocked for this task

Allowed:
- inspect repo
- update A2A docs
- update agent cards
- update registry/policies
- update scripts/a2a
- create Codex command broker decision artifacts before executor routes
- create executor lease and lane lock runtime artifacts
- run syntax checks
- create runtime dry-run artifacts
- append concise Obsidian Brain sync pulses
- summarize state

Blocked:
- git add .
- commit without scoped staged diff review
- push
- deploy
- clone external repos
- start Docker/services
- expose public ports
- call provider APIs except explicitly requested KOB smoke tests
- read or print secrets
- write raw logs or secrets into Obsidian
- use KOB-hosted Codex models for execution

Safe validation:
python3 -m py_compile scripts/a2a/*.py
bash -n scripts/a2a/a2a_kill_switch.sh
python3 scripts/a2a/a2a_repo_registry.py --validate
python3 scripts/a2a/a2a_command_broker.py --tool codex-local --action inspect --goal "Inspect A2A v3 docs"
python3 scripts/a2a/a2a_command_broker.py --tool opencode --action scoped_repo_edit --target-repo openai/codex --goal "Prepare scoped repo edit plan"
python3 scripts/a2a/a2a_model_router.py repo_execution
python3 scripts/a2a/a2a_model_router.py opencode_execution
python3 scripts/a2a/a2a_model_router.py agy_execution
python3 scripts/a2a/a2a_obsidian_sync.py --dry-run --title "A2A check" --summary "Dry-run memory pulse" --source "runtime" --next-action "review"

Output format:
Summary:
Files changed:
Commands run:
Validation:
Policy blocks:
Autonomous next action:
```

## Operator Notes

- Keep this as a local task card, not a secret-bearing config.
- Do not paste API keys into this task.
- If KOB needs to summarize, paste only non-secret runtime artifacts or command
  outputs.
- If Codex needs to stage, create a file list from the complete patch first and
  review `git diff --cached --name-only`.
