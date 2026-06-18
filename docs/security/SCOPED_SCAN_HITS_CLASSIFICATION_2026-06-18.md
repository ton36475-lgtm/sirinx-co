# Scoped Scan Hits Classification - 2026-06-18

Status: local-only classification. No secret values, risky line contents, or
source snippets are included.

## Inputs

- Secret marker report:
  `/tmp/ghostclaw_masked_secret_scan_scoped2_20260618_222701.txt`
- Risk grep report:
  `/tmp/ghostclaw_risk_grep_scoped2_20260618_222701.txt`
- Previous review:
  `docs/security/SCOPED_SCAN_ACTIVE_HITS_REVIEW_2026-06-18.md`

## Scope

This pass classifies top active source, governance/memory, and infra hits. It
does not remediate source files, stage changes, commit, run deployments, start
services, or call external APIs.

## Classification Table

| File | Secret hits | Risk hits | Classification | Risk | Action needed |
|---|---:|---:|---|---|---|
| `apps/web-sirinx/server/_core/sdk.ts` | 34 | 3 | provider_or_server_boundary_source | medium | Confirm env-only secrets, no hardcoded keys, no secret logging, and safe error messages. |
| `apps/web-sirinx/server/_core/llm.ts` | 8 | 0 | provider_or_server_boundary_source | medium | Confirm env-only secrets, no hardcoded keys, no secret logging, and safe error messages. |
| `apps/web-sirinx/server/_core/oauth.ts` | 4 | 0 | provider_or_server_boundary_source | medium | Confirm env-only secrets, no hardcoded keys, no secret logging, and safe error messages. |
| `apps/web-sirinx/server/_core/types/manusTypes.ts` | 10 | 0 | provider_or_server_boundary_source | medium | Confirm env-only secrets, no hardcoded keys, no secret logging, and safe error messages. |
| `apps/web-sirinx/server/_core/localLeadQueue.ts` | 0 | 5 | provider_or_server_boundary_source | medium | Confirm env-only secrets, no hardcoded keys, no secret logging, and safe error messages. |
| `packages/openhands-adapter/src/hands-client.ts` | 0 | 13 | external_worker_adapter_surface | medium-high | Confirm adapter cannot execute or call external services without policy approval and redacted logs. |
| `packages/hermes-core/src/tools/safe-command-tool.ts` | 0 | 9 | command_execution_guardrail_source | medium-high | Review allow/deny policy, logging redaction, shell boundaries, and approval enforcement. |
| `packages/content-factory/src/index.ts` | 6 | 1 | active_source_marker_reference | medium | Manual masked review recommended before staging. |
| `apps/mission-control/src/App.tsx` | 11 | 15 | ui_status_or_policy_surface | medium | Confirm UI displays labels/placeholders only and never embeds real tokens. |
| `apps/web-sirinx/infra/scripts/server-receiver-install.sh` | 10 | 1 | infra_command_surface | medium-high | Confirm fail-closed behavior, explicit approval gates, and no secret echoing before any live use. |
| `apps/web-sirinx/infra/scripts/server-preflight.sh` | 6 | 1 | infra_command_surface | medium-high | Confirm fail-closed behavior, explicit approval gates, and no secret echoing before any live use. |
| `apps/web-sirinx/infra/scripts/pre-deploy-check.sh` | 5 | 0 | infra_command_surface | medium | Confirm fail-closed behavior, explicit approval gates, and no secret echoing before any live use. |
| `apps/web-sirinx/infra/scripts/ultimate-validator.sh` | 3 | 5 | infra_command_surface | medium-high | Confirm fail-closed behavior, explicit approval gates, and no secret echoing before any live use. |
| `apps/web-sirinx/infra/scripts/full-system-review.ps1` | 0 | 5 | infra_command_surface | medium-high | Confirm fail-closed behavior, explicit approval gates, and no secret echoing before any live use. |
| `apps/web-sirinx/infra/scripts/validate-agent-contracts.py` | 3 | 3 | infra_command_surface | medium-high | Confirm fail-closed behavior, explicit approval gates, and no secret echoing before any live use. |
| `docs/repo-intake/2026-06-05-continuation-execution-board.md` | 40 | 17 | documentation_or_memory_reference | medium | Review samples/placeholders only; replace any real-looking token text with neutral placeholders. |
| `vault/timeline/index.md` | 39 | 17 | documentation_or_memory_reference | medium | Review samples/placeholders only; replace any real-looking token text with neutral placeholders. |
| `vault/oracle-memory/CLAIMS.md` | 16 | 5 | documentation_or_memory_reference | medium | Review samples/placeholders only; replace any real-looking token text with neutral placeholders. |
| `PROJECT_STATE.md` | 15 | 18 | documentation_or_memory_reference | medium | Review samples/placeholders only; replace any real-looking token text with neutral placeholders. |
| `NEXT_ACTIONS.md` | 10 | 2 | documentation_or_memory_reference | low | Review samples/placeholders only; replace any real-looking token text with neutral placeholders. |
| `AGENTS.md` | 7 | 5 | documentation_or_memory_reference | low | Review samples/placeholders only; replace any real-looking token text with neutral placeholders. |
| `docs/product-design/TESTSPRITE_MCP_VALIDATION_LAYER_SPEC.md` | 20 | 2 | documentation_or_memory_reference | medium | Review samples/placeholders only; replace any real-looking token text with neutral placeholders. |
| `docs/oracle/TESTSPRITE_MCP_PROOF_MODEL.md` | 12 | 0 | documentation_or_memory_reference | low | Review samples/placeholders only; replace any real-looking token text with neutral placeholders. |
| `docs/mcp/TESTSPRITE_MCP_LOCAL_CONFIG_RUNBOOK.md` | 11 | 1 | documentation_or_memory_reference | low | Review samples/placeholders only; replace any real-looking token text with neutral placeholders. |
| `docs/product-design/HEADROOM_HERMES_ADAPTER_SPEC.md` | 10 | 3 | documentation_or_memory_reference | low | Review samples/placeholders only; replace any real-looking token text with neutral placeholders. |
| `apps/web-sirinx/shared/_core/agentContracts.ts` | 2 | 7 | active_source_marker_reference | medium | Manual masked review recommended before staging. |
| `apps/web-sirinx/client/src/pages/admin/AgentMonitor.tsx` | 0 | 7 | active_source_marker_reference | medium | Manual masked review recommended before staging. |
| `packages/orchestration-envelope/src/validator.test.ts` | 1 | 5 | test_fixture_or_validator_reference | low | Keep fixtures synthetic; ensure examples cannot be mistaken for real credentials. |

