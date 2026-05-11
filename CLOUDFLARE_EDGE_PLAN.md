# Cloudflare Edge Plan

Status: preview only. No Cloudflare write has been executed.

## Public Site

Canonical public website:

```text
https://www.sirinx.co
```

The apex `https://sirinx.co` should redirect permanently to `https://www.sirinx.co` after approval.

## Private Zone

Private developer systems belong under:

```text
dev.sirinx.co
*.dev.sirinx.co
```

These must be protected by Cloudflare Access before becoming reachable outside localhost.

## Tunnel Preview

Planned tunnel name:

```text
office-brain
```

Planned ingress:

```yaml
tunnel: office-brain
credentials-file: /path/to/cloudflared/office-brain.json

ingress:
  - hostname: dev.sirinx.co
    service: http://127.0.0.1:5177
  - hostname: dashboard.dev.sirinx.co
    service: http://127.0.0.1:5177
  - hostname: office.dev.sirinx.co
    service: http://127.0.0.1:8790
  - hostname: thclaws.dev.sirinx.co
    service: http://127.0.0.1:8443
  - hostname: hermes.dev.sirinx.co
    service: http://127.0.0.1:3000
  - hostname: hermes-api.dev.sirinx.co
    service: http://127.0.0.1:8642
  - hostname: rabbitmq.dev.sirinx.co
    service: http://127.0.0.1:15672
  - hostname: ingest.dev.sirinx.co
    service: http://127.0.0.1:8790
  - service: http_status:404
```

## Write Boundary

Stop for human approval before:

- `cloudflared login`
- creating a tunnel
- routing DNS
- adding Access apps or policies
- deploying Pages
- changing WAF, R2, Workers, or DNS records

## Rollback Plan

- Stop the `office-brain` tunnel.
- Remove DNS routes for `*.dev.sirinx.co`.
- Disable Access app if misconfigured.
- Keep local services bound to `127.0.0.1`.

## Gate 15

See `RELEASE_GATE.md`.
