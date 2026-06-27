# A2A Integration Readiness Matrix

Status: local-only integration readiness report.

The A2A Integration Readiness Matrix summarizes the current local readiness of
Codex, KOB CLI, OpenCode, AGY Antigravity 2, Manus, connector payload drafts,
and the external Git repo registry. It does not execute tools or unlock blocked
commands.

## Command

```bash
python3 scripts/a2a/a2a_integration_readiness.py
```

The command writes:

```text
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/a2a_integration_readiness_matrix.json
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/a2a_integration_readiness_matrix.md
```

## Inputs

- `agents/a2a/*.agent.json`
- `registry/external_git_repos.yaml`
- `policies/codex_command_broker.json`
- `apps/mission-control/src/fixtures/codexCommandBrokerStatus.json`
- `apps/mission-control/src/fixtures/toolIntegrationPayloadStatus.json`

## What It Reports

- agent card count and broker routing coverage
- lease-required executor list
- registered Git repo count and clone-policy counts
- connector draft counts and target binding status
- broker runtime decision counts
- required hard-block coverage for jailbreak/policy-bypass/secret/push/deploy
  classes
- required hard-block coverage for unlock-all-security and
  autonomous-approve-all classes

## Broker Route Coverage

Every A2A agent card should either have a broker route or be intentionally
classified as out-of-scope. Planning agents such as KOB profile aliases are
dry-run routes only. Execution-oriented surfaces such as OpenCode and AGY
Antigravity 2 require an executor lease and lane lock before any repo-affecting
work. Service runtimes such as DeerFlow, Flowise, n8n, and Odysseus remain
inspect/plan/dry-run routes until a dedicated service runtime lane is opened.

## Boundaries

- no jailbreak or policy bypass
- no unlock-all-security or autonomous-approve-all mode
- no provider call
- no connector write
- no external repo clone
- no push
- no deploy
- no public endpoint
- no secret read or print

## Current Expected State

The current expected status is `blocked_for_external_execution` while Airtable,
Linear, Notion, and GitHub targets remain unbound. This is correct: local review
and planning can continue, but connector sync and live external actions remain
blocked until target IDs and a separate sync lane are opened.
