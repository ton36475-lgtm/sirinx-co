# Command Broker Testing

The command broker production lane is tested without executing brokered
commands.

## Static Checks

- Python compile for generator scripts.
- JSON parse for generated fixtures and runtime policy files.
- Mission Control TypeScript compile.
- Prettier check for docs, JSON, and UI files.
- `git diff --check` scoped to this lane.

## Runtime Checks

Generate runtime state:

```bash
python3 scripts/a2a/a2a_command_broker_production_lane.py
```

Expected outputs:

- `apps/mission-control/src/fixtures/commandBrokerProductionStatus.json`
- `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/command_broker/state/status.json`
- `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/command_broker_production_lane.json`
- `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/command_broker_production_lane.md`

## TypeScript Contract Checks

Run the package tests:

```bash
pnpm --filter @sirinx/command-broker test
pnpm --filter @sirinx/command-broker build
```

The tests cover:

- read-only inspection
- local validation
- scoped docs/fixture writes
- path-scope violations
- executor-lease actions
- production deploy gating
- approve-all denial
- risky command text denial
- external repo clone preflight
- unverified repo clone review
- unknown tool denial
- Docker localhost adapter validator
- external repo clone adapter validator
- provider API smoke adapter validator
- MCP connector activation adapter validator

Adapter validator tests assert two invariants:

- passing preflight never enables direct execution
- failing safety gates returns `DENY` with explicit machine-readable reasons

## Pass Criteria

- Direct execution remains disabled.
- Deploy command remains blocked.
- Unknown commands fail closed.
- Deny-always actions map to `DENY`.
- Mission Control is read-only.
- Docker, clone, provider API, and MCP connector adapters remain preflight-only.
