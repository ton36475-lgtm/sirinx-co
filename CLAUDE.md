# CLAUDE.md — sirinx-co

Guidance for AI coding assistants (Claude Code and others) working in this repository.

**Read `AGENTS.md` and `agent.md` first — they are the canonical operating protocol for this
repo (autonomy classes, stop boundaries, MillerDev workflow) and this file does not repeat
their rules in full.** This file is the technical/architectural map: what's actually in the
codebase, how to build/test it, and where the sharp edges are.

## What this project is

`sirinx-co` (`ton36475-lgtm/sirinx-co`) is the **canonical consolidation monorepo** for the
SIRINX OS / SIRINX Solar Energy ecosystem. It is being assembled, in small governed PRs, out of
a dozen-plus legacy source repos (marketing sites, a solar-energy platform, mobile apps, a
growth OS, an "omega dual-node" agent system, etc. — see `REPO_AUDIT_AND_MERGE_MAP.md`). The
repo is explicitly **mid-migration and governance-heavy**: most of the ~40 top-level `*.md`
files are planning/status/gate documents rather than user-facing docs, and the working code is
a mix of:

- A **production Rust web/control-plane workspace** (`crates/`) — the most "real" application
  code in the repo: an axum-based public website + lead-intake API, a Hermes control-plane
  service, and the "47 Ronin" agent framework.
- A **Node/pnpm workspace** (`apps/`, `services/`, `packages/`) of mostly **dry-run governance
  scaffolding** — dozens of small `.mjs` modules that simulate/preview actions (Telegram sends,
  GitHub ops, model routing, approval queues, etc.) and hold everything behind explicit
  approval + confirmation env vars, plus one real product app, `apps/public-web`.
- `.claude/skills/` — 49 SIRINX skills (marketing, ops, agent-architecture, infra) consolidated
  here as the canonical copy for every session/sub-agent working on this system.

