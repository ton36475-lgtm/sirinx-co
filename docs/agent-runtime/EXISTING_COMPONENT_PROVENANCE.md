# Existing Component Provenance — Wave 0

Status: `PROVENANCE_VALIDATED_NOT_ADMITTED`

This packet reconciles six components that were already present on the Mac mini
before any new install wave. It is a read-only artifact inventory, not an
activation, health check, install receipt, provider connection, or production
readiness claim.

## Canonical files

- [`existing-components.provenance.v1.json`](../../config/agent-runtime/existing-components.provenance.v1.json)
- [`existing-component-provenance.v1.schema.json`](../../schemas/agent-runtime/existing-component-provenance.v1.schema.json)
- [`validate-existing-component-provenance.mjs`](../../scripts/validate-existing-component-provenance.mjs)
- [`validate-existing-component-provenance.test.mjs`](../../scripts/validate-existing-component-provenance.test.mjs)
- [`existing-component-provenance-20260721.md`](../../reports/runtime/existing-component-provenance-20260721.md)

The packet is a child of the A29 external-component catalog. The validator
pins the exact parent catalog, schema, and validator bytes so Wave 0 cannot
silently reinterpret the research intake.

## What was reconciled

| Component | Local evidence ceiling | Remaining disposition |
| --- | --- | --- |
| OpenAI Codex CLI | npm manifests, PATH symlink, JS launcher, native arm64 binary, and ChatGPT-app alternate are byte-bound | reuse candidate; upstream release/install receipt unresolved |
| Hermes Agent | wrapper, venv entrypoint, distribution metadata, editable receipt, record, and entry module are byte-bound | held: editable source is dirty and unpinned |
| Kimi Code | npm manifest, PATH symlink/bundle, and the alternate Homebrew-path file are byte-bound | reuse candidate; alternate file is a test stub, not Kimi |
| Axum | `Cargo.lock` plus exact cached `axum` and `axum-core` archives | reuse candidate; no fresh build/admission |
| SQLx | `Cargo.lock` plus exact cached PostgreSQL-side SQLx archives | held: catalog publisher/source disagrees with package metadata |
| Qwen3.5 2B local | Ollama manifest and all four content-addressed blobs are full-file verified | quarantine: local bytes are not bound to an upstream revision/conversion receipt |

## Closed read scope

The canonical validator accepts exactly 26 artifact paths. It rejects an
unknown, reordered, duplicated, symlink-drifted, size-drifted, mode-drifted,
or digest-drifted artifact. Caller-supplied paths are not accepted. In
particular, the packet preserves the literal protected-read boundary for env
files, Hermes auth/config, browser profiles, cookies, keychains, and raw
tokens.

The Qwen model blob is hashed in bounded 1 MiB chunks so the 2.74 GB file is
not loaded into memory. Hashing reads the file only; it does not start Ollama
or invoke the model.

## Run the local verifier

```bash
npm run existing-provenance:validate
npm run existing-provenance:test
```

Expected terminal state:

```text
PROVENANCE_VALIDATED_NOT_ADMITTED
RECONCILIATION_PACKET_REVIEWED_NOT_ACTIVATED
```

The validator has no subprocess, network, environment, database, provider,
message, or write primitive. Fourteen focused tests cover canonical file proof,
strict schema shape, duplicate keys, authority/proof promotion, component and
artifact drift, Cargo checksum drift, capture-section drift, protected-boundary
narrowing, full permission bits, bounded nesting, Proxy/accessor rejection,
and source/race-defense scanning.

## Truth ceiling

What this proves:

- the recorded local bytes, modes, sizes, symlink targets, and selected
  `Cargo.lock` records matched the frozen packet at validation time;
- no component is admitted or authorized to run/connect;
- the resource receipt remains `HOLD_BELOW_15_GIB`.

What this does not prove:

- upstream publisher identity, tag ownership, install transaction, clean
  source tree, reproducible build, vulnerability posture, or current runtime
  health;
- MCP/A2A/Claude/Kimi/Hermes/Telegram/LINE connectivity;
- model safety, quality, or upstream lineage;
- permission to install, repair, replace, start, invoke, connect, send, push,
  merge, deploy, or mutate Cloudflare/database state.

Branch, HEAD, dirty-worktree, Hermes Git status, and free-disk values are
capture-time observations frozen into the packet. The canonical validator does
not run Git or a disk probe; those observations require an independent fresh
read-back when used operationally.

Wave 0 stops here until a separate exact authority ticket, resource admission,
and independent checker receipt exist.
