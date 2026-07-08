# P092 Telegram Command Center Approval

Date: 2026-07-08

Status: approved for local automation loop intake with hard governance gates.

## Approved Scope

- A2A2A job task sync.
- `ai-auto-work` workflow layer planning.
- OpenCode/Claude executor lane, local only.
- Codex reviewer lane, local only.
- Build/test/review/fix/receipt loop.
- SIRINX LINE OA webhook integration validation.
- Project knowledge sync into shared architecture and runbook files.
- One gated LINE live-send test only after deploy evidence, signature verification, and explicit test-user approval.

## Not Approved

- Secret read or secret printing.
- Uncontrolled LINE broadcast.
- LINE MCP production auto-send.
- Cloudflare, DNS, R2, D1, KV, Pages, Workers, or Access mutation unless separately scoped.
- Force push or destructive git operation.
- Marking production live without deploy evidence.

## Required Locks

```text
SIRINX_LINE_MODE=dry-run
SIRINX_LINE_AUTO_REPLY_APPROVED=false
```

## Commandhermes Loop Order

1. Resolve the real repository root.
2. Sync latest safe state.
3. Verify environment presence without printing values.
4. Apply LINE webhook overlay.
5. Register LINE webhook route before `express.json()`.
6. Run unit, smoke, and build gates available in the repo.
7. Run synthetic webhook dry-run.
8. Run local review in approval-mode `never`.
9. Fix Critical/High local findings.
10. Rerun gates.
11. Write receipt.
12. Pause before production-live label until evidence exists.

## Safety Note

This approval is not approve-all. Push, deploy, webhook activation, production analytics, CRM/customer data storage, provider calls, customer messages, and live broadcasts require separate explicit gates.
