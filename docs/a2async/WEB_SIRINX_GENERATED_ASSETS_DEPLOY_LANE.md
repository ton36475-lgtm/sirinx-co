# web-sirinx Generated Assets and Deploy Lane

Status: local manifest ready; deploy blocked until scoped validation and target
evidence are reviewed.

## Purpose

This lane tracks the generated `apps/web-sirinx/dist/public` backlog separately
from A2A/Mission Control work. It lets Codex inspect the generated asset state
without staging, pushing, deploying, calling Cloudflare, reading secrets, or
mutating production.

## Runtime Artifacts

- Generator:
  `scripts/a2a/a2a_web_sirinx_deploy_lane.py`
- Runtime JSON:
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/web_sirinx_deploy_lane.json`
- Runtime Markdown:
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/web_sirinx_deploy_lane.md`
- Mission Control fixture:
  `apps/mission-control/src/fixtures/webSirinxDeployStatus.json`
- Pending deploy packet:
  `docs/a2async/WEB_SIRINX_CLOUDFLARE_DEPLOY_PACKET.md`
- Mission Control panel: `Web Deploy`

## Current Local Snapshot

The latest manifest found:

- `239` changed files under `apps/web-sirinx/dist/public`
- `7` source/package/server files in the web-sirinx lane
- `0` missing generated asset references in scanned HTML
- deploy remains broker-blocked

## Broker Classification

| Action                          | Decision                  |
| ------------------------------- | ------------------------- |
| `web_sirinx_dist_manifest`      | `auto_allow_dry_run`      |
| `web_sirinx_static_asset_check` | `auto_allow_dry_run`      |
| `web_sirinx_build_validation`   | `requires_executor_lease` |
| `simulate_deploy_plan`          | `auto_allow_dry_run`      |
| `web_sirinx_pages_deploy`       | `blocked_first_phase`     |
| `deploy`                        | `blocked_first_phase`     |
| `production_deploy`             | `blocked`                 |
| `push`                          | `blocked_first_phase`     |

## Safe Sequence

1. Review the Mission Control `Web Deploy` panel.
2. Run web-sirinx check/test/build in a dedicated clean lane.
3. Re-run the deploy lane manifest.
4. Stage only matching source and generated dist assets.
5. Create a separate deploy packet with Cloudflare target, rollback path, and
   health checks.
6. Deploy only after the deploy lane is explicitly opened and validated.

## Boundaries

- Do not use `git add .`.
- Do not deploy with stale or mixed generated assets.
- Do not call Wrangler from this report lane.
- Do not read Cloudflare tokens or `.env` values.
- Do not hide generated asset churn inside unrelated commits.
- Do not mark production ready until live target, rollback, and health evidence
  exist.
