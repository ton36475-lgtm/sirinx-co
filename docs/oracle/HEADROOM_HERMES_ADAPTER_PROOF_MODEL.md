# Headroom-to-Hermes Adapter Proof Model

Status: LOCAL SPEC - WAITING FOR ADAPTER PROTOTYPE APPROVAL

## Claim

Headroom can support SIRINX proof-linked memory only when compression metrics
and source references are stored alongside the original evidence path. It must
not replace the original evidence.

## Proof Boundary

Headroom compressed previews can support:

- reviewer ergonomics
- token savings measurement
- local evidence summaries

They cannot support by themselves:

- source immutability
- external verification
- production readiness
- Part 8 approval

## Evidence Inputs

| Input               | Role                                    |
| ------------------- | --------------------------------------- |
| original local file | source of truth                         |
| compressed preview  | reviewer-friendly derived artifact      |
| metrics JSON        | token and transform evidence            |
| hash manifest       | proves original and preview file states |
| timeline event      | links compression to project memory     |

## Promotion Rule

| From       | To        | Required                                               |
| ---------- | --------- | ------------------------------------------------------ |
| UNVERIFIED | LOCAL     | adapter spec exists                                    |
| LOCAL      | EVIDENCED | preview + metrics generated from explicit source file  |
| EVIDENCED  | COMMITTED | source, preview, metrics, and manifest anchored in Git |
| COMMITTED  | EXTERNAL  | external verification if approved                      |
| EXTERNAL   | PROVEN    | reproducible evidence chain documented                 |

## Blocked Language

- Do not say "source compressed safely" unless original is preserved.
- Do not say "PROVEN" from compression alone.
- Do not say "ready to route Hermes live" from this spec.
- Do not say "no information loss" for lossy compression.

## Required Labels

Compressed artifacts must include:

```text
DERIVED_ARTIFACT=true
SOURCE_OF_TRUTH=<original path>
PROVIDER_CALL=false
PROXY_STARTED=false
SOURCE_OVERWRITTEN=false
```

## Timeline Event Template

```text
event_id: te-YYYYMMDD-headroom-compression-<lane>
title: Headroom compressed preview generated
proof_status: EVIDENCED
claims:
  - A local evidence file was compressed into a derived preview.
  - Original file remained the source of truth.
evidence_refs:
  - ev-YYYYMMDD-headroom-preview
  - ev-YYYYMMDD-headroom-metrics
```
