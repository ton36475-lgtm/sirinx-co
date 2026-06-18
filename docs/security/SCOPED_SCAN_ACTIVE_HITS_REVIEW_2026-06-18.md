# Scoped Scan Active Hits Review - 2026-06-18

Status: local-only masked review. No secret values or risky line contents are
included in this report.

## Inputs

- Secret marker report:
  `/tmp/ghostclaw_masked_secret_scan_scoped2_20260618_222701.txt`
- Risk grep report:
  `/tmp/ghostclaw_risk_grep_scoped2_20260618_222701.txt`

## Summary

The scanners were tuned to exclude external/tooling noise such as
`tools/repo-intake`, `tools/cli-anything-lab`, `vendor`, `legacy`, `outputs`,
`reports`, nested build outputs, virtual environments, caches, site packages,
and lockfiles.

After tuning:

- Secret marker hits: 447 file:line entries.
- Risk grep hits: 264 file:line entries.

These are marker hits only. They do not prove that secrets or unsafe commands
exist. Every candidate must be manually reviewed without printing sensitive
line contents.

## Secret Marker Bucket Counts

| Bucket | Count |
|---|---:|
| docs | 163 |
| apps | 151 |
| vault | 55 |
| root_or_other | 45 |
| scripts | 15 |
| brands | 11 |
| packages | 7 |

## Secret Marker Top Review Files

| Count | File |
|---:|---|
| 40 | `docs/repo-intake/2026-06-05-continuation-execution-board.md` |
| 39 | `vault/timeline/index.md` |
| 34 | `apps/web-sirinx/server/_core/sdk.ts` |
| 20 | `docs/product-design/TESTSPRITE_MCP_VALIDATION_LAYER_SPEC.md` |
| 16 | `vault/oracle-memory/CLAIMS.md` |
| 15 | `PROJECT_STATE.md` |
| 12 | `docs/oracle/TESTSPRITE_MCP_PROOF_MODEL.md` |
| 11 | `docs/mcp/TESTSPRITE_MCP_LOCAL_CONFIG_RUNBOOK.md` |
| 11 | `apps/mission-control/src/App.tsx` |
| 10 | `docs/product-design/HEADROOM_HERMES_ADAPTER_SPEC.md` |
| 10 | `apps/web-sirinx/server/_core/types/manusTypes.ts` |
| 10 | `apps/web-sirinx/infra/scripts/server-receiver-install.sh` |
| 10 | `NEXT_ACTIONS.md` |

## Risk Grep Bucket Counts

| Bucket | Count |
|---|---:|
| apps | 90 |
| docs | 54 |
| packages | 41 |
| root_or_other | 33 |
| vault | 22 |
| brands | 20 |
| scripts | 4 |

## Risk Grep Top Review Files

| Count | File |
|---:|---|
| 18 | `PROJECT_STATE.md` |
| 17 | `vault/timeline/index.md` |
| 17 | `docs/repo-intake/2026-06-05-continuation-execution-board.md` |
| 15 | `apps/mission-control/src/App.tsx` |
| 13 | `packages/openhands-adapter/src/hands-client.ts` |
| 9 | `packages/hermes-core/src/tools/safe-command-tool.ts` |
| 7 | `apps/web-sirinx/shared/_core/agentContracts.ts` |
| 7 | `apps/web-sirinx/client/src/pages/admin/AgentMonitor.tsx` |
| 5 | `vault/oracle-memory/CLAIMS.md` |
| 5 | `packages/orchestration-envelope/src/validator.test.ts` |
| 5 | `apps/web-sirinx/server/_core/localLeadQueue.ts` |
| 5 | `apps/web-sirinx/infra/scripts/ultimate-validator.sh` |
| 5 | `apps/web-sirinx/infra/scripts/full-system-review.ps1` |
| 5 | `AGENTS.md` |

## Triage Lanes

### Lane A - Active Source Review

Highest priority because these files can affect runtime behavior:

- `apps/web-sirinx/server/_core/sdk.ts`
- `apps/web-sirinx/server/_core/llm.ts`
- `apps/web-sirinx/server/_core/oauth.ts`
- `apps/web-sirinx/server/_core/types/manusTypes.ts`
- `apps/web-sirinx/server/_core/localLeadQueue.ts`
- `packages/openhands-adapter/src/hands-client.ts`
- `packages/hermes-core/src/tools/safe-command-tool.ts`
- `packages/content-factory/src/index.ts`
- `apps/mission-control/src/App.tsx`

Required review method:

- Inspect only the nearby code needed to classify the marker.
- Do not print or copy any secret value.
- Classify as placeholder, environment variable name, test fixture,
  documentation reference, generated false positive, or real leak.

### Lane B - Governance And Memory Review

Medium priority because these files often mention tokens/secrets as policy text:

- `AGENTS.md`
- `PROJECT_STATE.md`
- `NEXT_ACTIONS.md`
- `vault/timeline/index.md`
- `vault/oracle-memory/CLAIMS.md`
- `docs/repo-intake/*`
- `docs/product-design/*`
- `docs/oracle/*`
- `docs/mcp/*`
- `docs/security/*`

Required review method:

- Prefer pattern classification over content printing.
- Keep policy examples generic and avoid real-looking tokens.
- Replace any real-looking sample token with a neutral placeholder.

### Lane C - Infra Script Review

Medium-high priority because scripts can execute commands:

- `apps/web-sirinx/infra/scripts/server-receiver-install.sh`
- `apps/web-sirinx/infra/scripts/server-preflight.sh`
- `apps/web-sirinx/infra/scripts/pre-deploy-check.sh`
- `apps/web-sirinx/infra/scripts/ultimate-validator.sh`
- `apps/web-sirinx/infra/scripts/full-system-review.ps1`
- `apps/web-sirinx/infra/scripts/validate-agent-contracts.py`

Required review method:

- Confirm scripts fail closed.
- Confirm deployment/server actions require explicit approval.
- Confirm no secret values are echoed.

## Recommended Next Gate

`APPROVE_CLASSIFY_SCOPED_SCAN_HITS_LOCAL_ONLY`

Scope:

- Classify the top active source and infra hits without printing line contents.
- Produce a table with `file`, `hit_count`, `classification`, `risk`,
  `action_needed`.
- Do not edit source files unless a separate fix approval is given.

## Blocked Without Separate Approval

- Editing active source to remediate hits.
- Staging/committing scan scripts or docs.
- Running deploy/push/publish/live-send commands.
- Starting Docker, MCP, or external services.
- Reading or printing secret values.
