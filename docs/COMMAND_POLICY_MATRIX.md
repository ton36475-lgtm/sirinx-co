# Command Policy Matrix

The broker maps command requests to production decisions. Unknown commands fail
closed.

| Decision                 | Meaning                                    | Examples                                              |
| ------------------------ | ------------------------------------------ | ----------------------------------------------------- |
| `ALLOW_READONLY`         | Inspect-only, no mutation                  | status, list files, read docs                         |
| `ALLOW_LOCAL_VALIDATION` | Local checks with no external write        | lint, tests, typecheck                                |
| `ALLOW_SCOPED_WRITE`     | Narrow local artifact or patch generation  | docs, fixtures, non-destructive patches               |
| `REQUIRE_HUMAN_REVIEW`   | Risky local or production-adjacent command | dependency install, build executor lease, deploy prep |
| `DENY`                   | Always blocked                             | credential export, audit tamper, approve-all          |
| `ESCALATE_INCIDENT`      | Reserved for suspected compromise          | secret exposure attempt, hidden execution request     |

## Deny Always

These requests are not converted into automation:

- `approve_all_actions`
- `security_controls_none`
- `bypass_access_control`
- `bypass_rate_limits`
- `disable_logging`
- `disable_monitoring`
- `hide_execution_history`
- `modify_audit_trail`
- `exfiltrate_credentials`
- `print_secret`
- `read_private_key`
- `git_add_all`
- `rm_rf_root`
- `production_deploy_without_evidence`

## Required Evidence for Production Actions

Production-adjacent actions require:

- command packet
- scoped file list
- check/test/build evidence where applicable
- target binding
- rollback plan
- health check plan
- audit log entry
- no secret exposure

## Contract Package

`packages/command-broker` is the machine-readable policy contract for local
Codex/A2A executors. It mirrors the production vocabulary used by the runtime
lane:

- tools
- actions
- risk tiers
- production decisions
- executor lease requirement
- evidence requirement

The contract returns decisions only. It does not run commands.

## Adapter Validator Contracts

Production-adjacent adapters are validated before any executor lane can touch a
real system:

| Adapter                    | Minimum contract checks                                            | Passing decision       | Execution |
| -------------------------- | ------------------------------------------------------------------ | ---------------------- | --------- |
| `docker_localhost_start`   | loopback bind, auth required, rollback command, no public port     | `REQUIRE_HUMAN_REVIEW` | disabled  |
| `external_repo_clone`      | clone policy allow, verified repo, path under `_external_repos`    | `REQUIRE_HUMAN_REVIEW` | disabled  |
| `provider_api_smoke`       | provider allowlist, key presence boolean, budget, rate limit key   | `REQUIRE_HUMAN_REVIEW` | disabled  |
| `mcp_connector_activation` | connector allowlist, auth required, scope bound, no external write | `REQUIRE_HUMAN_REVIEW` | disabled  |

These validators convert “approve all automation” requests into inspectable
preflight packets. They do not perform Docker starts, clones, API calls,
connector writes, pushes, deploys, or secret reads.
