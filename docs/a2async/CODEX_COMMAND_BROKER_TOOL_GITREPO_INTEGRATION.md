# Codex Command Broker: Tool And Git Repo Integration

Status: local-first broker scaffold.

The Codex Command Broker is the safe routing layer between the Codex sidebar,
KOB CLI, OpenCode, AGY Antigravity 2, Manus artifacts, and the external Git repo
registry. It does not unlock commands or bypass safety policy. It classifies
requested work into an auditable decision artifact before any executor touches a
repo lane.

## Purpose

The broker turns a broad operator goal into a machine-readable decision:

```text
goal
-> requested tool
-> requested action
-> optional target repo
-> policy lookup
-> repo registry lookup
-> broker decision artifact
-> command packet hash + risk scan
-> A2A task / lease / lane lock / adapter plan
```

This keeps the Codex sidebar goal-driven while preventing direct execution from
browser UI code, Manus summaries, KOB planning output, or external executor
drafts.

Command packets add a second local control layer before any command runner:

- Script: `scripts/a2a/a2a_command_packet.py`
- Runtime JSON:
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/codex_command_packet.json`
- Mission Control fixture:
  `apps/mission-control/src/fixtures/codexCommandPacketStatus.json`

The packet records the masked command preview, command hash, broker decision,
risk flags, lease status, and packet decision. It does not execute the command.

## Tool Classes

| Tool                     | Broker Role                         | Mutation Authority               |
| ------------------------ | ----------------------------------- | -------------------------------- |
| `codex-local`            | repo supervisor and default worker  | scoped edit only with validation |
| `kob`                    | planner, router, context compressor | no repo mutation                 |
| `opencode`               | scoped coding executor              | lease and lane lock required     |
| `agy-antigravity2`       | fast scaffold/refactor executor     | lease and lane lock required     |
| `manus`                  | artifact producer                   | metadata and hash sync only      |
| `deerflow`               | long-horizon runtime route          | inspect/plan only                |
| `flowise`                | local RAG/chatbot blueprint route   | inspect/plan only                |
| `n8n`                    | workflow automation draft route     | inspect/plan only                |
| `odysseus`               | private workspace UI route          | inspect/plan only                |
| `hermes-project-planner` | policy and planning reviewer        | no repo mutation                 |
| `ponytail`               | minimalism review gate              | review only                      |

KOB profile-specific routes such as `kob-cli-opus` and `kob-cli-fable` are
planner/router aliases. `codex-5-6` remains a compatibility/profile alias and
does not replace the `codex-local` execution route.

## Action Classes

| Decision                           | Meaning                                                                |
| ---------------------------------- | ---------------------------------------------------------------------- |
| `auto_allow_dry_run`               | Safe local action. The broker writes an artifact and no live mutation. |
| `requires_executor_lease`          | Repo-affecting work needs executor lease and lane lock first.          |
| `policy_controlled_registry_allow` | Repo action is registry-gated and still not executed by the broker.    |
| `blocked_first_phase`              | Push, deploy, provider call, connector activation, Docker start.       |
| `blocked`                          | Hard safety block, unknown tool, unknown repo, or policy mismatch.     |

## Git Repo Registry Rule

All external repo references must resolve through
`registry/external_git_repos.yaml`. A repo target can match either `repo` or
`name`. Unknown targets are blocked. Candidate or skipped repos stay blocked for
clone/execution even if they can be inspected as registry metadata.

## Hard Blocks

The broker blocks requests that attempt to:

- bypass command policy or jailbreak the control plane
- print secrets, access secrets, read private keys, copy browser profiles, or
  copy token stores
- read or export user data outside an approved scoped workflow
- modify authentication, authorization, payment logic, or security policy
- install new dependencies, run unknown scripts, run database migrations, or
  delete/overwrite files without a scoped lease and rollback path
- disable logging, disable monitoring, modify audit trails, or hide execution
  history
- bypass access controls, bypass rate limits, exfiltrate credentials,
  force-push, deploy, or expose a public endpoint
- perform provider calls or connector activations without a later scoped adapter
- mutate repos directly from KOB, Manus, Ponytail, or Hermes planning output

## Runtime Artifact

Every broker run writes a JSON artifact under:

```text
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/
```

The artifact records:

- tool
- action
- goal hash
- optional target repo
- repo registry match
- policy decision
- required next gate
- hard-block reason when applicable

## Coverage Surfaces

The broker has two read-only Mission Control surfaces for broad production
coverage:

- `Tool Matrix`
  - Doc: `docs/a2async/CODEX_FULL_COMMAND_BROKER_MATRIX.md`
  - Generator: `scripts/a2a/a2a_codex_tool_repo_matrix.py`
  - Fixture: `apps/mission-control/src/fixtures/codexToolRepoMatrixStatus.json`
  - Runtime report:
    `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/codex_tool_repo_matrix.md`
- `Web Deploy`
  - Doc: `docs/a2async/WEB_SIRINX_GENERATED_ASSETS_DEPLOY_LANE.md`
  - Generator: `scripts/a2a/a2a_web_sirinx_deploy_lane.py`
  - Fixture: `apps/mission-control/src/fixtures/webSirinxDeployStatus.json`
  - Runtime report:
    `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/web_sirinx_deploy_lane.md`

These panels classify and display state only. They do not clone repos, stage
files, push, deploy, call providers, sync connectors, read secrets, or disable
policy.

## Safe Examples

```bash
python3 scripts/a2a/a2a_command_broker.py \
  --tool codex-local \
  --action code_review_report \
  --goal "Generate a local automated code review report"
