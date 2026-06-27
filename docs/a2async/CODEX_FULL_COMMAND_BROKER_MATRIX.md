# Codex Full Command Broker Matrix

Status: local read-only control surface.

This document defines the meaning of "unlock all commands" for GHOSTCLAW:
commands are not bypassed or blindly approved. Every command class must be
classified by the Codex command broker before any executor, tool, repo action,
connector, deploy, or provider lane can run.

## Runtime Artifacts

- Generator:
  `scripts/a2a/a2a_codex_tool_repo_matrix.py`
- Runtime JSON:
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/codex_tool_repo_matrix.json`
- Runtime Markdown:
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/codex_tool_repo_matrix.md`
- Mission Control fixture:
  `apps/mission-control/src/fixtures/codexToolRepoMatrixStatus.json`
- Mission Control panel: `Tool Matrix`

## Command Classes

| Class               | Decision                           | Examples                                                            |
| ------------------- | ---------------------------------- | ------------------------------------------------------------------- |
| Local inspect       | `auto_allow_dry_run`               | read repo files, inspect architecture, validate registry            |
| Local planning      | `auto_allow_dry_run`               | plan, route, summarize, compress context                            |
| Local QA            | `auto_allow_dry_run`               | lint plan, unit test plan, code review report, security review plan |
| Artifact sync       | `auto_allow_dry_run`               | Manus hash sync, artifact metadata review                           |
| Repo mutation       | `requires_executor_lease`          | scoped repo edit, non-destructive patches, refactor proposals       |
| External clone      | `policy_controlled_registry_allow` | whitelisted repo clone after adapter preflight                      |
| Production/external | `blocked_first_phase`              | push, deploy, provider call, connector activation, Docker start     |
| Hard safety block   | `blocked`                          | jailbreak, policy bypass, secrets, auth/payment/security mutation   |

## Current Coverage

The matrix currently reads:

- A2A agent cards from `agents/a2a/`
- Git repo registry from `registry/external_git_repos.yaml`
- Broker policy from `policies/codex_command_broker.json`
- Runtime broker decisions from local JSON artifacts

It classifies each registered repo against:

- `registry_validate`
- `repo_audit_readonly`
- `clone_whitelisted_external_repo`
- `scoped_repo_edit`
- `push`
- `deploy`
- `approve_all_actions`

## Production Rule

Production automation is allowed only after a specific adapter lane exists with:

1. command class
2. target scope
3. expected artifacts
4. rollback plan
5. audit log
6. rate/budget limits if external
7. clear broker decision

The broker must fail closed for unknown tools, unknown actions, missing repo
registry entries, missing target IDs, public endpoints, and any secret-bearing
operation.

## Explicit Non-Goals

- No jailbreak prompts.
- No bypass instructions.
- No direct `approve all` behavior.
- No hidden execution history.
- No push, deploy, provider call, connector write, Docker start, or repo clone
  from this matrix.
