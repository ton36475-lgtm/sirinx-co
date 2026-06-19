# Proof Hierarchy

Status: LOCAL ONLY

## Decision Table

| Status     | Can say                         | Must not say               | Promotion gate                         |
| ---------- | ------------------------------- | -------------------------- | -------------------------------------- |
| UNVERIFIED | This claim exists               | This is true               | Capture source and request evidence    |
| LOCAL      | A local artifact exists         | This is externally proven  | Hash file and create evidence manifest |
| EVIDENCED  | Evidence exists locally         | This is immutable          | Commit or attach Git note              |
| COMMITTED  | Git history anchors it          | It is third-party verified | Push/verify only after approval        |
| EXTERNAL   | External system corroborates it | It is absolute truth       | Complete reproducible chain            |
| PROVEN     | Proven within stated scope      | Proven beyond stated scope | Periodic re-check                      |

## Promotion Checklist

- Claim is written as a falsifiable statement.
- Evidence path exists.
- Evidence hash is recorded.
- Timeline event links claim and evidence.
- Approval gate is clear.
- External status is not claimed from local files only.

## Demotion Triggers

- Evidence file missing.
- Hash mismatch.
- Source path moved without redirect entry.
- External record cannot be re-verified.
- Claim wording exceeds evidence scope.
