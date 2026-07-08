# P092 Agentloop A2A2A Sync Runbook

## Mode

Local only. Dry-run only. No push, deploy, external sends, provider calls, production webhook activation, production analytics, or CRM/customer storage.

## Required Locks

```text
SIRINX_LINE_MODE=dry-run
SIRINX_LINE_AUTO_REPLY_APPROVED=false
```

## Safe Local Flow

1. Confirm repository root is `/Users/sirinx/SIRINXDev/sirinx-agent-native-os`.
2. Review `docs/command-center/P092_TELEGRAM_COMMAND_CENTER_APPROVAL_20260708.md`.
3. Review `docs/packets/packet_092_full_automation_agentloop_a2a2a_sync.json`.
4. Confirm `apps/public-web/server/_core/index.ts` registers `registerLineWebhookRoutes(app)` before `express.json()`.
5. Run `npm run verify:p092-agentloop`.
6. Run focused app tests when dependencies are available.
7. Write or update `docs/receipts/SIRINX_LINE_OA_GATE_P092_AUTO_LOOP_SYNC_20260708.md`.
8. Stop before any production-live label.

## Escalation Gates

- Push requires exact push approval.
- Deploy requires exact deploy command approval.
- LINE live test requires deploy evidence, signature verification evidence, test-user target, and exact approval.
- Broadcast requires exact payload, audience, time window, and final approval.
- CRM/customer data storage requires data contract, retention policy, and explicit approval.

## Rollback

- Remove `registerLineWebhookRoutes(app)` import and call.
- Remove `apps/public-web/server/_core/lineWebhook.ts`.
- Remove `apps/public-web/server/_core/lineWebhook.test.ts`.
- Remove `verify:p092-agentloop` script and verifier file.
- Leave docs as historical evidence unless the operator requests documentation cleanup.
