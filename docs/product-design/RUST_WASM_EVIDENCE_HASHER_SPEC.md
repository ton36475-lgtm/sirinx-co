# Rust/Wasm Evidence Hasher Spec

Status: SPEC READY - LOCAL ONLY - WAITING FOR PROTOTYPE APPROVAL

## Feature

Rust/Wasm Evidence Hasher

## Goal

Create a deterministic local evidence hashing tool that can generate and verify
hash manifests for SIRINX evidence packets.

## Why

SIRINXDev is moving toward proof-linked project memory. Evidence packets need a
repeatable, fast, low-risk way to prove which files existed at a local point in
time. This is a bounded Rust/Wasm candidate because it has simple inputs,
deterministic output, no provider dependency, and strong testability.

## Source Doctrine

This spec follows:

- `outputs/evidence/rust-wasm/2026-06-05-wasmer-codex-intake/SIRINX_RUST_WASM_MIGRATION_DOCTRINE.md`
- `outputs/evidence/rust-wasm/2026-06-05-wasmer-codex-intake/MIGRATION_CANDIDATE_MATRIX.md`

## Scope

Local-only prototype scope:

- Hash files under an explicitly provided local root.
- Produce a stable JSON manifest.
- Produce a Markdown summary for evidence packets.
- Verify a manifest against current local files.
- Support SHA-256 as the first required algorithm.
- Allow optional BLAKE3 later, but do not require it for v0.
- Never read secrets for configuration.
- Never print file contents.
- Never cross filesystem boundaries outside the supplied root.

## Explicitly Blocked

- No provider call.
- No network access.
- No deploy.
- No push.
- No live Telegram/LINE/Facebook send.
- No production migration.
- No Wasmer Edge deployment.
- No automatic deletion or rewriting of evidence.
- No hashing outside an explicitly provided root path.
- No secret printing.

## Users

| User                    | Need                                                         |
| ----------------------- | ------------------------------------------------------------ |
| Hermes CEO              | Know whether an evidence packet is stable enough for review. |
| Codex Worker            | Generate manifest evidence after local work.                 |
| Oracle Provenance Agent | Link file hashes to claims and timeline events.              |
| QA Guardrail Agent      | Re-run verification before status promotion.                 |
| Human Reviewer          | Inspect a short manifest summary without reading raw files.  |

## User Flow

```text
Select evidence packet root
-> Run local hasher manifest command
-> Produce JSON manifest and Markdown summary
-> Link manifest to timeline and claims
-> Later run verify command
-> Report PASS / FAIL / MISSING / CHANGED
-> Stop before commit/push/deploy unless separately approved
```

## Proposed CLI Contract

Future prototype command shape:

```bash
evidence-hasher manifest \
  --root outputs/evidence/<domain>/<lane> \
  --out outputs/evidence/<domain>/<lane>/hash-manifest.json \
  --summary outputs/evidence/<domain>/<lane>/hash-summary.md \
  --algorithm sha256 \
  --ignore sha256sums.txt \
  --ignore hash-manifest.json
```

```bash
evidence-hasher verify \
  --manifest outputs/evidence/<domain>/<lane>/hash-manifest.json
```

## Manifest Data Contract

The manifest must match:

```text
schemas/evidence-hash-manifest.schema.json
```

Required top-level fields:

- `manifest_version`
- `generated_at`
- `tool`
- `root`
- `algorithm`
- `proof_status`
- `summary`
- `files`

Required file fields:

- `path`
- `size_bytes`
- `sha256`

Optional file fields:

- `git_object_id`
- `modified_at`
- `mime_type`

## Determinism Rules

- Sort paths lexicographically.
- Use paths relative to the supplied root.
- Normalize path separators to `/`.
- Exclude the output manifest from its own hash list.
- Exclude generated checksum summaries when requested.
- Do not include host-specific absolute paths in file records.
- Include absolute root only in `root.absolute_path` for reviewer context.

## Security Rules

- The tool is local-only.
- It must not perform network requests.
- It must not load provider credentials.
- It must not print file contents.
- It must reject roots that do not exist.
- It must reject traversal outside the supplied root.
- It must record skipped symlinks unless symlink following is explicitly
  approved in a future spec.

## Benchmark Plan

Baseline before Rust implementation:

```bash
find outputs/evidence -type f | sort | while read -r file; do
  shasum -a 256 "$file"
done
```

Prototype benchmark targets:

| Metric              | Target                                                            |
| ------------------- | ----------------------------------------------------------------- |
| Determinism         | same file set produces byte-stable manifest except `generated_at` |
| Correctness         | manifest hashes match `shasum -a 256` baseline                    |
| Small packet speed  | complete under 1s for 100 files on Mac Mini M2                    |
| Medium packet speed | complete under 5s for 5,000 small files                           |
| Verification output | reports changed, missing, and extra files clearly                 |

Performance improvement is not required for v0. Correctness and deterministic
evidence are required.

## Acceptance Criteria

- [ ] Spec references local-only boundary.
- [ ] JSON schema exists.
- [ ] Manifest contract supports evidence packet use.
- [ ] Future CLI contract is documented.
- [ ] Security and traversal constraints are explicit.
- [ ] Benchmark plan compares against `shasum -a 256`.
- [ ] Prototype gate is separate from spec gate.
- [ ] No Rust code is generated during this spec lane.

## Prototype Gate

Implementation may start only after:

```text
APPROVE_RUST_WASM_EVIDENCE_HASHER_PROTOTYPE_LOCAL_ONLY
```
