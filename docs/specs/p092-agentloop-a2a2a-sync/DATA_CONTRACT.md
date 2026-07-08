# P092 Agentloop A2A2A Sync Data Contract

## Packet Contract

Required fields:

- `packet_id`
- `protocol`
- `safe_execution`
- `status`
- `architecture.workflow_layer`
- `architecture.line_production_endpoint`
- `required_locks.SIRINX_LINE_MODE`
- `required_locks.SIRINX_LINE_AUTO_REPLY_APPROVED`
- `expected_receipt`

## LINE Webhook Dry-Run Request

Endpoint: `POST /api/line/webhook`

Headers:

- `content-type: application/json`
- `x-line-signature`: optional in dry-run; required for production approval evidence.

Body shape:

```json
{
  "destination": "string",
  "events": []
}
```

## LINE Webhook Dry-Run Response

```json
{
  "ok": true,
  "provider": "line",
  "mode": "dry-run",
  "requestedMode": "dry-run",
  "autoReplyApproved": false,
  "signature": {
    "status": "verified"
  },
  "payload": {
    "destinationPresent": true,
    "eventCount": 0
  },
  "liveReplySent": false,
  "nextGate": "Live reply requires deploy evidence, signature verification, and explicit test-user approval."
}
```

## Forbidden Data

- Raw secrets.
- Customer LINE user IDs from real customers.
- Browser cookies.
- Production access tokens.
- CRM/customer payloads.
- Payment or billing data.
