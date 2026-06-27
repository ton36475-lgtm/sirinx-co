# Autopilot Policy Spec

Status: active design layer.

## Unlock Profile

Active profile: `OPERATIONAL_MAX`.

All operational blocks are unlocked into policy-controlled execution. The
system does not wait for human approval for clone, install, localhost Docker,
provider smoke, workflow activation, deploy, publish, send, CRM write, memory
writeback, or connector activation when policy, budget, rate limit,
verification, rollback, and audit requirements pass.

Hard safety blocks are still enforced. These are not approval gates; they are
machine-deny rules for actions that would leak secrets, disable security,
expose raw infrastructure, bypass quotas/captcha, contact non-opt-in people, or
spend beyond caps.

## Risk Tiers

| Tier              | Meaning                             | Default                                                               |
| ----------------- | ----------------------------------- | --------------------------------------------------------------------- |
| A0                | Inspect only                        | Auto allow                                                            |
| A1                | Draft local artifacts               | Auto allow                                                            |
| A2                | Local modify inside allowed paths   | Auto allow if path matches                                            |
| A3                | Sandbox external/localhost runtime  | Auto allow if whitelist and limits pass                               |
| A4                | Business action                     | Auto allow only with opt-in, whitelist, and rate limit                |
| A5                | Production action                   | Auto allow only with green verification, backup, canary, and rollback |
| POLICY_CONTROLLED | Formerly blocked operational action | Auto allow when policy lease passes                                   |
| HARD_BLOCKED      | Prohibited safety action            | Auto block, log, quarantine/skip                                      |

## Core Policy Questions

For each task:

1. Is the action type allowed?
2. Is the target path or service allowed?
3. Is the repository/provider/channel whitelisted?
4. Is a budget cap defined and still available?
5. Is a rate limit defined and still available?
6. Is a rollback or quarantine path available?
7. Would this print, read, or exfiltrate secrets?
8. Would this expose raw admin/model/database/vector ports publicly?
9. Would this contact non-opt-in recipients?
10. Is the kill switch off?

If any required answer is missing, the policy engine must fail closed.

## Decision Values

- `auto_allow`
- `auto_allow_with_limits`
- `auto_allow_policy_controlled`
- `auto_block`
- `auto_hard_block`
- `auto_quarantine`
- `auto_skip`
- `auto_retry`
- `auto_rollback`

## Unlocked Operational Actions

- Git push / merge / rebase when branch policy and verification pass.
- External repo clone when the repo is whitelisted.
- Dependency install only in venv/container.
- Docker start only on localhost with auth/security checks.
- Provider/API calls only with key presence, budget cap, and rate limit.
- Telegram/social/email sends only to whitelisted or opt-in recipients.
- n8n/MCP activation only with policy manifest and rollback/deactivate path.
- Deploy only when tests/build/backup/canary/rollback pass.
