# Codex Goal Plan Board

Status: local-only Mission Control planning surface.

The Codex Goal Plan Board is a read-only control surface for the Mac mini M2
Codex sidebar. It converts the current local A2A, broker, connector, scoped
lane, registry, and Obsidian sync evidence into a compact plan that Mission
Control can render without shell access.

It is not an all-access approval switch.

## Purpose

The board answers four questions before any worker continues:

1. What work lanes exist right now?
2. Which lanes are safe local review work?
3. Which lanes need a scoped target, executor lease, or separate gated phase?
4. Which requested actions are hard-blocked and must not be converted into
   automation?

## Generator

```bash
python3 scripts/a2a/a2a_goal_plan_board.py
```

The generator writes:

```text
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/codex_goal_plan_board.json
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/codex_goal_plan_board.md
apps/mission-control/src/fixtures/codexGoalPlanStatus.json
```

The Mission Control fixture is static JSON. Browser UI code does not read the
filesystem, call providers, sync connectors, clone repos, push, deploy, or open
public endpoints.

## Inputs

- `PROJECT_STATE.md`
- `NEXT_ACTIONS.md`
- `AGENTS.md`
- `docs/a2async/*` broker and readiness docs
- `apps/mission-control/src/fixtures/codexCommandBrokerStatus.json`
- `apps/mission-control/src/fixtures/toolIntegrationPayloadStatus.json`
- runtime reports under
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/`
- metadata for
  `/Users/sirinx/Documents/Obsidian Vault/SIRINX/AI HQ Knowledge Digest.md`

The Obsidian note is used as metadata only. The generator does not ingest raw
note content into the Mission Control fixture.

## Work Lane Statuses

| Status    | Meaning                                                           |
| --------- | ----------------------------------------------------------------- |
| `safe`    | Local-only action can continue inside existing policy boundaries. |
| `ready`   | Ready for operator review or scoped staging review.               |
| `gated`   | Requires a dedicated future lane before real execution.           |
| `blocked` | Must not execute until policy changes and safety review occur.    |

## Current Hard Blocks

The board reads hard blocks from `policies/codex_command_broker.json` and adds
board-specific external action blocks. It must keep these classes blocked:

- `unlock_all_security`
- `unlock_all_commands`
- `autonomous_approve_all`
- `approve_all_actions`
- `disable_security_controls`
- `access_secrets`
- `read_or_export_user_data`
- `modify_authentication`
- `modify_authorization`
- `change_payment_logic`
- `change_security_policy`
- `install_new_dependencies`
- `run_unknown_scripts`
- `database_migration`
- `delete_or_overwrite_files`
- `production_deploy`
- `external_api_write_actions`
- `disable_logging`
- `disable_monitoring`
- `bypass_access_control`
- `bypass_rate_limits`
- `exfiltrate_credentials`
- `modify_audit_trail`
- `hide_execution_history`
- `print_secret`
- `push`
- `deploy`
- `public_endpoint`
- `provider_call`
- `connector_write_without_target_binding`

Blocked decisions are visible in Mission Control only as evidence. A blocked
decision must not become a bypass, executor lease, connector write, provider
call, clone, push, deploy, or public endpoint.

## Expected Use

Use the board before continuing broad work such as:

- "all workflow"
- "all jobs"
- "all knowledge"
- local Codex sidebar task planning
- KOB planner handoff
- OpenCode or AGY Antigravity 2 execution planning
- Manus artifact review

The safe route remains:

```text
KOB plans / compresses / routes
-> A2A task or local fixture
-> Codex local executes scoped repo work
-> broker validates action class
-> Mission Control renders read-only evidence
-> Obsidian gets a concise non-secret pulse
```

## Validation

Run these checks after changing the board or panel:

```bash
python3 scripts/a2a/a2a_goal_plan_board.py
python3 scripts/a2a/a2a_scoped_lane_status.py --lane codex-command-broker-mission-control --strict
python3 scripts/a2a/a2a_validate_broker_status.py --strict
python3 -m py_compile scripts/a2a/a2a_goal_plan_board.py
pnpm exec tsc -p apps/mission-control/tsconfig.json --noEmit
```

Do not use `git add .`. Stage only the scoped lane after the operator asks for a
commit and after reviewing the scoped lane report.
