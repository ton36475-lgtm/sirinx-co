# MCP/A2A Connection Admission — 2026-07-20

Verdict: `STATIC_CONNECTION_PLAN_PASS / ZERO_ENABLED / LIVE_SYNC_UNVERIFIED / PRODUCTION_HOLD`

## Candidate identity

- Repository: `/Users/sirinx/SIRINXDev/sirinx-co`
- Branch: `agent/b1-b2-command-center`
- Baseline HEAD: `1f05814c3e9d173e525234d69b3ce7f2d1b01a57`
- Worktree: extensively dirty/untracked; evidence is file-bound, not an
  exact-candidate-SHA release receipt.
- Final resource recheck: `10,756,392 KiB` free (about 10.26 GiB), below the
  15 GiB build/test/install/disposable-database gate.

## Delivered locally

- Closed schema: `schemas/agent-runtime/mcp-connection-registry.v1.schema.json`
- Disabled plan: `config/agent-runtime/mcp-connections.plan-only.v1.json`
- Static fail-closed loader: `services/dev-control-api/src/mcp-connection-plan.mjs`
- Negative test candidate: `services/dev-control-api/src/mcp-connection-plan.test.mjs`
- Operating runbook: `docs/agent-runtime/MCP_A2A_CONNECTION_PLAN.md`
- Provider/effect contract corrections:
  `docs/agent-runtime/PROVIDER_MODEL_ADMISSION.md`

The registry contains exactly 16 entries: two official remote MCP candidates,
one future Cloudflare portal, five MCP clients, two local MCP servers, two
messaging transports, and four proposed A2A peers. Every entry is
`enabled:false`, `runtimeEvidence:UNVERIFIED`, and `toolPolicy:deny-all`.

## Truth corrections included

- The 12 Hermes profiles are definitions. An active count requires fresh
  running/handshake evidence, expected profile and CWD identity, and an injected
  attestation verifier. Cross-profile replay is rejected. No Hermes profile file
  or tree metadata is read.
- Rust and Node CodexBridge surfaces are status-only. They reject malformed,
  extra, empty, non-string, and action-like modes; Rust strictly validates all
  no-action output fields.
- Kimi Code 0.27.0 top-level help did not show an MCP subcommand, but that does
  not prove MCP absence. Exact installed-revision interactive capability remains
  unverified. Current official Kimi Code 0.28 documentation describes
  conversational `/mcp-config`; no upgrade/configuration was attempted.
- Telegram and LINE are messaging transports, not MCP/A2A peers or approval
  authorities. MCP access does not create A2A connectivity.
- Historical A2A smoke is local/in-process only. There are zero authenticated
  external AgentCards, endpoints, TCK receipts, fresh heartbeats, or task leases.

## Static verification performed

- `node --check` passed for the changed status, bridge, connection-plan, and
  test candidate modules.
- Both new JSON documents parse.
- The plan loader returned 16 entries, zero enabled, zero runtime verified, and
  `canConnect:false`.
- `rustfmt --check` passed for the final CodexBridge and crate export.
- Targeted tracked diff whitespace checks passed.
- Independent static review passed the protected-read, definition/runtime,
  attestation/replay, ready-state, and status-only bridge invariants.
- Independent MCP consistency review passed the final Kimi wording, 16-entry
  counts, effect-ticket matching, and zero-enabled truth.
- Independent provider/effect review passed the final install/circuit map,
  provider/C5 correction, historical A2A qualification, activation/effect
  ticket sequencing, and loader/schema constraint parity.

No Vitest/Cargo suite, compilation, service start, package install, model load,
database, browser smoke, OAuth flow, or client-config mutation ran because
resource admission remains closed. Public official documentation was consulted
read-only; no MCP tool/server, paid provider, A2A peer, messaging API,
Cloudflare account, or authenticated external system was contacted.

## Authority and remaining gates

The current receipt v1 and five legacy circuits cannot authorize
`CONNECTOR_ACTIVATION` or `A2A_EGRESS`, and have no complete install, provider,
queue, or generic Cloudflare circuit mapping. The planned v2/migration-0007
slice must add:

1. attested human-only grant issuance separated from requester, maker, checker,
   and executor;
2. exact action-to-circuit bindings including `install`, `provider_call`,
   `connector_activation`, `queue_mutation`, `a2a_egress`,
   `cloudflare_mutation`, and `deploy`;
3. separate least-privilege effect identities/RLS;
4. durable `REQUESTING` before any request byte leaves the host, followed by
   terminal `EFFECT_UNKNOWN` on crash/timeout; and
5. managed startup that refuses readiness/effects without authenticated
   Postgres authority.

## Next safe action

Recover at least 15 GiB through an exact, separately approved, recoverable
cleanup; compile/test the final local bytes; then implement receipt v2 and
migration 0007 plus disposable-Postgres/security negatives. Only afterward can
one documentation-only Cloudflare Worker preview be built locally. Portal
creation, deploy, client configuration, OAuth, a single peer canary, and any
Telegram/LINE send each remain separate action-time decisions.

Official references:
[Cloudflare remote MCP](https://developers.cloudflare.com/agents/model-context-protocol/guides/remote-mcp-server/),
[Cloudflare MCP portals](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/mcp-portals/),
[Kimi Code](https://github.com/MoonshotAI/kimi-code),
[A2A](https://github.com/a2aproject/A2A),
[Telegram Bot API](https://core.telegram.org/bots/api), and
[LINE webhook signature verification](https://developers.line.biz/en/docs/messaging-api/verify-webhook-signature/).
