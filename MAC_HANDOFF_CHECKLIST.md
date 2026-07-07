# Mac Handoff Checklist

Status: local operations checklist.

## Before Running The Control Plane

- Confirm current repo branch.
- Run `npm run check`.
- Confirm no real `.env` files are staged.
- Confirm no Cloudflare or GitHub write command is queued.
- Confirm local dashboard health.

## Before Cloudflare Work

- Human approval recorded.
- Cloudflare login ready.
- Access policy preview reviewed.
- Tunnel ingress has `http_status:404` fallback.
- Private APIs keep token gates.

## Before Public Website Work

- Public site content reviewed.
- No internal route leakage.
- No hardcoded secrets.
- No localhost.
- No claim-risk language.

## Before Worker Node Work

- Worker registration schema reviewed.
- Heartbeat endpoint planned.
- GPU/media jobs dry-run only.
- No real After Effects export without approval.
