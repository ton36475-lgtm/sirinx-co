# SIRINX Neural Fabric V1 — Spec Packet Receipt

Mission: `SIRINX_NEURAL_FABRIC_V1_LOCAL_ONLY`

Timestamp: `2026-07-23T18:07:55+07:00`

Status: `SPEC_REVIEWED / DOCUMENTATION_PASS / RUNTIME_PARTIAL / PRODUCTION_HOLD`

## Scope completed

- Reconciled the current Hermes, A2A, MCP/API, agent-lane, Telegram, LINE,
  provider, memory, database, and evidence boundaries.
- Drafted one Neural Fabric V1 authority model.
- Drafted Hermes as manager/coordinator only.
- Drafted the team model as two makers plus one independent verifier.
- Drafted Telegram as the sole remote backend command transport.
- Drafted LINE as SIRINX customer care only.
- Defined canonical envelopes, task contracts, leases, receipts, approvals,
  memory projections, state machines, and delivery phases.
- Defined a local-only test plan for schema, lease, replay, channel isolation,
  database, provider/MCP, restart recovery, and three-agent synthetic E2E.

## Repository truth

| Repository | Branch | Base SHA | Dirty paths at snapshot |
|---|---|---|---:|
| `project-hermes` | `main` | `3496f2e8a99bab0bbb8d399c12789af9539595d8` | 45 |
| `sirinx-agent-native-os` | `feat/sirinx-web-line-trust-v1` | `efaaccab8b02cc5979b51499f0683f1a847488a6` | 23 |
| `sirinx-os` | `migration/v5-rebase` | `b55f81ecd372ff23a34fcf33c2744706447e14ca` | 111 |
| `sirinx-co` | `agent/b1-b2-command-center` | `1f05814c3e9d173e525234d69b3ce7f2d1b01a57` | 139 |

These counts are a point-in-time snapshot and include other active lanes. No
existing dirty path was deleted or reset.

## Runtime health snapshot

| Port/surface | Result |
|---|---|
| 8643 Hermes API | listener; `/health` HTTP 200 |
| 8644 Hermes webhook | listener; `/health` HTTP 200 |
| 8080 MCP/API | listener; health, ready, and db status HTTP 200 |
| 8080 MCP tools/list | `lane_status`, `db_status`, `echo` |
| MCP/API database | SQLite, user_version 0 |
| 5432 PostgreSQL | healthy container; exposed on all host interfaces; not wired to MCP/API |
| 9000 A2A | no listener |
| 8790/8791 LiveSync | no listeners |
| 8710/8711 | no listeners |
| 11434 Ollama | listener; version endpoint HTTP 200 |
| 9119 dashboard | listener; body not read because token-exposure prerequisite is unresolved |

## Critical findings

1. Existing A2A/LiveSync listeners are absent, so a connected mesh cannot be
   claimed.
2. A legacy Telegram/MCP execution bridge accepts caller-provided identity and
   does not prove durable ticket/lease/idempotency enforcement. Its tracked
   configuration enables execution with workspace write and
   `approval_policy=never`.
3. The current LINE runtime signature boundary is weaker than the approved L1
   contract and must be repaired before customer ingress.
4. `sirinx-co` exposes live A2A registration behavior when `dryRun:false`
   without a durable grant, lease, or idempotency record.
5. Durable cards, leases, outbox, approval, and receipt authority are not yet
   unified.
6. SQLite is healthy for the current local MCP/API service but is not the
   multi-writer authority required by Neural Fabric V1.
7. The current MCP/API OpenAPI declares no authentication and Docker publishes
   port 8080 on all host interfaces.
8. PostgreSQL is healthy but unwired and broadly bound.
9. Provider authentication/fallback and live end-to-end Telegram delivery are
   not verified.
10. Generated OMX concurrency policy conflicts with the adopted three-worker,
    two-writer model.
11. The current Ronin role registry is hard-coded to `one-maker`; the adopted
    two-maker topology requires a versioned contract change.
12. Existing process-memory task, approval, and audit stores cannot remain
    execution authorities.

## Files added

- `docs/specs/SIRINX_NEURAL_FABRIC_V1.md`
- `docs/packets/SIRINX_NEURAL_FABRIC_LOCAL_TEST_PLAN_V1.md`
- `docs/receipts/SIRINX_NEURAL_FABRIC_V1_EVIDENCE_MANIFEST_20260723.json`
- `docs/receipts/SIRINX_NEURAL_FABRIC_V1_SPEC_PACKET_20260723.md`

## Verification performed

- Read-only Git root, branch, SHA, and dirty-count inspection.
- Read-only port/listener inspection.
- Read-only local health requests.
- Read-only MCP `tools/list`.
- Read-only container name/image/status/port inspection.
- Static architecture and governance reconciliation.

## Independent documentation review

Reviewer lane: `/root/neural_fabric_security_review`

Initial verdict: `REPAIR`

Repairs applied:

- separated Hermes coordination, Authority Kernel transitions/grant issuance,
  and PostgreSQL persistence
- changed Telegram from grant authority to authenticated human-intent transport
- split same-worktree denial from distinct-worktree dual-maker admission tests
- downgraded this artifact from an execution receipt to a documentation
  candidate pending byte-bound evidence and re-review

The reviewer identity is a session-local review lane, not a cryptographically
attested runtime principal.

Final re-review verdict: `PASS_DOCUMENTATION_ONLY`

## Bound artifact digests

```text
d9b1bece192207fe114c498d33486c941bf1aedcd4085bcc578bcf73e50e1c5e  docs/specs/SIRINX_NEURAL_FABRIC_V1.md
259ca5735234108c7e435742bb4333bee2fee8239b78ca53f5f71f85f02506ae  docs/packets/SIRINX_NEURAL_FABRIC_LOCAL_TEST_PLAN_V1.md
a66995f7d28b20541770ed4b1fe705287cf02877c828faf11263933857f7f721  docs/receipts/SIRINX_NEURAL_FABRIC_V1_EVIDENCE_MANIFEST_20260723.json
```

The evidence-manifest validator passed for both source-file hashes and all four
observation hashes.

## Evidence limitations

- This document is a narrative documentation receipt, not a runtime
  `TransitionReceiptV2`.
- Listener, HTTP, MCP, and container observations are bound in
  `SIRINX_NEURAL_FABRIC_V1_EVIDENCE_MANIFEST_20260723.json`.
- No lease, grant, runtime verifier identity, or deployed artifact is claimed.
- The evidence manifest binds the current spec and test-plan bytes; its digest
  is recorded above.

## Obsidian brain sync

- Configuration check: `ready`
- Dry-run preview: completed
- Digest append: completed
- Runtime JSONL append: completed
- Provider call: none
- Secret access: none

## Not executed

- source implementation
- test-suite execution
- service start/reload/restart
- MCP write tool
- provider call
- Telegram live send
- LINE live ingress/reply/send
- database migration
- package installation
- Git staging/commit/push/merge
- Cloudflare or other deployment

## Gate

The next phase is security-boundary implementation plus local synthetic tests.
It requires an exact implementation approval bound to:

`SIRINX_NEURAL_FABRIC_V1_LOCAL_ONLY`

External effects remain separately gated even after implementation approval.

## Next safe action

Stop at the implementation gate. After exact approval, execute N1 security
boundary repairs before any core/runtime wiring or full-system test.
