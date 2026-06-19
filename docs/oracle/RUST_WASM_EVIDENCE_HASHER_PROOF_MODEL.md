# Rust/Wasm Evidence Hasher Proof Model

Status: LOCAL SPEC - WAITING FOR PROTOTYPE APPROVAL

## Claim

A deterministic local hash manifest can promote an evidence packet from
`LOCAL` toward `EVIDENCED`, provided the manifest links file paths, hashes,
timestamp, tool version, and proof status without claiming external
immutability.

## Proof Boundary

The Rust/Wasm Evidence Hasher can support:

- `LOCAL`
- `EVIDENCED`

It cannot support by itself:

- `COMMITTED`
- `EXTERNAL`
- `PROVEN`

Those require Git anchoring, external verification, or a complete evidence
chain.

## Evidence Inputs

| Input                | Role                       |
| -------------------- | -------------------------- |
| evidence packet root | source file set            |
| ignore list          | reproducibility boundary   |
| generated manifest   | hash evidence              |
| generated summary    | reviewer-readable evidence |
| timeline event       | project memory link        |
| claims entry         | claim-to-evidence link     |

## Promotion Rule

| From       | To        | Required                                         |
| ---------- | --------- | ------------------------------------------------ |
| UNVERIFIED | LOCAL     | evidence packet path exists                      |
| LOCAL      | EVIDENCED | manifest generated and schema-valid              |
| EVIDENCED  | COMMITTED | commit, Git note, or signed tag anchors manifest |
| COMMITTED  | EXTERNAL  | approved external verification                   |
| EXTERNAL   | PROVEN    | reproducible chain documented                    |

## Blocked Language

- Do not say "immutable" from a local manifest.
- Do not say "GitHub verified" from a local hash.
- Do not say "PROVEN" without commit/external chain.
- Do not say "safe to publish" from hash verification alone.

## Failure States

| Verification Result | Meaning                         | Next Action                              |
| ------------------- | ------------------------------- | ---------------------------------------- |
| PASS                | all tracked hashes match        | retain `EVIDENCED`                       |
| MISSING             | tracked file no longer exists   | create correction event                  |
| CHANGED             | tracked file hash changed       | create correction event and new manifest |
| EXTRA               | untracked file found under root | classify whether new evidence belongs    |
| ERROR               | root/schema/tool error          | keep previous proof status               |

## Timeline Event Template

```text
event_id: te-YYYYMMDD-evidence-hasher-<lane>
title: Evidence hash manifest generated
proof_status: EVIDENCED
claims:
  - Evidence packet files were hashed locally.
  - Manifest was generated from an explicit root.
evidence_refs:
  - ev-YYYYMMDD-hash-manifest
  - ev-YYYYMMDD-hash-summary
```
