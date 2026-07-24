# Mac mini M2 Agent Runtime Admission Snapshot — 2026-07-20

Verdict: `STATIC_REPAIR_CANDIDATE / MODEL_INSTALL_HELD / PRODUCTION_HOLD`

## Scope and authority

- Repository: `/Users/sirinx/SIRINXDev/sirinx-co`
- Branch: `agent/b1-b2-command-center`
- Baseline HEAD: `1f05814c3e9d173e525234d69b3ce7f2d1b01a57`
- Worktree: extensively dirty/untracked; this report is candidate evidence, not
  an exact-SHA release receipt.
- No protected config, credential, `.env`, token, cookie, private key, provider
  payload, or secret value was read.

## Read-only host evidence

| Observation | Value |
|---|---|
| Hardware | `Mac14,3`, Apple arm64 |
| Memory | `8,589,934,592` bytes (8 GiB) |
| Logical CPUs | 8 |
| Free disk | `10,756,392 KiB` (about 10.26 GiB), final re-measurement on 2026-07-20 |
| Admission floor | 15 GiB for install, model download, full build/test, Docker, or disposable Postgres |
| Ollama | server reports `0.32.1`; client warning reports `0.24.0` |

No model was loaded or invoked. The local Ollama list reported:

- `qwen3.5:2b` (2.7 GB) and `qwen3.5:4b` (3.4 GB);
- `deepseek-r1:1.5b`, `deepseek-r1-lite`, and `deepseek-r1-16k`;
- `llama3.2:3b`, `qwen2.5`, and three Hermes Prime aliases;
- third-party `Qwythos-9B-Claude-Mythos-5-1M-GGUF:Q4_K_M` (6.8 GB);
- `kimi-k2.7-code:cloud`, which is a cloud alias, not local weights.

Displayed model sizes are not an additive cleanup guarantee because Ollama
blobs may be shared. No model was deleted. Any cleanup requires an exact target
approval, a provenance/use review, a recoverable plan where possible, and a
post-cleanup disk measurement.

## Static repairs made

1. `agent-team.mjs` reads neither `~/.hermes/profiles/*/config.yaml` nor profile
   tree metadata. Profile/CWD/runtime readiness defaults to unverified; an
   active count additionally requires fresh running/handshake evidence accepted
   by an injected attestation verifier and bound to the expected profile/CWD;
   cross-profile replay is rejected.
2. `codex-autoloop.mjs` now exposes only a status projection for the Rust
   bridge, rejects non-string/empty/action-like modes, and rejects extra CLI
   arguments.
3. Rust `CodexBridge` fixes the script/binary construction path, accepts only a
   closed optional string `mode`, strictly deserializes the complete status
   object, and rejects any output that violates read-only safety fields.
4. Tests were added for the protected-read boundary, attestation requirement,
   bridge projection, malformed/extra input, and legacy-mode rejection.
5. A closed 16-entry MCP/A2A plan and static loader keep every Cloudflare,
   computer-client, messaging, and proposed peer connection disabled,
   deny-all, and runtime-unverified.

## Verification actually performed

- `node --check` passed for the changed Node modules and their tests.
- `rustfmt --check` passed for the changed Rust bridge and crate export.
- Independent static review identified the defects and reviewed the intended
  fail-closed direction.
- No Node/Rust test suite, compilation, service start, endpoint call, local
  inference, provider call, database, browser smoke, or external action ran.

The repair therefore remains `STATIC_REPAIR_CANDIDATE`. Resource recovery and
the focused test/compile receipts are required before `LOCAL_PASS`.

## Model and framework decisions

- GLM-5.2: official MIT artifacts exist but are hundreds of GB; local adoption
  is rejected for this host.
- Kimi K3: official weights/license are not yet published as of this snapshot;
  artifact adoption is held and an 8 GiB local runtime is rejected.
- Qwen3.5 2B: smallest preferred already-installed unbenchmarked candidate,
  still unadmitted; the observed Ollama client/server revision mismatch and
  capability attestation must be reconciled before a pilot.
- A2A: use the Linux Foundation `a2aproject/A2A` contract and TCK as the future
  conformance baseline; do not install SDKs until an exact revision/license
  packet and resource admission exist.
- Planned policy: retain Codex as the sole source-writing harness, enforced by
  principal attestation, path leases, and write-capability authorization. This
  is not yet proven runtime enforcement. Other apps/models remain proposed
  bounded principals or checkers, not independent authorities.

## Next safe sequence

1. Obtain exact approval for selected local cleanup targets; do not bulk-delete
   caches or models.
2. Re-measure at least 15 GiB free.
3. Run focused Node tests, Rust checks, and the deferred P2.1 suite.
4. Run migrations 0001–0006 on disposable Postgres with split identities and
   negative RLS/concurrency/receipt/restore evidence.
5. Implement and test the Admission Kernel contracts plus migration 0007.
6. Request a bounded local-inference pilot for one exact Qwen artifact.
7. Keep `INSTALL`, `CONNECTOR_ACTIVATION`, `PROVIDER_CALL`, `LIVE_SEND`,
   `QUEUE_MUTATION`, `A2A_EGRESS`, `CLOUDFLARE_MUTATION`, `PUSH`, `MERGE`, and
   `DEPLOY` as separate single-use decisions. The two new action kinds remain
   v2 plan-only until their schema and migration exist.
