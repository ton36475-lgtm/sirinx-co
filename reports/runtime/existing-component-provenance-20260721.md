# Wave 0 Existing-Component Provenance Receipt

Date: 2026-07-21 (Asia/Bangkok)

Verdict: `PROVENANCE_VALIDATED_NOT_ADMITTED`

Stop state: `RECONCILIATION_PACKET_REVIEWED_NOT_ACTIVATED`

## Scope and authority

`APPROVE_IMPLEMENTATION` authorized local code and documentation only. This
receipt used read-only local inspection and added a schema, frozen packet,
validator, tests, documentation, and plan evidence. It did not grant or perform
install, lifecycle scripts, component execution, service start, local model
inference, provider/API calls, OAuth, MCP/A2A connection, Telegram/LINE send,
Cloudflare mutation, database write, push, merge, or deploy.

Protected Hermes auth/config, env files, browser profiles, cookies, keychains,
and raw tokens were not read.

## Capture baseline

These values were independently observed during collection and frozen into the
packet. The canonical validator pins the packet and `Cargo.lock` bytes; it does
not invoke Git or `df`, so branch/HEAD/worktree/resource values are not a live
probe on later runs.

| Field | Value |
| --- | --- |
| Repository | `/Users/sirinx/SIRINXDev/sirinx-co` |
| Branch | `agent/b1-b2-command-center` |
| HEAD | `1f05814c3e9d173e525234d69b3ce7f2d1b01a57` |
| Worktree | dirty, user-owned candidate |
| `Cargo.lock` SHA-256 | `b1f0cddffa71d8189a7e40a87a169d98eb407a2da39b2b21d1ddfece8473185b` |
| Free disk at capture | `14,007,668 KiB` on `/System/Volumes/Data` |
| Workload floor | `15,728,640 KiB` |
| Resource decision | `HOLD_BELOW_15_GIB` |

Parent A29 pins:

- catalog: `2c796db789c919c630ef425387ed75a0cba94a98886cd40299195e47451482ec`
- schema: `64127fbcb2595f606060c2fb627c2af414e1a18779d4c14d2bb50f271256d5eb`
- validator: `0ff1ed446deb0258a7a0931042d55cefea7eae632674e2161dd6e743f4ba7dd6`

Wave 0 pins:

- packet: `42cee7dc44f636ed0726fd97c9496edee8290b0b3f948a5148eee514b4f884ea`
- schema: `13df3ba142bb6b0c2223b8d9117ac31cdad67c937c645c66b984f0a71c98c9ca`

## Material findings

### Codex

The PATH-first Codex installation identifies as npm package `0.144.6` with a
`0.144.6-darwin-arm64` platform package. The JS entrypoint, native arm64
binary, manifests, and distinct ChatGPT-app embedded binary are full-file
hashed. No npm integrity/install transaction or reproducible source-to-binary
receipt was found, so upstream identity remains unbound.

### Hermes

Hermes distribution metadata says `0.18.2` installed by `uv`, but
`direct_url.json` proves it is an editable install. The local source was
observed at `299e409f15aa5615a8a64be488580be92cda351e-dirty`, with a modified
`hermes_cli/web_server.py` and an untracked `.orig` file. Only the selected
wrapper/entrypoint/metadata/record/main-module bytes are sealed. Hermes remains
`EDITABLE_SOURCE_UNPINNED` and was not executed.

### Kimi

The PATH-first npm Kimi Code artifact declares `0.27.0` and its bundle is
byte-bound. `/opt/homebrew/bin/kimi` is a 101-byte test-compatibility stub, not
Kimi Code, and has no matching Homebrew formula/cask receipt. Presence of the
desktop app, CLI, ACP, or MCP does not prove an A2A peer or live connection.

### Axum and SQLx

The frozen dirty-worktree `Cargo.lock` resolves Axum `0.7.9` / axum-core
`0.4.5` and the selected SQLx PostgreSQL family at `0.8.6`. Seven cached
`.crate` archives match their lock checksums byte-for-byte. Cached fingerprints
are historical supporting evidence only; no build or resolution ran.

SQLx has a material publisher/source discrepancy: the parent catalog says
`transact-rs/sqlx`, while the locally packaged `0.8.6` metadata says
`launchbadge/sqlx`. The packet preserves this as unresolved rather than
silently rewriting authority.

### Qwen3.5 2B

The local Ollama manifest SHA-256 is
`324d162be6ca5629ae4517c8710434d0bd2d665bc94dbad46e9af8fbf8a2f0df`.
Its config, 2,741,180,928-byte model, license, and parameter blobs all match
their content-addressed names. GGUF parsing corroborated Q8_0, qwen35,
2,274,069,824 parameters, 262,144 context metadata, 728 tensors, 24 blocks,
and vision metadata.

This binds local bytes only. The mutable tag was not compared to a remote
registry, and no upstream revision, creator attestation, conversion recipe,
signature, or SBOM is embedded. The generic Apache-2.0 layer does not bind
Qwen/Alibaba identity to the digest. The model therefore remains
`QUARANTINE_UNPINNED` and was not invoked.

## Validation

Focused local results:

```text
node scripts/validate-existing-component-provenance.mjs
  PROVENANCE_VALIDATED_NOT_ADMITTED
  6 components / 26 artifacts / 7 Cargo packages

node --test scripts/validate-existing-component-provenance.test.mjs
  14 passed / 0 failed
```

The canonical validator full-file hashes every allowlisted artifact, including
the model blob in bounded chunks, and verifies the exact parent research packet
and current frozen `Cargo.lock`. Tests are negative-first and confirm that
authority, runtime, path/inode, full permission bits, exact-length reads,
checksum, capture metadata, protected-read, nesting, Proxy/accessor, and
side-effect drift fail closed.

Final latest-byte review receipt:

- validator SHA-256: `53cc8fce00d26c0c9a7b3ace10746958487cafbe2f7c5c53b252349bd0cdd8d0`
- test SHA-256: `64853a55a7d22ca2a76578b9fd5aa32d7337102cdba2165282dbd3eb86b45cc8`
- independent code review: `CLEAN`
- independent adversarial schema/path/parser red-team: `CLEAN`
- independent evidence verdict: `VERIFIED` for the local static Wave 0
  snapshot only; resource admission remains `BLOCKED`, and runtime/external/
  production readiness remains unverified/false

The validator and this audit structurally preserve the protected-read and
no-effect boundaries. A static packet cannot independently reconstruct whether
some earlier process historically read a protected file or performed an
effect; those historical negatives remain collection attestations rather than
telemetry-backed proof.

## Truth Protocol

| Claim | State |
| --- | --- |
| Local artifact bytes match packet | VERIFIED at focused validation time |
| Upstream identities all bound | false (`0/6`) |
| Install receipts all verified | false |
| Runtime health verified | false |
| Component admitted | false (`0/6`) |
| Local model invoked | false |
| MCP connected / A2A live | false / false |
| Provider called / message sent | false / false |
| Push / merge / deploy | false / false / false |
| Production ready | false |

Next safe action: independent review the packet and validator; then preserve
the stop state until disk is above the workload floor and a separate exact
ticket authorizes one bounded reconciliation/admission action.
