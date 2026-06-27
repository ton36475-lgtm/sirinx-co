# Command Broker Production

Command Broker Production is the control lane for unlocking command visibility
without unlocking unsafe execution. Every Codex, KOB, OpenCode, AGY,
Manus, A2A, connector, deploy, or external repo action must be represented as a
brokered command request before an executor is allowed to act.

This lane does not mean approve-all. It means:

1. Register the command.
2. Classify the command.
3. Score the risk tier.
4. Apply policy.
5. Require lease or review where needed.
6. Write audit evidence.
7. Keep direct shell execution outside the browser UI.

## Runtime

The production broker runtime is outside git:

`/Users/sirinx/SIRINXDev/.ghostclaw_runtime/command_broker/`

Generated runtime folders:

- `registry/`
- `policies/`
- `requests/`
- `results/`
- `logs/`
- `locks/`
- `schemas/`
- `state/`

The generator is:

`scripts/a2a/a2a_command_broker_production_lane.py`

The TypeScript contract package is:

`packages/command-broker`

It provides a typed `decideCommandRequest` API for command request
classification. The package does not execute shell commands; it only returns a
decision, risk tier, required gate, and evidence requirements.

It also provides preflight-only adapter validators for production-adjacent
actions:

- `docker_localhost_start`: requires loopback bind, auth, rollback evidence, and
  no public port.
- `external_repo_clone`: requires allowlisted repo policy, verified repo value,
  and a clone path under `_external_repos`.
- `provider_api_smoke`: requires allowlisted provider, key-presence boolean,
  budget cap, and rate-limit key. It never accepts or returns secret values.
- `mcp_connector_activation`: requires allowlisted connector, auth, scoped
  target binding, and no external write in the activation preflight.

Passing an adapter validator still returns `REQUIRE_HUMAN_REVIEW` and
`allowedToExecute=false`. The broker validates readiness; it does not start
Docker, clone repos, call providers, activate connectors, push, or deploy.

It writes a read-only Mission Control fixture:

`apps/mission-control/src/fixtures/commandBrokerProductionStatus.json`

## Boundary

Allowed in this lane:

- Command registry generation.
- Risk tier mapping.
- JSON schema generation.
- Audit log file initialization.
- Mission Control read-only status.
- Documentation and policy review.

Blocked in this lane:

- Direct shell execution from the broker.
- `git add .`.
- Stage, commit, push, deploy.
- Wrangler or Cloudflare deploy.
- Provider calls.
- Connector writes.
- Secret reads or secret display.
- Audit log editing.
- Approve-all behavior.

## Production Pipeline

```text
Command Request
-> Identity / Source Check
-> Command Classification
-> Risk Tier Assignment
-> Policy Decision
-> Scope Validation
-> Dry Run / Evidence Check
-> Executor Lease when required
-> Audit Log
-> Result Artifact
```

## Current Use

The first production lane connects the pending `web-sirinx` Cloudflare Pages
deploy backlog to the command broker. The deploy command is visible, hashed,
classified as an external production action, and blocked until required
evidence is complete. The pending deploy lane is therefore represented as a
controlled command packet, not an executable button.

## TypeScript Contract

The contract layer accepts:

- `requestId`
- `sourceTool`
- `action`
- `goal`
- optional `commandPreview`
- optional `targetRepo`
- optional `touchedPaths`

It returns:

- `riskTier`
- `decision`
- `reason`
- `requiredGate`
- `auditRequired`
- `executorLeaseRequired`
- `allowedToExecute`
- `evidenceRequired`

The current package deliberately sets `allowedToExecute` to `false` for all
decisions. Execution must be performed by a separate audited executor lane.
