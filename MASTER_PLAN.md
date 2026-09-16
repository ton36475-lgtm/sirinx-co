# SIRINX MASTER PLAN — แผนงานหลักเดียวของระบบ

The one canonical plan. Every other plan document is an appendix of
this file (see the doc map in `.claude/skills/sirinx-master-plan/`).
Update the status column here in the same commit as the work.

Goal spec: **one Rust monorepo powering www.sirinx.co, operated by an
autonomous-but-gated 47 Ronin agent mesh across Mac/PC/cloud nodes,
with knowledge, work, and routing shared through one backbone.**

## A. DONE (merged to main or on the working branch)

| # | Deliverable | Proof |
| --- | --- | --- |
| A1 | Cargo workspace, 8 crates (core/roi/agents/autoloop/store/a2a/web/control) | 61 Rust tests |
| A2 | Thaimart landing + lead/ROI API, brand-safe guards | `sirinx-web` tests |
| A3 | Supabase persistence: web_leads / web_analytics_events / web_pending_work (+pg_notify), RLS | migrations 0001-0002, live |
| A4 | Hermes Command Center imported + 120 Node tests green from root | `apps/dev-dashboard`, `services/dev-control-api` |
| A5 | Release gates hold-by-default + ticket opening + bearer auth + /metrics | `sirinx-control` |
| A6 | A2A mesh + OmniRoute, capabilities from 50 skills | `sirinx-a2a`, live smoke |
| A7 | Brain @ Edge: D1 schema live (APAC) + brain-sync worker written | `infra/cloudflare/brain-sync-worker` |
| A8 | CI workflow + governance phase advance; Docker deploy path (gated) | `.github/workflows/ci.yml`, `Dockerfile` |
| A9 | Agent team scaffolding: **6 department-head sub-agents** (L1–L5 + Kai) + 50 skills consolidated + MIT license. The 47-slot roster exists as runtime schema/plan — only 4 Ronin have production code so far (see A10); expansion tracked as B4 | `.claude/agents/` (6 files), audit 2026-07-19 |
| A10 | **Ronin lead pipeline live** (4 coded agents: Kuranosuke/Jūnai/Kihei/Gengo): lead POST → L1→L2 ROI scoring→L3 decision→L4 auto-enqueues follow-up work | `sirinx-agents::ronin`, web test |
| A11 | Postman collection "SIRINX Platform API" (all 4 surfaces) | collection `e6b5fcae…` |
| A12 | PR #6 merged to main | GitHub |
| A13 | **B1 done** — durable gates: `web_control_gates` (migration 0003, applied live), decisions persist-first, `ControlState::load` overlays store state | `gate_decisions_survive_restart` test |
| A14 | **B2 done** — self-learning loop: `web_failure_events` + `web_lessons` (live), `RecoveryLoop` records failures, consults lessons for bounded guided retries, proposes new lessons from unknown failures | 4 recovery tests incl. cross-run learning |
| A15 | **B9 done** — Telegram commander center reads live gate state via `gate-status.mjs` (`GET /api/gates`, bearer auth), fails closed (assumes hold) on any unreachable/error case instead of hardcoding a string | `gate-status.test.mjs` (7 tests) |
| A16 | Model routing skill for the 47 Ronin mesh: `sonnet5` (default) / `glm52` (cointh.com proxy) / `cf-workers-ai` lanes, wired via existing `AgentCard`/OmniRoute capability tags — no new dispatcher, no key ever written to repo, non-default lanes gated on operator-signed approval doc; failover order documented (sonnet5 → opus-4-8 hard-coding → fable-5 QA/reset → approved-only glm52/cf-workers-ai) | `.claude/skills/ronin-model-routing/SKILL.md`, `docs/approvals/MODEL_ROUTING_RONIN_TEAM.md` |
| A17 | **B12 done** — shared work queue records real completion timestamps: `web_pending_work` migration 0004 (`completed_at`/`completed_by`), `Store::complete_pending_work` (server clock, not caller-supplied), `POST /api/pending-work/:id/complete`, completed items drop off the live queue in both backends | 2 `sirinx-store` tests + 2 `sirinx-control` route tests |
| A18 | Cloudflare Telegram gateway worker scaffold: receives Telegram webhooks, live-queries gate state (same fail-closed contract as B9), queues the computed reply into D1 (`telegram_outbox`) — never calls Telegram's sendMessage, `telegram_send` stays hold. Not deployed (no CF credentials in this session; deploy stays gated) | `infra/cloudflare/telegram-gateway-worker/` (10 vitest tests) |
| A19 | `ghostclaw-manager` consolidated index skill — cross-references (does not duplicate) the master plan/architecture/model-routing/telegram-gateway docs above; explicitly notes this is a skill name only, not a company rebrand (declined 2026-07-20) | `.claude/skills/ghostclaw-manager/SKILL.md` |
| A20 | **B15 done** — durable A2A peer registry: `web_agent_cards` (migration 0005), `Store::{load_agent_cards,upsert_agent_card}` (`sirinx-store` now depends on `sirinx-a2a` for `AgentCard`, no cycle), `a2a_sync` persists before updating in-memory OmniRoute, `ControlState::load` hydrates registered peers same as gates. Found by the 2026-07-20 L1–L5 department-head review (Gengo/L4): OmniRoute was in-memory-only, the exact restart-loss bug B1 already fixed for gates | `agent_cards_survive_restart` test |
| A21 | **B3 (partial) done** — `automation-system-backend` added, route-inventoried, one route ported: `GET /api/events` (`EventSummary` read model, `Store::list_recent_events`) — recent event activity, newest first, `?limit=` capped at 200. Honest finding: most of that repo (workflows/executions/dashboards/codex-proxy/github-oauth) is a different product domain, not portable into `sirinx-web`'s lead/ROI funnel without a product decision first — see route-inventory diff | `docs/B3_ROUTE_INVENTORY_DIFF.md`, 1 new `sirinx-web` test |
| A22 | **B18 done** — QA pass (2026-07-20, live curl smoke tests against a running `sirinx-control`) found a real correctness bug in B12: completing an already-completed `web_pending_work` item silently overwrote `completedBy`/`completedAt`, losing the audit trail of who finished it first. Fixed: new `StoreError::Conflict`, row-locked check-then-update in `PostgresStore` (same pattern as `update_lead_status`), 409 response, both backends now reject a second completion instead of clobbering the first | 2 new tests (`sirinx-store`, `sirinx-control`) + live curl verification (409 with correct attribution) |
| A23 | `docs/RONIN_ROSTER.md` — honest per-slot roster for all 48 (47 Ronin + Kai): layer, codename where actually assigned, coded-vs-placeholder status (4 coded, 44 placeholder — no fabricated identities for the unimplemented slots), token budget, model lane. Documents the existing chain-of-command rule (`Layer::next_operational()`, "ห้ามข้ามชั้น agent") as the real discipline/escalation system rather than inventing a new one. Clarifies there is no cross-tool "swarm spawn": external workers (Codex/Hermes/OpenCode/etc.) pull via `CODEX_HANDOFF.md` + `scripts/a2a-handshake.sh`, this repo can't push into their runtimes | `docs/RONIN_ROSTER.md` |
| A24 | **B10 done** — skill hygiene audit (2026-07-20, L1/Kuranosuke full read-only pass over all 53 skills, implemented by L4/Gengo): 19 skills carried `sirinx-solar-energy`-imported content (Next.js routes, OpenClaw, `apps/sirinx-web` paths) presented as this repo's architecture — a repo-scope note was inserted after each skill's frontmatter, no other content changed; 2 stale-fact fixes (`sirinx-lead-conversion`'s "Gengo #35" corrected to the real coded slot #36; `sirinx-ai-model-intelligence`'s leftover `🚧 Stub` line updated to match its already-current content); 1 dead reference path fixed (`supabase-postgres-best-practices` → `references/query-partial-indexes.md`); registry total corrected from 50 to the real 53 and the 3 native (non-imported) skills added to its source table. Known limitation, not fixed this pass: ~12 skills additionally invent Ronin codenames at roster slots `docs/RONIN_ROSTER.md` marks unassigned — flagged as a follow-up, out of scope for a hygiene pass | `SKILLS_REGISTRY.md` |
| A25 | **DB schema sync + live QA (2026-07-20)** — QA pass caught that migrations 0004 (B12 `completed_at`/`completed_by`) and 0005 (B15 `web_agent_cards`) were committed to the repo but **never applied to the live Supabase** (`frmpnjxynvpdsnoaqtnz`); the live schema was stuck at 0003. Applied both (additive, idempotent DDL) via `apply_migration`, then functionally verified against the live DB in rolled-back transactions: B12 insert→complete, B18 double-completion conflict guard, B15 idempotent card upsert, and the B3 `list_recent_events` query shape all execute cleanly. `web_agent_cards` RLS posture matches every sibling `web_*` table (INFO-level `rls_enabled_no_policy` = server-role-only, intended). Postman collection could not be live-verified from this session (workspace id truncated in docs) | Supabase migration history now lists `pending_work_completion` + `agent_cards`; security advisor clean for the new table |
| A26 | **Ronin charter (2026-07-20, operator-commissioned)** — canonical role charter for all 48 slots (Kai + 47 Ronin) + the Hermes Telegram commander: each has a codename, a layer, and a specialized capability modelled on SpaceX mission-engineering × Anthropic research/safety functions, adapted to solar-B2B. `roster.rs::codename()` now returns all 48 (was 12 anchors) with a test asserting completeness + uniqueness; the coded-vs-charter distinction stays explicit (still only 4 coded). Full-stack + worker-mesh Mermaid diagrams included. This gives B19 a single source of truth to reconcile the drifted skill codenames against | `docs/RONIN_ROSTER.md`, `crates/sirinx-agents/src/roster.rs` (+2 tests) |

