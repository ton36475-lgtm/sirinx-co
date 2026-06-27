# A2A Goal Coverage Audit

Status: local-only coverage audit for the GHOSTCLAW all-tool/all-Git-repo goal.

This lane turns the broad goal into measurable local evidence. It does not
unlock raw execution. It reports which parts of the A2A/KOB/Codex/OpenCode/AGY
Antigravity 2/Manus control plane are represented in files, policies, scoped
lanes, and runtime reports.

## Command

```bash
python3 scripts/a2a/a2a_goal_coverage_audit.py
```

The command writes:

```text
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/goal_coverage_audit.json
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/goal_coverage_audit.md
```

## Inputs

- `agents/a2a/*.agent.json`
- `registry/external_git_repos.yaml`
- `registry/repo_roles.yaml`
- `registry/integration_order.yaml`
- `policies/codex_command_broker.json`
- `policies/autopilot_adapter_registry.json`
- `policies/a2a_scoped_lanes.json`
- `policies/tool_integration_targets.yaml`
- runtime logs under
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/`

## What It Measures

- A2A agent card coverage for Codex local, KOB, OpenCode, AGY Antigravity 2,
  Manus, Hermes planner, Ponytail, DeerFlow, Flowise, Odysseus, and n8n.
- Broker route coverage for the same agent set.
- External Git repo registry coverage and clone-policy distribution.
- Command Broker action classes, hard blocks, and direct-execution boundary.
- Adapter contract registry coverage for Docker localhost start, external repo
  clone, provider API smoke, and MCP connector activation.
- Scoped lane registration for command broker, Deep Research, Mission Control,
  and this coverage audit lane.
- Runtime report presence for the current local evidence pack.
- Connector target binding coverage for Airtable, Linear, Notion, and GitHub.

## Boundary

This audit is allowed to inspect local files and write local runtime reports. It
must not:

- jailbreak, bypass, or disable policy
- read or print secrets
- call providers
- write connector records
- clone repositories
- start Docker or local services
- push, deploy, or publish
- mutate generated web assets

## Expected Interpretation

`ready_for_local_review_only` means the control plane is documented and locally
visible, but real execution remains separated into dedicated executor-lease
lanes.

`blocked_for_real_execution` means at least one required hard block, adapter
contract, or connector target boundary is missing. Local documentation and
runtime evidence can continue, but external actions must stay blocked.

## Next Safe Action

Review the generated Markdown report, then bind missing connector targets
without secret values. After that, run scoped-lane status for this lane before
any staging decision.
