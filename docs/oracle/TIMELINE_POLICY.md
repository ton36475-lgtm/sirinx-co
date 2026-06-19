# Timeline Policy

Status: LOCAL ONLY

## Rule

Every important project claim, correction, design decision, and approval packet
must be append-only. Corrections create new events.

## Event Shape

```text
event_id
title
occurred_at
recorded_at
claims
evidence_refs
proof_status
git refs, if any
external refs, if any
```

## Files

```text
vault/timeline/index.md
vault/timeline/2024.md
vault/timeline/2025.md
vault/timeline/2026.md
```

## Query Goal

Any major decision should be reconstructable in under 10 minutes from timeline,
evidence, memory index, and Git references.
