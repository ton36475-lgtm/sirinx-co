# P092 Agentloop A2A2A Sync FRD

## Functional Requirements

1. Mirror the P092 command-center approval and packet metadata into local docs.
2. Add a LINE webhook dry-run endpoint at `/api/line/webhook`.
3. Add a LINE webhook health endpoint at `/api/line/webhook/health`.
4. Register the LINE webhook route before `express.json()` so the raw request body can be used for signature verification.
5. Verify LINE signatures using HMAC SHA-256 and `x-line-signature` when a channel secret is configured.
6. Return dry-run JSON responses only; never send LINE replies from this packet.
7. Downgrade requested live mode to dry-run unless `SIRINX_LINE_AUTO_REPLY_APPROVED=true`.
8. Add a repo-level verifier script that checks packet, docs, webhook registration order, safety locks, and receipt presence.
9. Keep all external communication scripts unexecuted.

## Non-Functional Requirements

- No secret values in repo docs, scripts, logs, or receipts.
- No package install.
- No push or deploy.
- No Cloudflare or production database mutation.
- Tests and verifiers must be runnable locally from the current repo.
- Failure messages must be explicit enough for a human reviewer to identify the gate that failed.

## Acceptance Criteria

- `npm run verify:p092-agentloop` passes.
- `apps/public-web/server/_core/lineWebhook.test.ts` passes when app tests are available.
- `git diff --check` passes for files touched in this packet.
- Receipt states dry-run mode, no live send, no external write, and next safe action.
