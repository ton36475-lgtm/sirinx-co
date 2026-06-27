# web-sirinx Cloudflare Deploy Packet

Status: pending deploy lane, no execution.

This packet turns the pending `web-sirinx` Cloudflare Pages deploy into a
broker-visible lane. It does not run `wrangler`, stage files, push, deploy, read
Cloudflare credentials, or call provider APIs.

## Lane

- Lane ID: `LANE_WEB_SIRINX_CLOUDFLARE_PAGES_DEPLOY`
- Pages project: `sirinx-co`
- Dist path:
  `/Users/sirinx/SIRINXDev/sirinx-agent-native-os/apps/web-sirinx/dist/public`
- Runtime JSON:
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/web_sirinx_deploy_packet.json`
- Runtime Markdown:
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/web_sirinx_deploy_packet.md`
- Mission Control fixture:
  `apps/mission-control/src/fixtures/webSirinxDeployPacketStatus.json`
- Generator:
  `scripts/a2a/a2a_web_sirinx_deploy_packet.py`

## Required Evidence Before Deploy

The deploy lane remains pending until these are present:

1. `pnpm --filter @sirinx/web-sirinx check` passed.
2. `pnpm --filter @sirinx/web-sirinx test` passed.
3. `pnpm --filter @sirinx/web-sirinx build` passed.
4. Generated asset manifest reports zero missing references.
5. Cloudflare target is verified without printing secrets.
6. Rollback reference or previous deployment evidence is available.
7. Post-deploy healthcheck plan is written.
8. Scoped staging file list contains only the intended web-sirinx source and
   generated assets.

## Command Classification

| Command                                                                      | Broker route                      |
| ---------------------------------------------------------------------------- | --------------------------------- |
| `pnpm --filter @sirinx/web-sirinx check`                                     | `requires_executor_lease`         |
| `pnpm --filter @sirinx/web-sirinx test`                                      | `auto_allow_dry_run`              |
| `pnpm --filter @sirinx/web-sirinx build`                                     | `requires_executor_lease`         |
| `python3 scripts/a2a/a2a_web_sirinx_deploy_lane.py`                          | `auto_allow_dry_run`              |
| `python3 scripts/a2a/a2a_web_sirinx_deploy_packet.py`                        | `auto_allow_dry_run`              |
| `wrangler pages deploy apps/web-sirinx/dist/public --project-name sirinx-co` | blocked pending final deploy gate |

## Boundary

- No `git add .`.
- No staging by this packet.
- No push.
- No Cloudflare deploy.
- No Cloudflare secret read.
- No provider call.
- No public endpoint change.
- Final deploy remains a separate manual/review lane after validation evidence.
