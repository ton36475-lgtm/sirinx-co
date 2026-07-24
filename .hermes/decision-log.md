# Decision Log

- 2026-05-27: Cloudflare dev plan approved local-only
- 2026-07-20: A26 Connection Evidence Admission Preview accepted only as a
  static non-authoritative HOLD contract. Candidate context/clock/DNS/replay
  remain blockers; no server route or live MCP/A2A/messaging integration may
  interpret `EVIDENCE_VALIDATED_NOT_ADMITTED` as readiness.
- 2026-07-20: A27 B10.0 accepted only as a static all-HOLD contract manifest
  and pure negative preview. The generic v2 receipt is pinned to the manifest
  and A26 plan; migration 0007 and all durable authority/executor work remain
  deferred. Existing action/A2A/Telegram compatibility paths are not promoted.