**Important:** Several top-level status docs (`PROJECT_STATE.md`, `NEXT_ACTIONS.md`) describe
an earlier phase (branch `codex/pr-mono-002-adaptive-sync-telegram`, draft PR #1) and are stale
relative to `git log` — the repo has since merged a full Rust monorepo migration, A2A sync, and
the org-wide skill import (see `git log --oneline`, latest merge "PR #6"). Treat those specific
docs as historical snapshots, not current state; trust the code and `git log` over them.

## Directory structure

```
sirinx-co/
├── AGENTS.md, agent.md          — canonical agent operating protocol (read first)
├── *.md (top level, ~40 files)  — governance/status/topology/runbook docs, e.g.:
│     REPO_AUDIT_AND_MERGE_MAP.md, SECURITY_QUARANTINE_REPORT.md, RELEASE_GATE.md,
│     PROJECT_STATE.md (stale), NEXT_ACTIONS.md (stale), NETWORK_PORT_MAP.md,
│     MONOREPO_TARGET_TREE.md, SKILLS_REGISTRY.md, DEPLOY_RUST.md, RUST_MIGRATION_PLAN.md
├── .claude/
│   ├── agents/                  — 6 Ronin-layer subagent prompts (kai, ronin-l1..l5)
│   └── skills/                  — 49 canonical SIRINX skills (sirinx-*, plus Hermes ops skills)
├── crates/                      — Rust Cargo workspace (the "real" production code)
│   ├── sirinx-core              — domain types: Lead, consent, packages, analytics events
│   ├── sirinx-roi                — solar ROI calculator (ported from Thaimart x SIRINX landing)
│   ├── sirinx-store              — Store trait; MemoryStore + PostgresStore (Supabase) backends
│   ├── sirinx-web                 — axum service: www.sirinx.co (landing pages, ROI, leads API)
│   ├── sirinx-agents              — 47 Ronin layer framework (Layer enum, Dispatcher, Roster)
│   ├── sirinx-autoloop             — autonomous agent loop runner + approval gates
│   ├── sirinx-a2a                   — agent-to-agent sync / OmniRoute capability router
│   └── sirinx-control                — Hermes control-plane service (approval queue, work intake)
├── apps/
│   ├── public-web                — real product: Vite+React client, Express+tRPC server,
│   │                                Drizzle ORM (MySQL), its own AGENTS.md + pnpm-lock.yaml
│   ├── dev-dashboard              — small Node/Express dashboard (`server.mjs`)
│   └── mobile-command             — placeholder for a future mobile app import
├── services/
│   ├── dev-control-api            — plain Node http server exposing ~40 dry-run "*.mjs" gate/
│   │                                status modules (approval queue, audit, GitHub, OpenRouter,
│   │                                Telegram preview, RAG, brain notes, proposals, …)
│   ├── hermes-api                 — Phase 1 dry-run normalizer for a proposed /hermes/inbox
│   │                                command gateway (imported by dev-control-api)
│   └── telegram-command-bot        — dry-run-only Telegram command lane
├── packages/
│   ├── policy-core                — shared policy/decision logic (`@sirinx/policy-core`)
│   ├── types                      — shared TS command schemas
│   └── async-core                 — placeholder (README only, no code yet)
├── infra/                        — Cloudflare / macOS / Windows node configs
├── scripts/                      — root-level governance/verification scripts (`.mjs`, `.sh`)
├── docs/                         — runbooks (adaptive sync, pipeline audit, Telegram, etc.)
├── memory/, exports/, reports/   — generated artifacts, QA evidence, handoff packages
├── Cargo.toml / Cargo.lock       — Rust workspace manifest
├── package.json / package-lock.json — root Node governance scripts (npm, not pnpm, at root)
├── pnpm-workspace.yaml           — declares apps/*, services/*, packages/*, mcp/* as pnpm
│                                    workspace members (mcp/ doesn't exist yet)
├── turbo.json                    — turbo task graph (check/build/test) for the pnpm side
├── Dockerfile                    — multi-stage build for the two Rust binaries ONLY
└── .github/workflows/ci.yml      — the actual CI: Rust job + Node governance job
```

## Tech stack

- **Rust** (workspace, edition 2021, `rust-toolchain.toml` pins `stable` + rustfmt/clippy):
  axum 0.7, tokio, sqlx 0.8 (rustls, Postgres, `runtime-tokio`), tracing, thiserror, uuid, serde.
- **Node governance layer** (root + `services/`, `apps/dev-dashboard`): plain ES modules
  (`.mjs`), no framework — mostly `node:http`, hand-rolled routing, vitest for the few real
  tests. Root package manager is **npm** (`package-lock.json`), even though `pnpm-workspace.yaml`
  and `turbo.json` exist for the workspace side — there is no root `pnpm-lock.yaml`.
- **`apps/public-web`** (the one real frontend app): Vite + React + TypeScript, Tailwind,
  Radix UI, TanStack Query, tRPC (client+server+react-query), Express server, Drizzle ORM
  targeting **MySQL** (`drizzle.config.ts` sets `dialect: "mysql"`), AWS S3 SDK for assets. Has
  its own `pnpm-lock.yaml` and is meant to be run via `corepack pnpm` per its own `AGENTS.md`
  files (`apps/public-web/client/AGENTS.md`, `apps/public-web/server/AGENTS.md`).
- **Docker**: `Dockerfile` builds only `sirinx-web` and `sirinx-control` Rust binaries onto
  `gcr.io/distroless/cc-debian12`; `apps/`, `services/`, `docs/`, `scripts/` etc. are all in
  `.dockerignore` — the Node side is not containerized here.

## Setup / dev / build / test / lint

### Rust workspace (crates/)

```bash
cargo build --workspace
cargo test --workspace
cargo run -p sirinx-web        # serves www.sirinx.co on :8080 (or $PORT)
cargo run -p sirinx-control    # Hermes control plane on 127.0.0.1:8711 (or $CONTROL_PORT)
cargo fmt --all --check        # CI requires clean fmt
cargo clippy --workspace --all-targets -- -D warnings   # CI requires zero clippy warnings
```
Also available as root npm scripts: `npm run rust:build`, `npm run rust:test`, `npm run rust:serve`.

Both `sirinx-web` and `sirinx-control` auto-select persistence: **Postgres (Supabase)** when
`DATABASE_URL` is a non-empty Postgres connection string, otherwise an in-memory store (data
lost on restart, fine for local dev). `sirinx-control`'s `/api/*` routes require
`CONTROL_API_TOKEN` in anything but local dev (unset = unauthenticated, logged as a warning).

### Root Node governance scripts

```bash
npm ci
npm run check            # node --check (syntax) on all governance scripts + runs the two
                          # verify-*.mjs scripts (repo-file/gate presence checks)
npm run control:test      # vitest over services/dev-control-api/src, excluding the
                          # hermes-spec-first-swarm test (needs a local operator .hermes/state.json
                          # that never exists in CI)
npm run verify:mono-001
npm run verify:next-phase
npm run pipeline:audit
npm run sync:plan          # AdaptiveSync dry-run plan (PC-node sync, no real copy)
npm run telegram:preview   # Telegram dry-run preview only
npm run telegram:bot:dry-run
```
`npm run check` will fail if any of the ~25 required top-level governance `.md` files listed in
`scripts/verify-pr-mono-001.mjs` are missing — don't delete/rename those files without updating
that script.

### apps/public-web

```bash
cd apps/public-web
corepack pnpm install
corepack pnpm run dev      # tsx watch server/_core/index.ts
corepack pnpm run check    # tsc --noEmit
corepack pnpm run test     # vitest run
corepack pnpm run build    # vite build + staticSeoBuild + esbuild server bundle
corepack pnpm run db:push  # drizzle-kit generate && migrate (MySQL — needs DATABASE_URL)
```
Also reachable from root as `npm run web:check` / `web:test` / `web:build` (these just shell
out to `pnpm --dir apps/public-web ...`).

### apps/dev-dashboard, services/dev-control-api

```bash
node apps/dev-dashboard/server.mjs             # or: (cd apps/dev-dashboard && npm run dev)
node services/dev-control-api/server.mjs       # or: (cd services/dev-control-api && npm run dev)
```
Each package also has a `verify` script (`node --check` over its own files).

### CI (`.github/workflows/ci.yml`)

Two jobs on push/PR to `main`:
1. **`rust`** — `cargo fmt --all --check`, `cargo clippy --workspace --all-targets -- -D
   warnings`, `cargo test --workspace`.
2. **`node-governance`** — `npm ci`, `npm run check`, `npm run control:test`.

There is currently **no CI job for `apps/public-web`** (its check/test/build scripts exist but
aren't wired into `.github/workflows/ci.yml`) — run them manually before merging changes there.

## Architecture / conventions actually in the code

**Rust side is the source of truth for "real" functionality.**

- **`Store` trait** (`crates/sirinx-store/src/lib.rs`) is the persistence seam: `sirinx-web` and
  `sirinx-control` handlers only ever talk to `dyn Store` (leads, analytics events, pending
  work), never to sqlx directly. Swapping `MemoryStore` ↔ `PostgresStore` is a one-line change
  in each `main.rs`, driven purely by whether `DATABASE_URL` is set.
- **`sirinx-web`** (`crates/sirinx-web/src/lib.rs`) is a small axum router: `GET /`, `GET
  /thaimart-sirinx` (landing pages served from `include_str!`'d static HTML), `GET /health`,
  `GET /metrics`, `GET /api/packages`, `POST /api/roi`, `POST /api/leads`, `PATCH
  /api/leads/:id/status`, `DELETE /api/leads/:id`, `POST /api/events`. Store errors map to HTTP
  status via `store_error_response` (`NotFound`→404, `Validation`→409, `Backend`→500, logged).
- **`sirinx-agents`** implements the "47 Ronin" layer architecture as real, tested Rust: `Layer`
  enum (Perception/Analysis/Decision/Coordination/Research/Chatbot) carries a fixed
  `token_budget()` (4K/8K/16K/32K/128K/16K) and `next_operational()`, and `Dispatcher`
  (`bus.rs`) enforces the **no-layer-skipping rule** — an operational agent may only publish to
  the layer directly above it (L1→L2→L3→L4); L5 publishes advisories any layer can read, and
  Kai (chatbot) only talks to customers. This mirrors the layer table also documented in
  `.claude/agents/*.md` and in the sibling `sirinx-solar-energy` repo's `CLAUDE.md`.
- **`sirinx-control`** is the Hermes control plane: bearer-token-gated `/api/*`, open
  `/health`/`/metrics`, an A2A "self card" built from env (`A2A_NODE_ID`, `A2A_ENDPOINT`,
  `A2A_PRIORITY`) with capabilities auto-loaded from `SKILLS_DIR` (default `.claude/skills`).
  Logs explicitly state intent, e.g. "control queue is process-local" or "all gates on hold".
- **`sirinx-autoloop`** wraps `sirinx-agents` with a governed autonomous loop runner + tool
  automation, gated by an allowlist/approval mechanism (see `RUST_MIGRATION_PLAN.md` for the
  phase history: R1 workspace → R2 store → autoloop → a2a).

**Node side is dry-run-first by design, not incidentally.**

- `services/dev-control-api/src/` is ~40 independently small `.mjs` modules, almost all shaped
  as `get<Thing>Status()` / `create<Thing>DryRun()` pairs (e.g. `gateway-agent.mjs`,
  `openrouter-fusion-router.mjs`, `local-rag.mjs`, `repo-intake-gate.mjs`,
  `team-runtime-bridge.mjs`). `gates.mjs` defines the standing gate list (`dry-run-lock`,
  `approval-required`, `secret-scan`, `public-exposure`) and an `actions` catalogue where every
  entry declares `mode: "dry-run"` and often `requiresApproval: true`. **Do not "complete" these
  into real integrations** without an explicit human ask — that's the entire point of this
  layer per `AGENTS.md`'s stop boundaries.
- `services/hermes-api` is a locked-down Phase 1 normalizer for a future `/hermes/inbox`
  gateway; its real HTTP route today is served through `dev-control-api` (`POST
  /api/hermes-inbox/dry-run`), which imports `hermes-api/src/inbox.mjs` directly rather than
  calling it over the network.
- `.claude/agents/` holds one prompt file per Ronin layer (`ronin-l1-perception-lead.md` …
  `ronin-l5-research-lead.md`, `kai-customer-liaison.md`) meant to be used as Claude Code
  subagents matching the same layer boundaries enforced in `sirinx-agents`.

**`apps/public-web` is conventional product code**, distinct in style from the rest of the repo:
React client (`client/src`) + Express/tRPC server (`server/_core`, `server/routers.ts`) +
Drizzle schema/migrations (`drizzle/schema.ts`, `drizzle/000*.sql`) + shared types
(`shared/`). It carries its own nested `AGENTS.md` files with narrower rules (no raw shell
endpoints, no direct hardware writes, public pages "SIRINX-only" tone, `ops.sirinx.co`
graphite/gold internal styling, no gambling/anime aesthetics) — read those before touching
`client/` or `server/`.

## Environment variables (see `.env.example`; never commit real values)

- `SIRINX_ENV`, `PUBLIC_SITE_CANONICAL_HOST` (`www.sirinx.co`), `PRIVATE_HQ_HOST` (`dev.sirinx.co`)
- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_TUNNEL_NAME`
- `DEV_CONTROL_API_TOKEN` / `CONTROL_API_TOKEN` — bearer token for `sirinx-control` `/api/*`
- `A2A_NODE_ID`, `A2A_ENDPOINT`, `A2A_PRIORITY`, `SKILLS_DIR` — A2A node identity/capabilities
- `NODE_HEARTBEAT_SHARED_SECRET`
- `DATABASE_URL` — **ambiguous across the repo, check which app you're in**: for the Rust
  crates it's a Postgres/Supabase pooler URL; for `apps/public-web`'s Drizzle config it's read
  by a `dialect: "mysql"` setup. These are two different databases despite the shared var name.
- `REDIS_URL`
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_OWNER_IDS`, `TELEGRAM_CHAT_ID`, `TELEGRAM_ALLOWED_COMMANDS`,
  `LINE_CHANNEL_SECRET`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `SIRINX_WINDOWS_D_MOUNT`, `SIRINX_SYNC_CONFIRM` — AdaptiveSync PC-node dry-run gate; real
  execution requires `SIRINX_SYNC_CONFIRM=EXECUTE`
- `SIRINX_TELEGRAM_CONFIRM` — real Telegram sends require this to equal exactly `SEND` **and**
  the command run with `--send`

## Repo-specific gotchas

1. **Governance docs drift.** `PROJECT_STATE.md` and `NEXT_ACTIONS.md` describe an earlier
   phase/branch than what's on `main` today. Cross-check against `git log` before trusting a
   status claim in those files.
2. **Mixed package managers.** Root is npm (`package-lock.json`, no root `pnpm-lock.yaml`)
   despite `pnpm-workspace.yaml`/`turbo.json` existing; `apps/public-web` is pnpm
   (`pnpm-lock.yaml`) and expects `corepack pnpm`, not plain `npm`/`pnpm`.
3. **`DATABASE_URL` means two different databases** depending on whether you're in `crates/`
   (Postgres/Supabase) or `apps/public-web` (MySQL via Drizzle). See above.
4. **`npm run check` enforces a fixed file list** (`scripts/verify-pr-mono-001.mjs`) of ~25
   top-level governance `.md` files that must exist — deleting/renaming one breaks CI.
5. **CI has no job for `apps/public-web`.** Its `check`/`test`/`build` scripts must be run
   manually; they are not part of `.github/workflows/ci.yml`.
6. **`control:test` deliberately excludes** `hermes-spec-first-swarm.test.mjs` in CI because it
   validates a local operator machine's `.hermes/state.json`, which doesn't exist in CI.
7. **Dockerfile only ships the Rust binaries.** `.dockerignore` excludes `apps/`, `services/`,
   `scripts/`, `docs/` — don't expect the Node side to appear in the built image.
8. **Everything defaults to dry-run / hold.** Per `AGENTS.md`/`agent.md`, this repo's entire
   Node governance layer is intentionally simulated. Turning a `dry-run` action into a real one
   (Telegram send, Cloudflare mutation, production DB write, customer messaging, deploy) is a
   "stop and get explicit approval first" action, not a routine code change — this is a hard
   repo convention, not boilerplate caution.
9. **`sirinx-agents`' layer-skip rule is enforced in code**, not just documentation — respect
   `Layer::next_operational()` when adding new agent wiring rather than having e.g. L1 publish
   straight to L4.
