# SIRINX System Schema

License: MIT · Single source of truth for data shapes across the mesh.
Wire format is camelCase JSON; database is snake_case; Rust types in
`sirinx-core` / `sirinx-a2a` are canonical.

## 1. Database (Supabase project `SIRINX`, migrations in `crates/sirinx-store/migrations/`)

### `public.web_leads`

| Column | Type | Constraint |
| --- | --- | --- |
| id | uuid | pk |
| status | text | `new → contacted → qualified → proposal_sent → won\|lost` (enforced in Rust, transactional `select … for update`) |
| business_type | text | snake_case enum |
| monthly_electric_bill | double precision | > 0 |
| available_area_sqm | double precision | > 0 |
| interest | jsonb | array of module tags |
| source | text | non-empty |
| consent | jsonb | `{analytics, marketingContact}` |
| created_at / updated_at | timestamptz | default now() |

### `public.web_analytics_events`

id bigint identity pk · event text (allowlist below) · payload jsonb ·
page text · consent jsonb · created_at timestamptz.
Only stored when `consent.analytics = true` AND event is allowlisted.

### `public.web_pending_work`

id uuid pk · source text · title text · detail jsonb · status text
(default `pending`) · claimed_by/claimed_at · created_at.
Trigger `web_pending_work_notify` → `pg_notify('web_pending_work', id)`.

### `public.web_control_gates`

name text pk · state text (`hold` | `open`) · ticket text nullable ·
updated_at timestamptz. The database requires `ticket is null` on hold
and a non-blank ticket on open. Migration 0003 seeds the five canonical
gates on hold with `on conflict do nothing`, preserving prior decisions.

### `public.web_failure_events`

id uuid pk · run_id uuid · tool_name text (1–128 characters) ·
error_kind text (`bad_args` | `failed` | `unknown`) · attempt integer ·
created_at timestamptz. Failure records contain no invocation arguments and
no raw error-message text.

### `public.web_lessons`

id uuid pk · tool_name text (1–128 characters) · error_kind text ·
guidance_kind text (`validate_arguments` | `retry_transient_failure` |
`verify_tool_availability`) · occurrences bigint · created_at / updated_at.
The unique key `(tool_name, error_kind, guidance_kind)` makes lesson upserts
atomic and increments occurrences instead of duplicating guidance.

All six tables: RLS enabled, zero public policies (server-only).

## 2. Enumerations

- **BusinessType**: `retail_store` `warehouse` `factory` `hotel`
  `showroom` `office` `other`
- **Interest**: `solar_rooftop` `solar_carport` `bess` `ev_charging` `ai_ems`
- **UsageProfile** (factor): `low_daytime` 0.45 · `medium_daytime` 0.62 ·
  `high_daytime` 0.78
- **Analytics allowlist**: `thaimart_partner_view`
  `thaimart_footer_logo_click` `roi_calculator_start`
  `roi_calculator_submit` `line_add_friend_click` `contact_form_submit`
- **Gates**: `deploy` `cloudflare_dns` `telegram_send`
  `customer_messaging` `adaptive_sync` (states `hold` | `open`+ticket)
- **FailureKind**: `bad_args` `failed` `unknown`
- **LessonGuidance**: `validate_arguments` `retry_transient_failure`
  `verify_tool_availability` (closed, non-executable planner guidance)

## 3. HTTP APIs

### sirinx-web :8080 (public)

| Route | Body → Response |
| --- | --- |
| GET `/`, `/thaimart-sirinx` | HTML |
| GET `/health`, `/metrics` | liveness / Prometheus |
| GET `/api/packages` | `{packages:[{slug,nameTh,nameEn,summaryTh}]}` |
| POST `/api/roi` | `{monthlyBillThb,availableAreaSqm,usage}` → `{estimate:{estimatedKw,savingLowThb,savingHighThb},notice}` |
| POST `/api/leads` | LeadDraft → 201 Lead (422 invalid) |
| PATCH `/api/leads/:id/status` | `{status}` → Lead (404 / 409 illegal transition) |
| DELETE `/api/leads/:id` | 204 / 404 |
| POST `/api/events` | AnalyticsEvent → 202 stored / 200 ignored |

### sirinx-control :8711 (operators; Bearer on `/api/*`)

