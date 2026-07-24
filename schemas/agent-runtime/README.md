# Agent Runtime Schemas

These JSON Schemas define closed, versioned contracts for the proposed agent
manager:

- `role-card.v1.schema.json`
- `role-registry.v1.schema.json`
- `task-envelope.v1.schema.json`
- `path-lease.v1.schema.json`
- `run-state.v1.schema.json`
- `approval-receipt.v1.schema.json`
- `approval-receipt.v2.schema.json`
- `run-receipt.v1.schema.json`
- `harness-manifest.v1.schema.json`
- `background-task-plan.v1.schema.json`
- `mcp-connection-registry.v1.schema.json`
- `target-manifest.v1.schema.json`
- `process-evidence.v1.schema.json`
- `resource-cleanup-approval.v2.schema.json`
- `resource-cleanup-plan.v2.schema.json`
- `resource-cleanup-review-request.v1.schema.json`
- `resource-recovery-bootstrap-review.v1.schema.json`
- `executable-identity.v1.schema.json`
- `resource-cleanup-action-time-evidence.v1.schema.json`
- `resource-cleanup-effect-attempt.v1.schema.json`
- `resource-cleanup-post-action-receipt.v1.schema.json`
- `action-circuit-registry.v1.schema.json`
- `effect-authority-preview.v1.schema.json`
- `effect-authority-migration-semantics.v1.schema.json`

They are design-time contracts until Rust validators, persistence, transition
tests, and API integration land. Schema presence is not runtime proof.

The generic approval v2, action/circuit registry, and effect-authority preview
form the B10.0 contract-only slice. The registry is embedded and review-pinned
by `sirinx-core`; its row order is part of the digest. Every receipt and preview
must carry that exact manifest digest, and connected receipts must carry the
exact A26 connection-plan digest. All 13 circuit rows remain `HOLD`, every B10
executor and B10 effect route is unavailable, and LINE has no binding. Pre-existing
compatibility routes in `sirinx-control` and the Telegram service are separate
unmigrated risks, not proof of authority or quarantine. The exact tuple `(actionKind,
circuitName, effectProfile, executorRole)` prevents a Telegram approval from
authorizing customer messaging; Telegram additionally requires its exact
transport, target prefix, and scope-schema ID. The manifest and preview result
are opaque outside the Rust module, so downstream safe Rust cannot flip
authority-like booleans. JSON Schema supplies strict structural parity; the
Rust validator remains authoritative for semantic checks that Draft 2020-12
cannot express, including pairwise principal separation, candidate-clock
windows, and exact `effectKey = circuitName:grantId`. The contract digest uses
the documented length-framed v2 wire bytes and a shared Rust/Node golden vector,
not implementation-dependent JSON object ordering. The preview can
validate closed structure and digests only; it always returns
`CONTRACT_VALIDATED_NOT_AUTHORIZED` with no
database clock, attestation authority, replay ledger, claim, approval
consumption, executor, I/O, provider call, or message send.

`local_inference` is not an A27 external-effect binding. It remains a separate
local model/resource admission circuit and is not authorized by omission from
the 13-row map.

`EffectAuthorityMigrationSemanticsV1` resolves only the SQL persistence
decision: the eventual single shared migration 0007 installs all 13 ordered
definition rows and 13 matching `HOLD` circuit rows while seeding zero tickets,
grants, attestations, admissions, claims, routes, executors, logins, or open
circuits. It also records that the kernel cannot authorize its own installation;
the exact migration candidate and prerequisite NOLOGIN roles require the
pre-existing ticketed human release process. The contract performs no database
mutation and does not make migration 0007 implementation-ready.

The resource-cleanup v2 files are a deliberately non-authoritative static
slice. They do not extend `approval-receipt.v1`, add a database migration,
open a control-plane circuit, expose an API route, consume an approval, or
provide an executor. The only planned candidate is the exact generated Cargo
target directory, and the only accepted operation shape is the canonical
`cargo clean --manifest-path <repo>/Cargo.toml --target-dir <repo>/target`
preview with an absolute cargo binary and non-inherited exact environment.
Runtime output remains
`HOLD` even when every supplied artifact is structurally valid.

`ResourceCleanupReviewRequestV1` is the proposal-only bridge for fresh,
pre-collected C01 observations. It pins the A23 plan bytes/semantic digest,
one exact repository and target, proposed principals/limits/exclusions, a
one-hour expiry, metadata-only target and target-scoped process observations,
local Cargo/Rustup artifact hashes, and checked 5/15/20 GiB arithmetic. Its
only status is `COLLECTED_NOT_APPROVED`; every proof and authority flag is
false, the process and target observations are explicitly not the complete
action-time schemas, and nominal APFS reclaim remains unguaranteed. The pure
validator has no collector, route, filesystem/process/network primitive, or
effect surface.

`ResourceRecoveryBootstrapReviewV1` is an additive comparison-only response to
C01 no longer reaching the workload floor. It review-pins four historical
parents and four exact granular candidates while every guaranteed reclaim,
proof, approval, operation, authority, and effect field remains false. It
rejects wholesale npm/Go/pnpm roots, keeps pnpm v11 and the Cargo registry by
default, forbids aggregate reclaim credit and multi-target grants, and requires
stop/re-measure between separately reviewed targets. Its only result is
`BOOTSTRAP_REVIEW_BLOCKED`; it cannot refresh A31 or resolve the durable
authority bootstrap cycle.

The four follow-on cleanup schemas are also evidence-plane contracts, not an
executor. They bind the launcher symlink chain, selected Cargo binary and exact
toolchain revision, every user-owned path ancestor, action-time target/process/
lease/resource evidence, a PREPARED-only effect attempt, and a post-action
artifact marked `STRUCTURAL_ONLY_NO_AUTHORITY`. A structural post-action PASS
requires all proposal/action/attempt contexts plus full post-process and
post-target artifacts and a distinct checker-receipt shape, but it is still not
a durable authoritative PASS. The admission evaluator never exposes a route or
dispatch primitive and always returns `HOLD`, `canDispatch=false`,
`approvalConsumed=false`, and `executorAvailable=false`. The exact
`RUSTUP_TOOLCHAIN` selection is intentionally absent from the A23 plan digest,
so executor admission remains blocked even when fixtures validate.

Ajv 8.20.0 plus `ajv-formats` 3.0.1 are pinned as development dependencies for
Draft 2020-12 instance-parity tests. Strict compilation registers the referenced
target-manifest and process-evidence schemas, accepts the four positive cleanup
fixtures, and rejects open objects, malformed timestamps, a `REQUESTING`
attempt, and a false PASS. This is schema-engine evidence only; it does not
provide runtime admission, authority, persistence, collection, or execution.

`TargetManifestV1.entriesDigest` is SHA-256 over the domain prefix
`sirinx-target-manifest-entries-v1\0` followed by UTF-8-byte-sorted entries.
Each entry is encoded as the ten schema fields in schema order, separated and
terminated by NUL bytes; JSON null values use the literal `<null>`. The loader
also recomputes count, logical size, link-set completeness, symlink containment,
root binding, status, and freshness. `TargetManifestV1.manifestDigest` then
binds the complete closed artifact, including root, generation time, status,
entries, and the entry digest. `ProcessEvidenceV1.snapshotDigest` is a
domain-separated canonical-JSON digest of the closed snapshot without its own
digest field. None of these digests is an approval signature.
