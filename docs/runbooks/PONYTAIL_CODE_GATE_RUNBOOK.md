# Ponytail Code Gate Runbook

Status: planned external/plugin gate.

## Purpose

Ponytail is used to reduce over-engineering, code bloat, hidden shortcuts, and
unreviewed complexity in Codex/Claude/OpenCode diffs.

## Install Plan

1. Install through the relevant agent host/plugin marketplace only after
   approval.
2. Inspect lifecycle hooks before trusting them.
3. Trust only hooks that are understood and acceptable for this workspace.
4. Start a new agent thread after trust.

## Operating Mode

- Use `/ponytail full` as the default discipline.
- Use `/ponytail-review` after a meaningful diff.
- Use `/ponytail-audit` before a milestone or release gate.
- Use `/ponytail-debt` to capture accepted shortcuts and follow-up debt.

## Guardrail

Ponytail review must not remove validation, error handling, security checks,
accessibility support, rollback paths, audit logs, or data-loss protections just
to make code smaller.

## Blocked

No plugin install or lifecycle hook trust is allowed without a separate
approval gate.
