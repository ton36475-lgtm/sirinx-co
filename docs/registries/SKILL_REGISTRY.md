# Skill Registry

This database registers and catalogs all active developer and execution skills available within the **sirinx-agent-native-os** monorepo worker layer.

All skills are quarantined locally and subject to local-first verification gates.

---

## 1. AGENTS_MD_REPO_GOVERNANCE_SKILL

- **Scope**: Governance / Registry Control
- **Purpose**: Governs markdown documentation, logs, Decisions log, and project state updates.
- **Legacy Source**: `legacy/sirinx/skills/AGENTS_MD_REPO_GOVERNANCE_SKILL.md`
- **Verification Gate**: Level 0 Read-Only

## 2. DESIGN_PROTOTYPER_SKILL

- **Scope**: Front-end / UI Design
- **Purpose**: Formulates Claude-ready CSS/HTML UI prompts and designs components cleanly.
- **Legacy Source**: `legacy/sirinx/skills/DESIGN_PROTOTYPER_SKILL.md`
- **Verification Gate**: Level 1 Local Skeleton

## 3. LOCAL_LLM_OFFLINE_DRAFTING_SKILL

- **Scope**: Development / Coding
- **Purpose**: Directs offline code generation, module configurations, and code drafting via local Ollama.
- **Legacy Source**: `legacy/sirinx/skills/LOCAL_LLM_OFFLINE_DRAFTING_SKILL.md`
- **Verification Gate**: Level 2 Local Validation

## 4. MULTI_AGENT_JSON_HANDOFF_SKILL

- **Scope**: Architecture / Coordination
- **Purpose**: Establishes strict JSON handoff boundaries between worker layers (e.g. Codex -> thClaws).
- **Legacy Source**: `legacy/sirinx/skills/MULTI_AGENT_JSON_HANDOFF_SKILL.md`
- **Verification Gate**: Level 2 Local Validation

## 5. N8N_QUEUE_MODE_SKILL

- **Scope**: Automation / Workflows
- **Purpose**: Orchestrates asynchronous event workflows in safe sandbox modes locally.
- **Legacy Source**: `legacy/sirinx/skills/N8N_QUEUE_MODE_SKILL.md`
- **Verification Gate**: Level 3 Local Preview

## 6. OPENTELEMETRY_OBSERVABILITY_SKILL

- **Scope**: Metrics / Monitoring
- **Purpose**: Standardizes local traces, telemetry statistics, and execution log collection.
- **Legacy Source**: `legacy/sirinx/skills/OPENTELEMETRY_OBSERVABILITY_SKILL.md`
- **Verification Gate**: Level 0 Read-Only

## 7. PGVECTOR_RAG_MEMORY_SKILL

- **Scope**: Data / Memory
- **Purpose**: Manages pgvector embedding and local semantic search indexing for knowledge sync.
- **Legacy Source**: `legacy/sirinx/skills/PGVECTOR_RAG_MEMORY_SKILL.md`
- **Verification Gate**: Level 2 Local Validation

## 8. PLAYWRIGHT_E2E_VALIDATION_SKILL

- **Scope**: Testing / QA
- **Purpose**: Performs local browser E2E checks and captures dashboard screenshots without network leaks.
- **Legacy Source**: `legacy/sirinx/skills/PLAYWRIGHT_E2E_VALIDATION_SKILL.md`
- **Verification Gate**: Level 2 Local Validation

## 9. REAL_FILE_VALIDATION_SKILL

- **Scope**: Compiler / Integrity
- **Purpose**: Verifies that new code compiles cleanly with strict TypeScript configurations.
- **Legacy Source**: `legacy/sirinx/skills/REAL_FILE_VALIDATION_SKILL.md`
- **Verification Gate**: Level 2 Local Validation

## 10. SERVER_HANDOFF_BUNDLE_SKILL

- **Scope**: Evidence / Manifest
- **Purpose**: Generates local delivery manifests, verification snapshots, and packages evidence folders.
- **Legacy Source**: `legacy/sirinx/skills/SERVER_HANDOFF_BUNDLE_SKILL.md`
- **Verification Gate**: Level 4 Internal Lab

---

## External Candidate Registry: Mercury Skills

- **Status**: Read-only clone, triage complete, first-batch repo-local vendor
  snapshot imported.
- **Source**: `https://github.com/cosmicstack-labs/mercury-agent-skills.git`
- **Local Path**: `tools/repo-intake/2026-06-06/mercury-agent-skills`
- **Evidence**:
  `outputs/evidence/mercury-skills/2026-06-06-readonly-clone/`
- **Upstream README Count**: 130 skills across 23 categories.
- **Local Scan Count**: 132 `SKILL.md` files under 23 category directories.
- **Next Gate**:
  `APPROVE_MERCURY_SKILLS_IMPORT_TO_HERMES_LIVE_LOCAL_ONLY`
- **Blocked**: Mercury Agent install, `mercury skills install`, and copying
  third-party skills into Hermes/Codex/Claude/OpenClaw skill directories.

### Safe-Import Triage Result

- **Status**: Triage complete, no import performed.
- **Evidence**:
  `outputs/evidence/mercury-skills/2026-06-06-safe-import-triage/`
- **Result**: 132 total skills scanned; 20 safe-import candidates, 88 review
  required, 24 blocked for import.
- **Suggested first batch**:
  - `development/refactoring-patterns`
  - `frontend/frontend-testing`
  - `frontend/responsive-design`
  - `testing-qa/performance-testing`
  - `product/user-research`

### First-Batch Repo-Local Import Result

- **Status**: Completed as vendor snapshot only.
- **Destination**: `vendor/mercury-first-batch/`
- **Manifest**: `vendor/mercury-first-batch/manifest.json`
- **Evidence**:
  `outputs/evidence/mercury-skills/2026-06-07-first-batch-import/`
- **Live agent import**: Not performed.
- **Blocked**: Mercury Agent install, Mercury CLI execution, bulk import, live
  Hermes/Codex/Claude/OpenClaw skill directory mutation, provider call, deploy,
  push, public tunnel, external mutation.
