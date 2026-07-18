# SIRINX Rust Monorepo Migration Plan

Target: consolidate the SIRINX ecosystem (16 GitHub repos) into `ton36475-lgtm/sirinx-co`
with a Rust core, serving `www.sirinx.co`.

Status: **Phase R1 landed** (this branch). Governance rules from `AGENTS.md`,
`REPO_AUDIT_AND_MERGE_MAP.md`, and `MIGRATION_SEQUENCE.md` continue to apply:
one import per PR, quarantine review first, no deploy/DNS/secret mutation
without human approval.

## Workspace Layout

```text
sirinx-co/
├── Cargo.toml                  # cargo workspace (this plan's root)
├── crates/
│   ├── sirinx-core/            # domain types: leads, consent, packages, analytics
│   ├── sirinx-roi/             # ROI pre-screen calculator (1:1 port of landing JS)
│   ├── sirinx-agents/          # 47 Ronin framework: layers, budgets, dispatcher
│   ├── sirinx-autoloop/        # autonomous loop + tool automation + approval gates
│   └── sirinx-web/             # axum service for www.sirinx.co (pages + REST API)
├── apps/public-web/            # existing React/Vite client (kept during transition)
└── services/                   # existing Node services (migrated per phase below)
```

## Phase R1 — Rust foundation (this branch)

- Cargo workspace with five crates, all unit/integration tested.
- `sirinx-web` serves `/`, `/thaimart-sirinx` (taste-governed v2 landing),
  `/health`, and the REST lead API from the Thaimart spec:
  `GET /api/packages`, `POST /api/roi`, `POST /api/leads`,
  `PATCH /api/leads/:id/status`, `DELETE /api/leads/:id`, `POST /api/events`.
- Consent-gated analytics (allowlisted events only — white-hat SEO guard).
- 47 Ronin layer rules enforced in code: L1→L2→L3→L4 only, token budgets per layer.
- Autonomous loop with hard step budgets and DryRun-by-default approval gates.

## Phase R2 — Persistence (landed)

- `sirinx-store` crate: `Store` trait with `MemoryStore` (default) and
  `PostgresStore` (sqlx, embedded migrations under
  `crates/sirinx-store/migrations/`).
- `sirinx-web` handlers talk only to the trait; `DATABASE_URL` selects
  the backend at startup, empty/unset falls back to in-memory.
- Supabase project `SIRINX` (`frmpnjxynvpdsnoaqtnz`) carries the schema:
  `public.web_leads` and `public.web_analytics_events`, RLS enabled with
  no public policies (server-only access; PostgREST/anon cannot read).
- Status transitions run transactionally (`select ... for update`).
- Postgres integration test is env-gated on `TEST_DATABASE_URL`.

Still open for R2 parity: importing the remaining routes from
`automation-system-backend` and `sirinx` (api-gateway) into `sirinx-web`.

## Phase R3 — Agent runtime (control plane landed)

| Source repo | What moves | Rust target | Status |
| --- | --- | --- | --- |
| `sirinx-os` | Hermes dashboard + control API | imported as `apps/dev-dashboard` + `services/dev-control-api`; core gates ported to `crates/sirinx-control` (same port 8711, hold-by-default, ticket-gated opening) | landed |
| `sirinx-solar-energy` (`src/agents/`) | 47 Ronin TypeScript agents | `sirinx-agents` implementations per layer | open |
| `sirinx-godmode` | orchestration presets | `sirinx-autoloop` planners | open |
| `ghost-claw-os` | ops agents | `sirinx-autoloop` tools | open |

## Phase R4 — Web consolidation

| Source repo | What moves | Rust target |
| --- | --- | --- |
| `apps/public-web` (from `sirinx`) | public site | stays React; served/edge-deployed alongside `sirinx-web` API |
| `automated-marketing-agency` | funnel pages + api-marketing | `sirinx-web` routes + `sirinx-core` |
| `chokma-growth-os` | growth app | `apps/` module; API into `sirinx-web` |
| `automation-dashboard` | Next dashboard | reads `sirinx-web` API |

## Phase R5 — Mobile, docs, long tail

| Source repo | Disposition |
| --- | --- |
| `automation-mobile-app`, `oz_mobile_app` | stay Expo/React Native; point at `sirinx-web` API |
| `automation-documentation` | `docs/legacy/automation` |
| `codexskills` | `prompts/` + skill registry |
| `oz-corp-omega-dual-node` | selective infra/scripts import only (Very High risk class) |
| `sirinx-solar-energy` (web app) | superseded by `apps/public-web` + `sirinx-web` |

## Commands

```bash
cargo build --workspace
cargo test  --workspace
cargo run -p sirinx-web        # serves on PORT (default 8080)
```

Or via npm scripts: `npm run rust:build`, `npm run rust:test`.

## Rules carried into code

1. ห้ามข้ามชั้น agent — enforced by `sirinx_agents::Dispatcher::check_route`.
2. Side effects require approval — `sirinx_autoloop::ApprovalGate` (DryRun default).
3. Consent-safe analytics only — `sirinx_core::AnalyticsEvent::is_accepted`.
4. Brand-safe Thaimart copy — asserted by `sirinx-web/tests/api.rs`
   (`one H1`, `SIRINX on Thaimart Marketplace`, no formal partner claim).
5. Human ตัดสินใจสุดท้าย — no deploy from this workspace; release gates in
   `RELEASE_GATE.md` still apply.
