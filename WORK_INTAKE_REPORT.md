# Work Intake Report — System-wide Sweep

Date: 2026-07-18
Scope: all agents + Hermes Command Center + repo governance docs.

## 1. Agent task queues (Supabase project SIRINX)

| Source | Result |
| --- | --- |
| `agent_tasks` | 55 tasks, **all completed** — no pending agent work |
| `web_leads` / `web_analytics_events` | empty, ready for production traffic |

## 2. Hermes Command Center — imported

Copied from `sirinx-os` into the monorepo (no `.env`/keys came along):

- `apps/dev-dashboard/` — Hermes Developer Command Center frontend (port 8710)
- `services/dev-control-api/` — Node control API, 40+ routes (port 8711)

## 3. Rust control plane — `crates/sirinx-control`

The safety-critical core of the control API now has a Rust drop-in
(same port 8711, `CONTROL_PORT` to override):

- `GET /health`, `GET /api/gates`, `POST /api/gates/:name/decision`
  (opening requires a ticket), `GET|POST /api/pending-work`,
  `POST /api/actions` (dry-run whenever the gate is on hold)
- Gates ship on **hold**: `deploy`, `cloudflare_dns`, `telegram_send`,
  `customer_messaging`, `adaptive_sync` — matching `NEXT_ACTIONS.md`
  "Do Not Do Yet" and `RELEASE_GATE.md`.

The Node service remains the implementation for the long-tail routes
(brain, swarm, image-edit, RAG, …) until they are ported crate-by-crate.

## 4. Outstanding human decisions (unchanged, still blocked on operator)

From `NEXT_ACTIONS.md` / `PROJECT_STATE.md`:

1. Review draft PR #1 (`sirinx-co`).
2. Cloudflare tunnel route strategy decision.
3. Windows Drive D mount before AdaptiveSync execution.
4. Telegram bot token/chat id provisioning outside the repo.
5. TCC Full Disk Access on mac-mini-m2 is a **temporary grant** — revoke
   after the build window (see `MAC_TCC_PERMISSIONS.md`, marked pending).
