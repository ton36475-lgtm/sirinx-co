# Mobile Command Center Schema

Status: draft.

Mobile is an approval and command surface. It must not have raw worker filesystem access.

## Command Envelope

```json
{
  "id": "cmd_01",
  "requestedBy": "mobile",
  "target": "mac-control-plane",
  "action": "preview_deploy_public_site",
  "riskClass": "C4",
  "requiresApproval": true,
  "dryRunFirst": true,
  "payload": {
    "repo": "sirinx-co",
    "branch": "codex/pr-mono-002-public-site"
  },
  "createdAt": "2026-05-12T00:00:00+07:00"
}
```

## Allowed Mobile Actions

- request status
- approve a queued action
- reject a queued action
- request emergency stop
- request dry-run plan
- view logs, costs, and gate status

## Blocked Mobile Actions

- direct shell
- raw filesystem mirror
- production database write
- Cloudflare mutation without queued approval
- customer message send without a later customer-send gate
- paid API trigger without approval