| Route | Body → Response |
| --- | --- |
| GET `/health`, `/metrics` | open liveness / metrics |
| GET `/ready` | redacted operational readiness; 200 only with auth + refreshed durable Postgres authority |
| GET `/api/gates` | `{gates:[{name,state,ticket}],persistence:{backend,durable,observedAt}}` |
| POST `/api/gates/:name/decision` | `{state,ticket}` → Gate (422 open w/o ticket) |
| GET/POST `/api/pending-work` | queue list / `{source,title,detail}` → 201 |
| POST `/api/actions` | `{gate,action,args}` → executed or dry-run plan |
| GET `/api/a2a/card` | this node's AgentCard |
| POST `/api/a2a/sync` | SyncRequest → SyncResponse |
| POST `/api/a2a/route` | `{capabilities:[…]}` → AgentCard / 404 |

### dev-control-api Node long-tail :8790 (local; live A2A Bearer + idempotency)

| Route | Body → Response |
| --- | --- |
| GET `/api/a2a-sync` | redacted readiness and 15 unique static-agent registrations |
| POST `/api/a2a-sync/plan` | A2A plan; `dryRun:false` requires Bearer + `Idempotency-Key` |
| GET `/api/centerbrain-hub` | CenterBrain status; live flags mirror fresh durable A2A evidence |
| GET `/api/omniroute?probeHermes=true` | optional read-only loopback Hermes evidence; app/CLI presence stays distinct from handshake identity |
| POST `/api/omniroute/handshake` | evidence report only; never activates or sends |
| POST `/api/omniroute/activate` | local activation preview; always `activated:false` |

### telegram-command-bot :8791 (local; fixed destination)

| Route | Body → Response |
| --- | --- |
| GET `/health`, `/status` | redacted env + durable-gate readiness |
| POST `/send` | `{text,dryRun,parseMode?}`; live requires Bearer + `Idempotency-Key` |
| POST `/webhook` | inbound dry-run inspection only; no command/provider execution |

## 4. A2A protocol types (`sirinx-a2a`)

```jsonc
// AgentCard
{ "id": "mac-mini-m2", "name": "Mac mini M2",
  "capabilities": ["gates", "pending-work", "skill:start-run-debug"],
  "endpoint": "http://192.168.50.20:8711", "priority": 1 }

// SyncRequest → SyncResponse
{ "node": AgentCard, "knownWorkIds": [uuid] }
{ "node": AgentCard, "missingWork": [PendingWork], "peerAgents": [AgentCard] }
```

Routing rule: candidate must hold every required capability; ties break
by fewest surplus capabilities (specialist wins), then priority desc,
then id asc — fully deterministic.

## 4b. Brain @ Edge (Cloudflare D1 `sirinx-unified-db`, region APAC)

Schema: `infra/cloudflare/brain-sync-worker/schema.sql` (applied live).

- `brain_notes` — id uuid pk · path unique · title · content · tags json ·
  source (`obsidian`/`hermes`/`agent:*`) · content_hash · updated_at ·
  deleted tombstone · `meta` json (Hermes brain.mjs extras: summary,
  headings, links, tasks{open,done,total}, obsidianUrl)
- `brain_notes_fts` — FTS5 (title, content), maintained on upsert
- `brain_sync_log` — node_id, pushed, pulled, synced_at
- `a2a_agent_cards` — edge replica of the OmniRoute card registry

Worker API (`sirinx-brain-sync`, Bearer `BRAIN_SYNC_TOKEN` on `/api/*`):
`GET /health` · `POST /api/brain/sync` `{node, since, notes[]}` →
`{node, changed[], peerAgents[], pushed}` (last-write-wins by
updatedAt) · `GET /api/brain/search?q=` · `GET /api/brain/notes?path=`.

Postman: collection **SIRINX Platform API** (`e6b5fcae-c224-48fb-92e4-ed6e0626076d`)
covers web + control + a2a + brain surfaces with variables.

## 5. Environment contract

| Var | Service | Effect |
| --- | --- | --- |
| DATABASE_URL | web, control | Postgres backend + migrations; empty ⇒ in-memory (gate decisions are process-local) |
| CONTROL_API_TOKEN | control | bearer auth on `/api/*` |
| SIRINX_CONTROL_URL | Telegram, Node A2A | Rust gate authority; loopback HTTP only |
| TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID | Telegram | provider credential + fixed destination |
| TELEGRAM_OWNER_IDS | Telegram | inbound owner allowlist |
| SIRINX_TELEGRAM_CONFIRM | Telegram | must equal `SEND` for live readiness |
| A2A_NODE_ID / A2A_ENDPOINT / A2A_PRIORITY | control | node identity |
| SKILLS_DIR | control | capability autoload (default `.claude/skills`) |
| PORT / CONTROL_PORT | web / Rust control | listen ports (8080 / 8711) |
| DEV_CONTROL_API_PORT / TELEGRAM_BOT_PORT | Node long-tail / Telegram | local listeners (8790 / 8791) |
