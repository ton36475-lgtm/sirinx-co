# SIRINX Neural Fabric V1 — Local Test Plan

Status: `PLAN_ONLY / NOT_EXECUTED`

Mission: `SIRINX_NEURAL_FABRIC_V1_LOCAL_ONLY`

This plan does not authorize source implementation, service reload, provider
call, live Telegram/LINE messaging, database migration, installation, deploy,
push, or production mutation.

## Entry gates

Before tests may execute:

1. Exact implementation approval is recorded.
2. One repository, branch, and immutable base SHA are frozen.
3. Dirty paths are assigned to owners or excluded.
4. Test code and fixtures are inside explicit owned paths.
5. No test reads raw secrets or user-local `.env` files.
6. PostgreSQL tests use an isolated test database and reversible migrations.
7. Telegram and LINE use synthetic fixtures only.
8. Provider adapter uses a deterministic mock.
9. Two maker worktrees and one read-only verifier workspace exist.
10. Ungated live A2A routes are disabled or replaced by injected adapters.
11. The current MCP/API service is either loopback/internal-only with auth or
    excluded from mutation tests.

If an entry gate fails, record `BLOCKED` and do not substitute a weaker probe.

## Test topology

```text
Synthetic Telegram Fixture ----+
                                |
Synthetic LINE Fixture --------+--> Ingress Guards --> Fabric Core
                                |                        |
Local CLI Fixture -------------+                        v
                                                Durable Test Store
                                                       |
                              +------------------------+------------------+
                              |                        |                  |
                        Mock Claude Maker        Mock Codex Maker   OpenCode Verifier
                              |                        |                  |
                              +--------------- evidence ----------------+
                                                       |
                                                       v
                                                Receipt Verifier
```

## Test matrix

| ID | Test | Expected result | Required evidence |
|---|---|---|---|
| NF-001 | strict schema parse | unknown/missing fields rejected | validator output |
| NF-002 | JCS digest repeatability | same logical JSON has same digest | digest fixture |
| NF-003 | payload tamper | changed payload fails digest check | rejection receipt |
| NF-004 | stale timestamp | expired envelope quarantined | state transition |
| NF-005 | nonce replay | second use denied | idempotency record |
| NF-006 | same key/same body | original result returned | response equality |
| NF-007 | same key/different body | `409` | problem response |
| NF-008A | same-worktree source-writer race | one writer wins; the other is denied even with disjoint paths | transaction log |
| NF-008B | distinct-worktree maker admission | both writers admitted only with distinct principal/run/lease/worktree, non-overlapping paths, immutable candidate commits, and separate checker receipts | two lease and receipt chains |
| NF-009 | lease heartbeat | valid owner renews | lease version increment |
| NF-010 | stale lease takeover | only after expiry/CAS | old/new lease evidence |
| NF-011 | cross-lane claim | denied | policy receipt |
| NF-012 | path overlap | second writer denied | ownership receipt |
| NF-013 | max writers | third writer denied | concurrency evidence |
| NF-014 | verifier independence | maker cannot self-verify | identity rejection |
| NF-015 | repair loop | returns to maker below cap | state history |
| NF-016 | repair cap | fourth repair becomes `STALLED` | terminal receipt |
| NF-017 | worker receipt scope | out-of-scope file fails | diff-scope report |
| NF-018 | claimed test without artifact | remains `UNVERIFIED` | verifier report |
| NF-019 | receipt-chain tamper | verification fails | hash-chain report |
| NF-020 | restart recovery | queued/leased state recovered safely | before/after snapshot |
| NF-021 | per-candidate review | two makers require two bound receipts | verifier records |
| NF-022 | integration lease | only one integrator may converge commits | integration receipt |
| NF-023 | memory rebuild | deterministic projection digest | checkpoint/rebuild report |
| NF-024 | poison event | projector quarantines without skipping silently | poison-event receipt |
| NF-025 | role-registry version | old one-maker registry rejects two makers; new version is explicit | registry validation |
| NF-026 | combined candidate review | role 42 re-verifies integration commit | combined receipt |

## Channel-isolation matrix

| ID | Fixture | Expected result |
|---|---|---|
| CH-001 | Telegram authenticated `/status` | read-only mission/status |
| CH-002 | Telegram spoofed caller fields | rejected |
| CH-003 | Telegram direct shell request | quarantined |
| CH-004 | Telegram stale update replay | denied |
| CH-005 | Telegram provider request without grant | `WAITING_HUMAN_RED` |
| CH-006 | LINE valid customer FAQ | customer-policy draft |
| CH-007 | LINE missing signature header | rejected before parse/enqueue |
| CH-008 | LINE missing channel secret | `503`, enqueue count unchanged |
| CH-009 | LINE malformed signature | rejected |
| CH-010 | LINE invalid signature | rejected |
| CH-011 | LINE duplicate event | one business effect |
| CH-012 | LINE backend `/deploy` command | rejected as forbidden namespace |
| CH-013 | LINE agent-control prompt | rejected and audited |
| CH-014 | LINE raw user ID outbound | rejected; alias/hash required |
| CH-015 | LINE broadcast request | HUMAN_RED and disabled by default |

## Provider and MCP matrix

| ID | Test | Expected result |
|---|---|---|
| PM-001 | tools/list | discovery only; no authorization granted |
| PM-002 | write tool without grant | denied |
| PM-003 | wrong MCP audience | denied |
| PM-004 | unknown model alias | quarantined |
| PM-005 | invalid provider auth | fatal route failure; no implicit fallback |
| PM-006 | undeclared fallback | denied |
| PM-007 | mock provider success | bounded route receipt |
| PM-008 | token/cost cap exceeded | route stopped |
| PM-009 | provider response malformed | failed validation, no state mutation |
| PM-010 | direct bearer gate decision | cannot mint human authority |
| PM-011 | `dryRun:false` live registration without grant | denied before adapter call |

