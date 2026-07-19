# Model Routing Approval — 47 Ronin Team (GLM-5.2 + Cloudflare Workers AI)

Status: **TEMPLATE — NOT YET APPROVED.** `sonnet5` is the default lane
and needs no approval here (it uses this session's own Anthropic auth).
Any Ronin routed to `glm52` or `cf-workers-ai` stays blocked until the
operator fills the approval block below.

## Scope requested

| Field | Value |
| --- | --- |
| Lane `glm52` | GLM-5.2 via cointh.com Anthropic-compatible proxy; key in `GLM_API_KEY` env, never in repo |
| Lane `cf-workers-ai` | Cloudflare Workers AI; account/token in `CF_ACCOUNT_ID` / `CF_WORKERS_AI_TOKEN` env |
| Allowed work | queue items from `web_pending_work` only, same as every other worker |
| Still forbidden | all gated actions (deploy/DNS/telegram/customer/adaptive_sync), secrets in repo, freelance work outside the queue |

## Security note on the GLM-5.2 shared key

A `glm-share-...` token for this lane was pasted in plaintext during a
chat session on 2026-07-19. **Treat that specific token as exposed —
rotate it at cointh.com before using this lane in anything that
matters.** Never re-paste a live key into chat, a commit, or a skill
file; only `export` it in a shell the operator controls.

## Approval block (operator fills by hand — an agent must never fill this)

```
APPROVED_BY:
DATE:
TICKET:
LANES_APPROVED:      # e.g. glm52, cf-workers-ai
MONTHLY_BUDGET_THB:
```

## Revoke

Clear the approval block or remove the relevant env var — either one
re-locks that lane fail-closed.