## B. QUEUED — engineering (in priority order)

| # | Work item | Definition of done |
| --- | --- | --- |
| B3 | R2-parity, narrowed after 2026-07-20 inventory (`docs/B3_ROUTE_INVENTORY_DIFF.md`): `automation-system-backend`'s remaining routes are a different product domain (workflows/executions/dashboards/codex-proxy/github-oauth), not recommended for porting as-is — needs a human product decision, not more routing work. `sirinx` (api-gateway) is still fully unassessed | product decision recorded on the workflow-domain question; `sirinx` inventoried |
| B4 | Ronin roster expansion: more L1 scanners (FB group, LINE events) + L2 scorers feeding the same pipeline. 2026-07-20 L1 review (Kuranosuke): under-specified as written (no per-scanner contract, no I/O-vs-pure decision); scoped starter identified — implement `Kin'emon` (Ronin #16, codename-only today) as a second pure L1 agent, LINE-webhook-shape → `LeadDraft`, mirroring Kuranosuke's pattern | each agent tested |
| B5 | Node bridge: register hermes-os A2A (:9000) card into OmniRoute; Obsidian vault sync client script for the Mac node. Unblocked by B15 (registry now durable) | cards visible via /api/a2a/route; notes flow to D1 |
| B6 | R4 web consolidation (marketing/chokma/dashboard apps onto sirinx-web API) | per-app cutover |
| B7 | GhostClaw implementation (contract-first per INTEGRATION_MAP) — **blocked: rotate+purge committed Android keystore first** | quarantine review passed |
| B8 | R5 long tail: mobile apps on central API, archive legacy repos | REPO_AUDIT map all "done" |
| B11 | Ronin model-lane rollout: get operator sign-off on `MODEL_ROUTING_RONIN_TEAM.md`, rotate the GLM-5.2 key that was pasted in chat 2026-07-19 before it's used anywhere, then register the first Ronin on a non-default lane | approval block filled + key rotated + one `AgentCard` live on `model:glm52` or `model:cf-workers-ai` |
| B13 | Wire a real Telegram bot token + `wrangler deploy` for `telegram-gateway-worker`, then build the actual send path once `telegram_send` is opened — until then replies only ever land in `telegram_outbox` | webhook registered with Telegram, gate open with ticket, first real send reviewed |
| B14 | Third-party dependency intake checklist (2026-07-20 L3 recommendation): a short doc — license + maintenance activity + problem-it-solves + dependency footprint + secrets/network-access needs — so a future "just install X" request has a fast, safe lane instead of case-by-case refusal. First candidate to run it against: `github.com/Graphify-Labs/graphify` (declined-pending-review since 2026-07-20) | checklist doc exists; Graphify evaluated against it |
| B16 | Lesson-frequency analysis (2026-07-20 L2 recommendation, Jūnai): `web_lessons`/`web_failure_events` currently accumulate with nothing reading them for insight. Add a small pure function (sibling to `sirinx-roi`) ranking lessons by `hits` + recency, surfaced to L3 as a ranked list — advisory only, no auto-action | function + tests, wired to a read-only report, no gate touched |
| B17 | Local open-weight model lane (2026-07-20 L5 recommendation, Mimura): a properly-licensed offline model (not "uncensored") run locally, e.g. via llama.cpp/Ollama on a Mac-side node, for read-only analysis/reverse-engineering tasks — no network egress, no customer data. Scope as a 4th `ronin-model-routing` lane, same governance (no model artifact in repo, license recorded, approval doc before live use) | new lane documented + approved, license recorded, zero network egress verified |
| B19 | Follow-up from B10's audit, **now unblocked by A26**: the decision was made — codenames are formally assigned in `roster.rs` + `docs/RONIN_ROSTER.md` (the charter). Remaining mechanical work: reconcile the ~12 skills' codename references against the charter (e.g. a skill using "Magokurō #11" must match the charter's slot-11 name "Magodayū", etc.) | every affected skill's codename references match `roster.rs`, zero contradictions |
| B20 | Vision/OCR capability ("eyes") for the L1 perception agents that ingest images — proposed 2026-07-20 referencing `github.com/arcships/light-ocr`. **Held at the B14 dependency-intake gate**: light-ocr is a third-party repo (different owner, unvetted, not added). Vet license/maintenance/footprint/network-access first; not a new agent, a capability on existing L1 agents | light-ocr evaluated against B14 checklist; if approved, wired as an ingest capability behind existing governance |

## C. QUEUED — operator decisions (only the human can do these)

| # | Action | Where |
| --- | --- | --- |
| C1 | Enable GitHub Actions billing/minutes (Settings → Billing → Plans and usage, or Settings → Actions) → CI turns green. **Confirmed 2026-07-20 via PR #9**: workflow runs *are* created (Actions itself isn't disabled) but every job sits in `queued` indefinitely with no runner ever assigned — classic minutes/billing block, not a code issue. 6 runs on record, 0 have ever completed successfully | github.com, PR #9 |
| C2 | Run `scripts/mac-revoke-tcc.sh` on mac-mini-m2; record date | `MAC_TCC_PERMISSIONS.md` |
| C3 | Provision `DATABASE_URL`, `CONTROL_API_TOKEN`, `BRAIN_SYNC_TOKEN` in host secret stores | never in repo |
| C4 | Choose Cloudflare tunnel strategy; rotate ghost-claw-os keystore | `NEXT_ACTIONS.md`, `INTEGRATION_MAP.md` |
| C5 | Open gates with tickets in order: deploy → cloudflare_dns → telegram_send → customer_messaging (adaptive_sync independent) | `GO_LIVE_GATE_CHECKLIST.md` |
| C6 | Rotate the Telegram bot token flagged by the 2026-07-19 audit (outside the repo) | operator secret store |

## D. Standing constraints

Gates hold-by-default · no secrets in repo · one import per phase ·
proposal-only writes to Obsidian sources · consent-safe analytics only ·
brand-safe Thaimart copy · every feature ships with tests · Truth
Protocol on every report · Human ตัดสินใจสุดท้าย.

## E. Cadence

Each work session: pick the top unblocked B-item → run the method in
`.claude/skills/sirinx-master-plan/SKILL.md` → land it → update section
A/B here in the same commit.
