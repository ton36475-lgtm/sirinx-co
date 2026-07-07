# Mac Control Plane

Status: planned.

The Mac mini M2 is the local control plane for SIRINX OS. It coordinates developer command surfaces, local-first services, release gates, and Cloudflare Tunnel once approved.

## Planned Responsibilities

- Run `dev.sirinx.co` private Mission Control through Cloudflare Access.
- Host dev dashboard and dev-control-api locally.
- Run or coordinate n8n, LiteLLM, Ollama small model lane, Redis, MySQL primary, and approval queue after gated setup.
- Own release gates, kill switches, audit logs, and no-skip checks.
- Keep secrets server-side only and outside Git.

## Local Services

| Service | Local target | Public route policy |
| --- | --- | --- |
| Dev dashboard | `http://127.0.0.1:5177` | Cloudflare Access only |
| Office API | `http://127.0.0.1:8790` | Access plus token |
| thClaws serve | `http://127.0.0.1:8443` | Access only, no public bind |
| Hermes UI | `http://127.0.0.1:3000` | Access only |
| Hermes API | `http://127.0.0.1:8642` | Access plus app auth |
| RabbitMQ management | `http://127.0.0.1:15672` | Access only |

## Guardrails

- No direct public ports.
- No secrets in repo.
- No Cloudflare mutation until Cloudflare Gate approval.
- No production database writes during PR-MONO-001.
- No customer messaging from this node until a later approved phase.

## Handoff Checklist

1. Confirm local dashboard health.
2. Confirm `cloudflared` installed and not yet mutating DNS.
3. Confirm token-gated APIs return `401` without token.
4. Confirm `dev.sirinx.co` remains protected or NXDOMAIN until Access is configured.
5. Confirm logs do not print secrets.