## Priority Order

1. `packages/hermes-core/src/tools/safe-command-tool.ts`
2. `packages/openhands-adapter/src/hands-client.ts`
3. `apps/web-sirinx/infra/scripts/server-receiver-install.sh`
4. `apps/web-sirinx/infra/scripts/ultimate-validator.sh`
5. `apps/web-sirinx/server/_core/sdk.ts`
6. `apps/web-sirinx/server/_core/llm.ts`
7. `apps/web-sirinx/server/_core/oauth.ts`
8. `apps/mission-control/src/App.tsx`
9. Governance and memory docs with real-looking examples.

## Findings

- No confirmed secret leak was established by this classification pass.
- Highest-risk areas are command execution guardrails, external worker adapters,
  and infra scripts because they can affect runtime behavior.
- Provider/server boundary files need focused review for env-only secrets and
  log redaction.
- Governance, memory, and repo-intake docs are likely policy/example references,
  but real-looking sample values should be normalized.

## Recommended Next Gate

`APPROVE_MANUAL_MASKED_REVIEW_PRIORITY_SOURCE_FILES_LOCAL_ONLY`

Scope:

- Review the highest-priority source/infra files above.
- Keep output to classification only.
- Do not print line contents or secret values.
- Do not edit source files without a separate remediation approval.

## Separate Remediation Gate

If manual review confirms actual issues, use a separate fix approval:

`APPROVE_REMEDIATE_CONFIRMED_SCAN_ISSUES_LOCAL_ONLY`
