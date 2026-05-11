# Node Heartbeat Schema

Status: draft.

Worker and control nodes should report bounded state, not secrets.

## Heartbeat Payload

```json
{
  "nodeId": "mac-mini-control-plane",
  "nodeType": "control-plane",
  "hostname": "MacminiSirinx",
  "status": "healthy",
  "capabilities": ["dashboard", "release-gates", "office-api"],
  "blockedCapabilities": ["cloudflare-write", "production-db-write"],
  "currentJobs": [],
  "queueDepth": 0,
  "lastCheckedAt": "2026-05-12T00:00:00+07:00",
  "version": "pr-mono-001"
}
```

## Required Fields

- `nodeId`
- `nodeType`
- `status`
- `capabilities`
- `blockedCapabilities`
- `lastCheckedAt`
- `version`

## Forbidden Fields

- tokens
- passwords
- cookies
- raw `.env` values
- personal data
- private chat logs
- source file contents
