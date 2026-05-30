Read `../../AGENTS.md` first.

Scope: imported design exports, web-facing prototype handoff packets, and future monorepo migration staging.

Rules:
- this folder is a staging surface, not a second live runtime
- canonical web runtime remains in `client/` until explicitly migrated
- imported ZIP exports must be normalized into canonical repo files, not served from here directly
- preserve locked SIRINX facts and Track Record media rules
- no placeholder designs in final server handoff without clear draft labeling
