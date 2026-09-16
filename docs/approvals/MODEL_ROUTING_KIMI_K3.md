# Model Routing Approval — Kimi K3 (Moonshot)

Status: **TEMPLATE — NOT YET APPROVED.** Provider calls stay blocked
until the operator fills the approval block below. This is the document
the dev-control-api governance requires before any paid provider call
("Create model-routing approval before any OpenRouter provider call").

## Scope requested

| Field | Value |
| --- | --- |
| Provider | Moonshot AI (Anthropic-compatible endpoint) |
| Model | `kimi-k3` (verify exact id with `kimi models list`) |
| Lane | swarm worker `agent:kimi-k3` via Kimi Code CLI |
| Allowed work | queue items from `web_pending_work` only |
| Cost control | operator-provisioned `MOONSHOT_API_KEY`; per-session budget set by operator |
| Still forbidden | all gated actions (deploy/DNS/telegram/customer/adaptive_sync), secrets in repo, non-queue freelance work |

## Approval block (operator fills by hand — an agent must never fill this)

```
APPROVED_BY:
DATE:
TICKET:
MONTHLY_BUDGET_THB:
```

## Revoke

Delete the approval block values or the key from the secret store —
either alone re-locks the lane (fail-closed).