```

The review action resolves to `auto_allow_dry_run`; it can create a report but
must not apply patches, stage files, push, deploy, read secrets, or call
providers.

```bash
python3 scripts/a2a/a2a_command_broker.py \
  --tool codex-local \
  --action inspect \
  --goal "Inspect A2A v3 docs"

python3 scripts/a2a/a2a_command_broker.py \
  --tool opencode \
  --action scoped_repo_edit \
  --target-repo openai/codex \
  --goal "Prepare scoped repo edit plan"
```

The first example resolves to `auto_allow_dry_run`. The second resolves to
`requires_executor_lease`; it does not run OpenCode.

## Unsafe Example Class

Requests to unlock all commands, bypass policy, expose public endpoints, push,
deploy, print secrets, disable logs, export data, change auth/payment/security
controls, or copy credentials resolve to `blocked`. The blocked request is
logged as an artifact so the operator can see why it did not proceed.

Requests such as `unlock_all_security`, `unlock_all_commands`,
`autonomous_approve_all`, `approve_all_actions`, and
`disable_security_controls` are hard-blocked policy actions. The same rule
applies to `exfiltrate_credentials`, `disable_logging`, `disable_monitoring`,
`modify_audit_trail`, `hide_execution_history`, `production_deploy`, and
`external_api_write_actions`. They cannot become an executor lease, clone
preflight, connector write, provider call, or deployment route.

## Next Integration

Mission Control can read broker artifacts as a read-only status panel. It should
never run the broker from browser UI code.

The local fixture exporter is:

```bash
python3 scripts/a2a/a2a_export_broker_status_fixture.py
```

It reads broker artifacts from the runtime folder and writes:

```text
apps/mission-control/src/fixtures/codexCommandBrokerStatus.json
```

The Mission Control `Tool Payloads` tab consumes that fixture only. It does not
read runtime files directly from the browser.

Validate the fixture before using it for operator review:

```bash
python3 scripts/a2a/a2a_validate_broker_status.py
```

The validator checks summary counts, artifact-path consistency, allowed
decision values, secret-like text masking, and required no-provider/no-push
boundaries. It writes:

```text
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/broker_status_validation.json
```

The localhost browser-level DOM check for the Mission Control `Tool Payloads`
tab writes:

```text
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/mission_control_tool_payloads_dom_check.json
```

This check verifies that the panel renders connector draft counts, broker
decision counts, lease-required and registry-controlled states, blocked
jailbreak/policy-bypass state, and the no-provider/no-clone/no-push/no-deploy
boundary from the static fixture.
