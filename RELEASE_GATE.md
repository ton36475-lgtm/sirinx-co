# Release Gate

Status: PR-MONO-001 baseline.

## Autonomy Classes

| Class | Meaning | Allowed in this run |
| --- | --- | --- |
| C0 | Read-only inspection | yes |
| C1 | Documentation-only update | yes |
| C2 | Safe local code edit | yes |
| C3 | Safe local test/build | yes |
| C4 | Mock or dry-run integration | yes |
| C5 | PR-ready branch work, no push | yes |
| C6 | External action requiring approval | no |
| C7 | Prohibited action | no |

## Gates

| Gate | Name | PR-MONO-001 status |
| ---: | --- | --- |
| 01 | Governance / repo baseline | pass pending commit |
| 02 | Local dev baseline | pass pending check |
| 03 | Dev command center | planned |
| 04 | Agent HQ / automation | planned |
| 05 | QA / DevTools MCP | planned |
| 06 | Security checks | pass for docs scaffold |
| 07 | Cost guard / approval | documented |
| 08 | Staging | blocked |
| 09 | Production approval | blocked |
| 10 | Production runtime | blocked |
| 11 | Growth / ads / content automation | blocked |
| 12 | Brain system | planned |
| 13 | MCP inspector gate | planned |
| 14 | Pre-deploy security | planned |
| 15 | Cloudflare Edge Gate | blocked until approval |
| 16 | AdaptiveSync Drive D Gate | dry-run only |
| 17 | Telegram Command Gate | dry-run only |

## Gate 15: Cloudflare Edge Gate

- Public domain resolves correctly.
- HTTPS active.
- Apex redirects to canonical host.
- Cloudflare Access protects all internal apps.
- No localhost/internal IP leak in public frontend.
- n8n not public without Access.
- Grafana not public without Access.
- LiteLLM admin not public.
- Ollama/vLLM not public.
- MySQL/Redis not public.
- AMQP `5672` not public.
- API routes have rate limits.
- WAF/rate-limit rules exist.
- Tunnel ingress ends with 404 fallback.

## Stop Conditions

Stop immediately before push, deploy, Cloudflare mutation, customer send, paid API, production DB write, or public internal exposure.

## Gate 16: AdaptiveSync Drive D Gate

- Windows `D:` share is mounted on the Mac.
- `SIRINX_WINDOWS_D_MOUNT` points to the approved target.
- `npm run sync:plan` has been reviewed.
- No `.env`, keys, caches, `.git`, or browser data included.
- Execution requires explicit approval and `SIRINX_SYNC_CONFIRM=EXECUTE`.

## Gate 17: Telegram Command Gate

- Bot token is created outside the repo.
- Chat id and owner ids are configured outside the repo.
- `npm run telegram:preview` reviewed.
- Real send requires action-time approval, `--send`, and `SIRINX_TELEGRAM_CONFIRM=SEND`.
- BotFather automation is blocked unless the next exact UI action is approved.
