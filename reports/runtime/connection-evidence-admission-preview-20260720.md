# Connection Evidence Admission Preview — A26 Static Receipt

Status: `VERIFIED_HOLD_ONLY / EVIDENCE_VALIDATED_NOT_ADMITTED / PRODUCTION_HOLD`

Date: 2026-07-20 (Asia/Bangkok)

This receipt covers a local, pure, non-authoritative preview only. It does not
prove that any MCP server, A2A peer, Hermes/Claude/Kimi/Codex process,
Cloudflare resource, Telegram bot, or LINE channel is connected or live.

## Scope

Added:

- `schemas/agent-runtime/connection-evidence.v1.schema.json`
- `schemas/agent-runtime/connection-admission-preview.v1.schema.json`
- `services/dev-control-api/src/connection-admission.mjs`
- `services/dev-control-api/src/connection-admission.test.mjs`

Hardened existing local projections:

- `services/dev-control-api/src/runtime-agent-cards.mjs`
- `services/dev-control-api/src/runtime-agent-cards.test.mjs`
- `services/dev-control-api/src/a2a-omniroute.mjs`
- `services/dev-control-api/src/a2a-omniroute.test.mjs`

No server route, collector, database table, migration, process probe, client
configuration, credential path, provider call, message adapter, network call,
or executor was added.

## Closed evidence contract

`ConnectionEvidenceV1` binds one candidate connection to:

- connection, transport, peer, principal, and role identity;
- exact component version, immutable source revision, artifact digest, SPDX
  expression, license digest, provenance digest, and component identity digest;
- canonical HTTPS endpoint origin, or `null` for local `stdio`/`none`;
- A2A AgentCard peer/origin/protocol/capability/data-ceiling digests;
- protocol version/digest, ordered declared capabilities, and data-class ceiling;
- exact collector principal/revision/binary/attestation identity;
- observation and expiry times;
- plan, task, run, lease, and receipt IDs/digests; and
- a domain-separated canonical evidence digest.

The runtime validator rejects unknown fields, raw readiness booleans, a future
timestamp with zero skew, stale/expired/overlong evidence, impossible calendar
dates, cross-peer/principal/component/task/run/lease/receipt bindings, digest
drift, capability or data-ceiling escalation, plan drift, unsupported roles or
transports, non-canonical origins, userinfo/query/fragment/path origins,
localhost including a trailing dot, private/link-local/metadata IPv4 literals,
and every IPv6 literal including mapped IPv4 forms.

DNS resolution and origin authentication are deliberately not attempted. The
preview therefore reports them as blockers and never sets endpoint trust.

## Non-authority boundary

The candidate context is caller supplied. Matching it proves only internal
consistency, not durable authority. The preview also pins the exact canonical
v1 plan digest in code so a caller cannot replace the plan with a forged but
self-consistent plan. Eleven canonical entries that lack a remote endpoint
remain ineligible for evidence preview; this is deliberate disabled-plan truth,
not an inferred connection.

The output can only be:

```text
status = EVIDENCE_VALIDATED_NOT_ADMITTED
admitted = false
enabled = false
endpointVerified = false
agentCardTrusted = false
handshakeReady = false
authenticationValidated = false
capabilityAuthorityValidated = false
canConnect = false
canRunMcp = false
canEmitA2a = false
canSendMessages = false
authorityValidated = false
durableAdmission = false
replayProtectionAvailable = false
evidenceUniquenessValidated = false
```

All network/process/environment/secret/database/external-write/message/route/
command flags are also fixed `false`. The blockers explicitly retain caller
context, unattested clock, missing durable authority, unresolved DNS/origin
authentication, absent durable admission/effect circuits/replay ledger, and
disabled network/message I/O.

## Raw readiness demotion

The former compatibility inputs are still visible for audit but can no longer
promote runtime truth:

- raw `observedAgentIds` becomes `reportedObserved`; card `observed`,
  `endpointVerified`, and `registrationEligible` remain false;
- raw agent/card/cmux IDs become `reportedAgentIds`; `observedAgentIds` remains
  empty;
- raw surface presence/version/handshake values become `reported*`; canonical
  `version` is `null` and `handshakeVerified` is false;
- raw MCP server IDs/availability become `reported*`; `available`, `enabled`,
  per-server `observed`, and `syncEnabled` remain false; and
- handshake output has no evidence-ready or partial-evidence branch. It can
  report only unverified or reported-not-admitted.

Runtime card projection version is now 1.2 and OmniRoute projection version is
1.4. The existing explicit opt-in loopback Hermes probe remains separate,
pre-existing behavior. Its results are demoted to reported-only, and neither
the A26 path nor default status invokes it.

## Verification

Latest focused command used the declared Ajv packages from the pre-existing
pnpm virtual store through `NODE_PATH`; no package installation occurred.

```text
4 test files passed
81 tests passed
0 failed
```

Coverage includes strict Draft 2020-12 compilation for both schemas, valid
positive fixtures, schema-level unknown/readiness/false-flag negatives, 31+
runtime evidence negatives, A2A card cross-binding, immutable plan authority,
the 11 null-endpoint ineligibility invariant, scalar-clock-only behavior, every
raw OmniRoute ingress, injected probes, opt-in loopback probe demotion, and a
forged handshake body.

Node syntax passes for the new module/test. A source guard confirms the A26
module contains no filesystem, network, child-process, environment, database,
route, provider, or messaging primitive. Independent latest-tree review
returned `VERIFIED` for this explicit static/non-authoritative scope; a second
independent red-team also returned `VERIFIED` with no remaining fail-open
finding. A schema-specific third review found temporal and schema-negative
coverage gaps; the final matrix reseals each temporal mutation, asserts its
specific error, and covers every nested closed object, false flag, validation
flag, blocker const, and stdio/A2A conditional.

## Resource and production truth

Read-only disk sample at 2026-07-20 23:42:40 +0700:

```text
available = 14,648,632 KiB
15 GiB floor shortfall = 1,080,008 KiB
20 GiB conservative target shortfall = 6,322,888 KiB
```

The checkout remains a large dirty-worktree candidate and is not exact-SHA
release evidence. Full builds, full CI, disposable Postgres, authenticated
browser smoke, provider/MCP/A2A calls, Telegram/LINE sends, Cloudflare changes,
push, merge, and deploy remain unverified or held.

## Next safe action

Keep B11 at HOLD until B10 supplies durable managed authority, trusted clock,
replay/uniqueness storage, authenticated origin/AgentCard evidence, resource
admission, exact tool allowlists, and separate effect tickets. Before that,
only documentation and local pure negative tests are admissible.
