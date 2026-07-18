# Go-Live Gate Checklist

How each held gate in `sirinx-control` gets opened, what must be true
first, and the exact command. Opening any gate is a human decision made
with a ticket — an agent may prepare everything on this page but never
issues the open command itself.

Open command pattern (from an operator machine):

```bash
curl -X POST http://127.0.0.1:8711/api/gates/<gate>/decision \
  -H "Authorization: Bearer $CONTROL_API_TOKEN" \
  -H "content-type: application/json" \
  -d '{"state":"open","ticket":"<TICKET-ID>"}'
```

Re-hold at any time with `{"state":"hold"}`. Gate state is visible at
`/api/gates` and on `/metrics` (`sirinx_control_gate_open`).

## 1. `deploy` — publish sirinx-web to production

Ready when ALL of:
- [ ] CI green on the merge commit (fmt, clippy, 49 Rust + 120 Node tests)
- [ ] Docker images built from that commit (`DEPLOY_RUST.md`)
- [ ] `DATABASE_URL` + `CONTROL_API_TOKEN` provisioned in the host's
      secret store (never in repo)
- [ ] TCC revoke on mac-mini-m2 completed (`MAC_TCC_PERMISSIONS.md`)
- [ ] Rollback command tested: previous image tag kept warm
- Ticket prefix: `GO-LIVE-DEPLOY-…`

## 2. `cloudflare_dns` — route www.sirinx.co / dev.sirinx.co

Ready when ALL of:
- [ ] `deploy` gate opened and origin healthy (`/health` 200 over tunnel)
- [ ] Tunnel strategy decided (reuse `sirinx-hybrid-tunnel` / revive
      `SIRINX_SWARM` / create `office-brain`) — open item from
      `NEXT_ACTIONS.md`
- [ ] Cloudflare Access policy in front of dev.sirinx.co reviewed
- [ ] DNS rollback values recorded before any change
- Ticket prefix: `GO-LIVE-DNS-…`

## 3. `telegram_send` — real Telegram alerts

Ready when ALL of:
- [ ] Bot token + chat id provisioned outside the repo
- [ ] Dry-run previews reviewed (`npm run telegram:preview`)
- [ ] Message templates approved (no customer data leakage)
- Ticket prefix: `OPS-TG-…`

## 4. `customer_messaging` — Kai drafts go out for real

Ready when ALL of:
- [ ] LINE OA / channel credentials provisioned outside the repo
- [ ] Brand-safety review of templates (no formal partner claims,
      ROI wording keeps the site-survey caveat)
- [ ] PDPA/consent flow verified end-to-end on the landing page
- Ticket prefix: `CX-SEND-…`

## 5. `adaptive_sync` — real AdaptiveSync execution

Ready when ALL of:
- [ ] Windows Drive D mounted on the Mac and visible
- [ ] `npm run sync:plan` dry-run reviewed on the current state
- [ ] Backup of the destination taken
- Ticket prefix: `OPS-SYNC-…`

## Suggested order

`deploy` → `cloudflare_dns` (www first, dev behind Access) →
`telegram_send` → `customer_messaging`; `adaptive_sync` is independent.
