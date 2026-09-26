# Full System Audit and Execution Roadmap

Date: 2026-09-25
Scope: websites, backend, API, Supabase, Vercel, Cloudflare, A2A, agent mesh, skills, and external agent channels.

This is an evidence-first audit. It does not activate production writes, migrations, live A2A dispatch, DNS, tunnels, or external agent egress.

## 1. Observed inventory

| System | Observed state |
|---|---|
| Public website source | `apps/public-web`; typecheck passed, client 60/60, shared/server 69/69, build passed |
| Rust backend | 8 crates; local `sirinx-web` and `sirinx-control` health 200; no `DATABASE_URL`, so memory persistence |
| Public API | `apps/public-web` tRPC `/api/trpc`, same-origin with frontend |
| Private API | `sirinx-control` 8711 and `dev-control-api` 8790, both local/private by design |
| Supabase | `SIRINX` and `Ghost` platforms `ACTIVE_HEALTHY`; both unlinked; no read-only DB connection |
| Vercel | `ghostclaw/public-web` production deployment Ready, but minimal `api/index.js` lambda and not linked to this checkout |
| Cloudflare | `sirinx-hybrid-tunnel` has no active connection; `dev.sirinx.co` DNS empty; `www.sirinx.co/health` 404 |
| A2A | Rust A2A tests 6/6, Node control tests 47 files / 486 tests, local `/api/a2a/card` 200 with 52 capabilities; live dispatch not proven |
| 47-role registry | Registry contains 47 entries; 6 lead agent files in `.claude/agents`; 50 skill directories |
| Skills | 50 skill directories available in `.claude/skills` |
| External channels | Codex, OpenCode, Hermes, GitHub CLI binaries available; ChatGPT/Hermes integration surfaces are configured but not equivalent to live A2A dispatch |

## 2. Agent and channel evidence

### Local SIRINX control plane

- `GET /health` returned 200.
- `GET /metrics` returned gate metrics; all mutation gates were `0` / `hold`.
- `GET /api/a2a/card` returned 200 and 52 capabilities.
- `GET /api/a2a/status` returned 404.
- `GET /api/a2a/route` returned 405 without the correct method/body.
- `POST /api/a2a/sync` returned 422 when called with an empty body, proving the request contract requires a node field.
- No live sync or egress was performed.

### Node evidence plane

- `GET /health` returned 200 with `dryRunOnly: true` and `externalWrites: false`.
- `GET /api/a2a-sync` reported `a2a-sync-dry-run` and `local-only-dry-run`.
- `GET /api/a2a-live-sync` reported `live-sync-configured`, agent count 16, control URL `127.0.0.1:8711`.
- `GET /api/website` reported the public site as live through Cloudflare Pages, with a separate restore-sources path.
- `GET /api/hermes` reported Hermes connected and its gateway running with `safeDispatch: false`.
- `GET /api/hermes-agent-audit` reported `blocked-evidence-incomplete`.
- `GET /api/policy-core` reported local policy readiness with no external writes.

### External channels

- GitHub CLI is authenticated as `ton36475-lgtm`.
- OpenCode is installed and exposes agents/MCP commands.
- OpenCode MCP: Cloudflare Docs and Hyperresearch connected; Codex CLI MCP disabled; Manus bridge failed; AWS MCP failed.
- Codex MCP list shows Serena, chrome-devtools, node_repl, Hyperresearch, and ghostclaw-a2a-dispatch configured, but the list does not prove live connections. Cloudflare API is not logged in.
- Hermes status shows Codex auth configured, gateway running, A2A plugin configured, and `safeDispatch: false`.
- The Jcode MCP list has four connected servers: Serena, chrome-devtools, Hyperresearch readonly, and node_repl. `ghostclaw-a2a-dispatch` is configured but not connected.

## 3. Safe automatic work queue

These can be automated without external write authority:

1. Keep the public-web build, test, and local browser acceptance suite green.
2. Keep Hero slide media mapping and alt/dimension contract green.
3. Run local `sirinx-control`, `sirinx-web`, and `dev-control-api` health and dry-run status checks.
4. Run Node control tests and Rust A2A/47-role registry tests.
5. Generate read-only A2A sync plans and local dry-run receipts.
6. Audit repo for stale cloudfront image references, placeholder fallbacks, and unverified numeric claims.
7. Update deployment and agent-mesh status reports from observed outputs.

## 4. Work requiring human or operator authority

1. Select the production target between Cloudflare/Rust and the separate Vercel project.
2. Provision non-owner Supabase credentials and link the correct `SIRINX` project.
3. Run the separately ticketed migration and RLS/role read-back.
4. Open the `deploy` gate and deploy the candidate SHA.
5. Choose and activate a Cloudflare tunnel, then open `cloudflare_dns`.
6. Configure Cloudflare Access for `dev.sirinx.co`.
7. Activate a live A2A control URL, agent allowlist, lease, and receipt path.
8. Enable external provider or message egress only with explicit approval and a fixed destination.

## 5. Definition of completion

A channel is not considered live until it has:

- a real connection observation
- an authenticated or trusted identity where required
- a scoped capability/lease
- a dry-run or read-only receipt
- an explicit external-write approval when mutation is required

Configuration, tool catalogs, and successful local unit tests are evidence of readiness, not proof of live dispatch.

## 6. Current honest verdict

The repo has substantial implemented surfaces and passing local tests. The system is not proven live end-to-end across Supabase, Cloudflare, Vercel, and A2A because credentials, active tunnel, production gates, and live control configuration are incomplete.
