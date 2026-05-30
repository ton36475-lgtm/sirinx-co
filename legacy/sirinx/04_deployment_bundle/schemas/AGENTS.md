Read `../AGENTS.md` first.

Scope: JSON schemas for orchestration, design lane, audit events, retrieval, validation, and delivery.

Rules:
- schemas must remain valid JSON
- one active schema per payload type
- patch existing schemas instead of creating drifted duplicates
- schema changes must be followed by parser validation and validator updates
