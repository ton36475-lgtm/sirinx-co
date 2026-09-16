# B3 Route Inventory Diff — `automation-system-backend` → `sirinx-web`

Per the 2026-07-20 L3 (Kihei) recommendation: added to this session as
a read-only source, inventoried, one route ported. This is a partial
cut of B3 — `sirinx` (api-gateway) is still unported, and most of
`automation-system-backend`'s own surface does not map onto SIRINX's
domain (see below).

## What `automation-system-backend` actually exposes

| Service file | Routes | Domain |
| --- | --- | --- |
| `backend/api-gateway.js` | `/api/v1/auth/*`, `/api/v1/workflows/*`, `/api/v1/executions/*`, `/api/v1/dashboards/*`, `/api/v1/integrations/*` | generic workflow-automation SaaS (auth, workflows, executions, dashboards) |
| `backend/automation-service.js` | `/workflows`, `/workflows/:id`, `/workflows/:id/execute`, `/executions`, `/executions/:id` | same workflow/execution domain |
| `backend/analytics-service.js` | `/events` (POST+GET), `/summary`, `/trends`, `/query`, `/metrics` | generic event analytics — **the only domain that overlaps with `sirinx-web`** |
| `backend/codex-integration-service.js` | `/generate-code`, `/complete-code`, `/generate-tests`, `/generate-documentation`, `/review-code`, `/suggest-refactoring`, `/query`, `/usage/:user_id` | AI coding-assistant proxy — unrelated to the lead/ROI funnel |
| `backend/github-integration-service.js` | `/oauth/authorize`, `/webhook`, `/repositories/:user_id` | GitHub OAuth/webhook integration — unrelated |

**Honest finding:** most of this repo is a *different product* (a
generic workflow-automation platform with its own auth/workflow/
execution/GitHub-integration domain) — not a SIRINX-specific backend
whose routes map cleanly onto `sirinx-web`'s lead/ROI funnel. Porting
`workflows`/`executions`/`dashboards` wholesale would import an
unrelated domain model into `sirinx-web`, which is exactly the kind of
scope creep this project avoids (see `MASTER_PLAN.md`'s "no half-finished
implementations" convention). Treat B3's remaining scope for this repo
as **narrower than the original title implies** — see "Remaining gap"
below.

## What was ported

| Source | Target | Status |
| --- | --- | --- |
| `analytics-service.js` `GET /events` | `sirinx-web` `GET /api/events` | **done** — `EventSummary` read model, `Store::list_recent_events`, tested |

Deliberately simplified vs. the source: no `start_time`/`end_time`
filters, no `user_id` filter (SIRINX events don't carry a `user_id`),
response is `{id, event, page, createdAt}` only (no `payload`/`consent`
— this is a recent-activity list, not a full export). `?limit=` is
supported, default 50, capped at 200.

## Remaining gap (what B3 still means after this cut)

- `analytics-service.js` `/summary`, `/trends`, `/query` — these
  aggregate over `workflows`/`workflow_executions` tables that don't
  exist in the SIRINX schema. Not portable without first deciding
  whether SIRINX actually needs a workflow/execution domain at all —
  that's a product decision, not a routing one. Left unclaimed.
- `api-gateway.js` / `automation-service.js` / `codex-integration-service.js`
  / `github-integration-service.js` — entirely different domain
  (generic SaaS auth+workflows, AI codegen proxy, GitHub OAuth). Not
  recommended for porting into `sirinx-web` at all; if any of this
  capability is genuinely needed, it belongs in a new crate/service,
  not folded into the lead/ROI funnel.
- `sirinx` (api-gateway repo) — not yet added to this session; still
  fully unassessed.
