# SIRINX Repository Intake Gate v1

Status: `LOCAL_ONLY / REVIEW_EVIDENCE / NO_CLONE / NO_INSTALL`

This document is the evidence target returned by the local Repo Intake Gate in
`services/dev-control-api/src/repo-intake-gate.mjs`. The gate accepts a plain
HTTPS repository URL and produces a review plan. It does not fetch the URL,
clone a repository, install a dependency, run a lifecycle script, start MCP,
read a secret, call a provider, connect a service, send a message, push,
publish, or deploy.

## Required sequence

1. Confirm the publisher-controlled repository or model organization.
2. Read the license file or publisher-controlled model-card license record.
3. Inspect the README, package manifests, lock files, build files, lifecycle
   scripts, binary-download paths, network behavior, and default-enabled tools.
4. Record exact revision, artifact digest, transitive dependency plan, expected
   download and installed footprint, compatible host, rollback, and security
   review.
5. Classify overlap with the existing SIRINX stack. A permissive license does
   not justify a duplicate orchestrator, database plane, API layer, messaging
   framework, or broad mutation server.
6. Stop at reviewed evidence. Clone, install, postinstall, model download,
   activation, OAuth, provider calls, sends, Cloudflare changes, push, merge,
   and deploy each require their own exact authority.

## Closed classifications

| Classification | Meaning |
| --- | --- |
| `REFERENCE_ONLY` | Useful design or protocol evidence; no runtime adoption |
| `RECONCILE_EXISTING` | A local component exists, but its revision/digest/provenance receipt is incomplete |
| `CANDIDATE_RESOURCE_HELD` | Potentially useful and permissively licensed; resource and exact-install evidence are missing |
| `CANDIDATE_AUTHORITY_HELD` | Potentially useful; its connector/effect boundary depends on the shared Authority Kernel |
| `HOLD_PROTOCOL_VERSION` | Source is valid but the required protocol/SDK/TCK versions do not align |
| `HOLD_ARTIFACT_LICENSE` | Publisher artifact or usable license record is absent |
| `QUARANTINE_UNPINNED` | Local bytes exist without an immutable upstream/artifact binding |
| `EXCLUDE_OVERLAP` | Safe default is not to add a competing framework or broad effect surface |
| `REJECT_LOCAL_RESOURCE` | Artifact cannot fit the admitted host envelope |

## Machine-readable intake

The current reviewed portfolio is frozen in:

- `config/agent-runtime/external-components.research-only.v1.json`
- `schemas/agent-runtime/external-component-intake.v1.schema.json`
- `scripts/validate-external-component-intake.mjs`
- `scripts/validate-external-component-intake.test.mjs`

The validator is local and read-only. It binds component membership,
publisher/source identity, license evidence, resource and overlap decisions,
install-wave HOLD state, and false execution proof. It contains no network,
subprocess, environment, database, provider, secret-read, install, or service
activation primitive.

Each complete component object and complete install-wave object has its own
review-pinned semantic SHA-256 in addition to the outer catalog/schema pins.
License/source/provenance/revision/ticket changes and wave membership or
entry-criteria changes therefore require an explicit new review; they cannot be
silently promoted by merely choosing another schema-valid enum value.
The exported validator first rejects non-plain prototypes/`toJSON`, accessors,
symbols, sparse arrays, cycles, and shared object references so object-level
callers cannot mask mutated semantics during hashing. JavaScript `Proxy` values
are rejected before descriptor/property traversal or trap execution.

## Current stop point

`RESEARCH_VERIFIED / NO_CLONE / NO_INSTALL / RESOURCE_HOLD`

The 2026-07-21 sample reports 14,268,520 KiB free on the checkout filesystem,
below the absolute 15 GiB workload floor. No cleanup or install grant exists.
The catalog therefore cannot be treated as an installation queue or live
connection receipt.
