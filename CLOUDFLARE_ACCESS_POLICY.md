# Cloudflare Access Policy

Status: preview only.

## Goal

Protect `dev.sirinx.co` and `*.dev.sirinx.co` so internal dashboards, APIs, and tools are never exposed as raw public services.

## Policy Preview

| Field | Value |
| --- | --- |
| Application | SIRINX OS Private HQ |
| Hostnames | `dev.sirinx.co`, `*.dev.sirinx.co` |
| Identity provider | Google |
| Allowed domain | `sirinx.co` |
| Session duration | short-lived, reviewed later |
| API second gate | Office Link token where applicable |

## Required Checks Before Write

- Cloudflare account authenticated.
- `sirinx.co` zone ownership confirmed.
- Local dashboard returns `200`.
- Office API returns `401` without token.
- Tunnel ingress validates.
- Catch-all route returns `404`.
- RabbitMQ AMQP `5672` is not routed.

## Forbidden

- Public anonymous access.
- Bypassing Office Link token for API routes.
- Exposing MySQL, Redis, AMQP, Ollama, vLLM, Dify admin, LiteLLM admin, n8n, Grafana, or MCP servers without Access and a later service-specific gate.