## Database matrix

| ID | Test | Expected result |
|---|---|---|
| DB-001 | migration up | schema created |
| DB-002 | migration down | reversible rollback |
| DB-003 | migration up again | deterministic final schema |
| DB-004 | unique idempotency constraint | duplicate prevented |
| DB-005 | tenant boundary | cross-tenant access denied |
| DB-006 | outbox transaction | business state and event commit together |
| DB-007 | crash before send | pending outbox recovered |
| DB-008 | crash after effect/unknown ack | `EFFECT_UNKNOWN`, no auto-retry |
| DB-009 | lease contention | one transaction wins |
| DB-010 | backup/restore | restored counts and hashes match |
| DB-011 | PostgreSQL network binding | not exposed beyond approved interface |
| DB-012 | SQLite authority check | rejected for multi-writer production mode |
| DB-013 | RLS/role attestation failure | all mutations unavailable |
| DB-014 | grant plus outbox atomicity | both commit or neither commits |
| DB-015 | `REQUESTING` crash point | terminal `EFFECT_UNKNOWN` |

## Three-agent synthetic E2E

### E2E-A — backend task

```text
synthetic Telegram owner intent
-> authenticated envelope
-> Hermes plan
-> Authority Kernel transition
-> frozen Task Contracts
-> Claude and Codex path-disjoint leases
-> worker receipts
-> OpenCode independent verification
-> deterministic guard
-> local delivery receipt
```

Pass conditions:

- no provider call
- no live message
- exact two writer leases in separate worktrees
- distinct principal, run, lease, candidate commit, and checker receipt per maker
- no path overlap
- verifier identity differs from both makers
- test outputs are independently rerun
- final receipt hash verifies

### E2E-B — customer request

```text
synthetic LINE webhook
-> raw-body signature pass
-> customer policy
-> FAQ/lead/booking draft
-> outbound draft
-> approval state if required
-> no send
-> receipt
```

Pass conditions:

- no backend command is admitted
- no raw LINE user ID is exposed
- no broadcast
- no live reply
- duplicate webhook produces no duplicate business effect

### E2E-C — restart and recovery

Interrupt after lease, after worker receipt, and after outbox commit. Restart the
local fabric and prove deterministic recovery without self-redrive of
`EFFECT_UNKNOWN`.

## Current read-only health baseline

Observed 2026-07-23:

| Surface | Evidence | Status |
|---|---|---|
| Hermes API `127.0.0.1:8643/health` | HTTP 200, Hermes 0.19.0 | `REACHABLE` |
| Hermes webhook `127.0.0.1:8644/health` | HTTP 200 | `REACHABLE` |
| MCP/API `127.0.0.1:8080` | health/ready/db status HTTP 200 | `REACHABLE_PARTIAL` |
| MCP tools | `lane_status`, `db_status`, `echo` | `READ_ONLY_OR_TEST_SURFACE` |
| MCP/API database | SQLite `/mnt/data/ghostclaw.sqlite`, user_version 0 | `NOT_DURABLE_MULTI_WRITER_AUTHORITY` |
| MCP/API security | OpenAPI has no security scheme; Docker publishes all host interfaces | `CRITICAL_HOLD` |
| PostgreSQL | container healthy, host port 5432 on all interfaces | `UNWIRED / NETWORK_REVIEW_REQUIRED` |
| A2A 9000 | no listener | `BLOCKED` |
| LiveSync 8790/8791 | no listeners | `BLOCKED` |
| 8710/8711 | no listeners | `BLOCKED` |
| Ollama 11434 | HTTP 200, version 0.32.1 | `REACHABLE_NOT_ADMITTED` |
| Dashboard 9119 | listener observed, body deliberately not read | `QUARANTINED_PENDING_TOKEN_FIX` |

Reachability is not end-to-end health.

## No-run list before repair

- Do not run
  `sirinx-co/services/dev-control-api/src/a2a-omniroute.test.mjs` while port
  8711 is listening. Its current `dryRun:false` case uses default fetch and may
  call a live control plane.
- Do not execute the legacy `project-hermes` Telegram-to-Codex bridge. Its
  tracked configuration enables workspace write with `approval_policy=never`.
- Do not run write methods against the current unauthenticated port-8080
  service.
- Do not substitute `pnpm exec vitest` for the missing `sirinx-os`
  `node_modules/.bin/vitest`; that may trigger install behavior.
- Do not run disposable PostgreSQL/container tests without a separate exact
  Docker-test gate and a digest-pinned local image.

## Execution order after approval

1. Run security-boundary regression tests first.
2. Prove ungated A2A and legacy MCP/Codex paths are unreachable.
3. Implement and test contracts and deterministic kernel.
4. Implement durable state and race/recovery tests.
5. Implement deterministic memory projection/rebuild tests.
6. Wire synthetic channel fixtures.
7. Wire mock workers and independent verifier.
8. Run E2E-A, E2E-B, and E2E-C.
9. Produce a fresh evidence envelope.
10. Stop before provider or live-channel canaries.

Any failure in signature, identity, lease, receipt, channel isolation, or
durable state is a hard stop.

## Evidence contract

Every test run must emit:

```text
run_id
base_sha
test_id
command
start/end timestamps
exit_code
stdout/stderr digests
fixture digests
database snapshot digest when relevant
files changed
agent identity and role
lease ID when relevant
status
residual risk
```

No secret values or raw customer identifiers may enter the evidence bundle.
