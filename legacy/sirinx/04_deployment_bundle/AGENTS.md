# AGENTS.md — SIRINX Canonical Continuation

Read `../AGENTS.md` and `../packages/policies/*.md` first. This file narrows those workspace rules to the SIRINX canonical repo.

## Project Overview

SIRINX is the governed canonical repository for:

- the public revenue plane website
- the internal control plane and Omniscient Dashboard scaffold
- the handoff bundle and Data Center upload lane
- the multi-agent contract layer
- the design lane and server-ready hold workflow

Continue the existing implementation safely and deterministically until `SERVER-READY HOLD MODE`.

- do not start a parallel project
- do not rebuild from scratch
- do not import unrelated brands, funnels, gambling flows, or growth stacks into SIRINX

## Canonical Writer Rule

- writer repo: this repository
- reference-only input: `C:\Users\Ton36\Downloads\sirinx-main`
- patch here first
- harvest from reference folders only when needed
- once the writer repo is chosen, stop broad repo scanning

## Canonical Roles

Core workflow:

1. Hermes Orchestrator
- routes tasks only
- does not calculate ROI
- does not write marketing copy
- outputs routing JSON only

2. Cyber-Physical Analyst
- processes ROI, telemetry, TOU assumptions, and field hardware context
- does not write brand copy
- outputs structured analysis only

3. Sovereign Creator
- transforms validated analysis into executive-ready communication
- does not alter numbers or assumptions
- outputs structured narrative only

4. Validator Agent
- checks schemas, file existence, locked facts, and bundle completeness
- does not create new facts

5. Delivery Agent
- builds the deployment and handoff bundle
- must not claim completion unless required files physically exist on disk

Support lanes:

- Design Prototyper = design-lane packet authoring and Claude-ready prototype handoff
- Database Steward = PostgreSQL/pgvector/backup-readiness support lane
- Mentor / Apprentice = packet-driven junior-agent enablement, never a privilege bypass

## Read First

Before significant edits, refresh these files:

- `governance/LOCKED_BUSINESS_FACTS.md`
- `governance/SIRINX_FINAL_ARCHITECTURE_BLUEPRINT.md`
- `governance/CUSTOM_AI_FRAMEWORK_ARCHITECTURE.md`
- `governance/OMNISCIENT_DASHBOARD_ARCHITECTURE.md`
- `governance/FIELD_VALIDATED_HARDWARE_CONTEXT.md`
- `knowledge/shadow-vault/HARDWARE_TELEMETRY_PROTOCOL.md`
- `knowledge/shadow-vault/BRAIN_SKILL_BOOTSTRAP_PROTOCOL.md`
- `docs/migration/PRODUCTION_READINESS_CHECKLIST.md`
- `docs/migration/SERVER_HANDOFF_FINAL.md`
- `docs/design/CLAUDE_DESIGN_WORKFLOW.md`
- `ORCHESTRATION_SCHEMA.json`
- `MULTI_AGENT_SYSTEM_PROMPTS.md`

## Setup Commands

- `corepack pnpm install`
- `copy .env.example .env.local`
- `powershell -NoProfile -ExecutionPolicy Bypass -File .\infra\scripts\build-source-snapshot.ps1`

Use local-only env files for recovery or staging; never commit live secrets.

## Test Commands

- `corepack pnpm run check`
- `corepack pnpm run test`
- `corepack pnpm run build`
- `docker compose -f docker-compose.yml config`

## Validation Commands

- `python infra/scripts/validate-agent-contracts.py`
- `C:\Program Files\Git\bin\bash.exe infra/scripts/validate-real-files.sh`
- `C:\Program Files\Git\bin\bash.exe infra/scripts/validate-json-schemas.sh`
- `C:\Program Files\Git\bin\bash.exe infra/scripts/validate-sirinx-facts.sh`
- `C:\Program Files\Git\bin\bash.exe infra/scripts/validate-handoff-bundle.sh`
- `powershell -NoProfile -ExecutionPolicy Bypass -File .\infra\scripts\build-handoff-bundle.ps1`
- `powershell -NoProfile -ExecutionPolicy Bypass -File .\infra\scripts\full-system-review.ps1`
- `C:\Program Files\Git\bin\bash.exe infra/scripts/ultimate-validator.sh`

## Locked SIRINX Facts

- Brand: `SIRINX`
- Slogan: `Clean Tech • Smart Future`
- Thai headline: `หยุดจ่ายค่าไฟทิ้งทิ้ง... แล้วเปลี่ยนหลังคาให้เป็นสินทรัพย์`
- Thai footer: `เปลี่ยนค่าใช้จ่าย ให้เป็นการลงทุนที่สร้างผลตอบแทน`
- Global package truth must remain exactly as defined in `governance/LOCKED_BUSINESS_FACTS.md`

Never mutate locked facts outside an approval packet.

## Design-Lane Rules

- design outputs must remain packet-driven and fact-locked
- premium Track Record imagery must stay real-world and permission-aware
- no design artifact may mutate package truth, ROI status, or field-context boundaries
- Claude Design or similar design export ZIPs are input only; Codex patches canonical source here
- `apps/web/` is a staging surface for design imports, not a second runtime

## Local LLM Rules

- local LLMs may be used for offline drafting, summarization, or internal-first content generation only
- no local LLM output becomes fact, legal approval, ROI claim, or package truth automatically
- all local LLM outputs are untrusted until validated and routed through contracts
- redact customer data and avoid injecting production secrets into any local LLM flow

## Multi-Agent Handoff Rules

- all inter-agent handoffs must be JSON-backed
- `ORCHESTRATION_SCHEMA.json` and `schemas/*.schema.json` define the canonical payload boundary
- design lane handoff must use `schemas/design_prototyper_payload.schema.json` and `schemas/design_to_creator_payload.schema.json`
- Validator must set `handoff_ready=true` before Delivery claims completion
- Mentor/Apprentice packets must never bypass Validator or Delivery

## Forbidden Artifacts

- `node_modules/`
- plaintext `.env`
- `secrets/`
- keystores
- `dist/`, caches, temp folders, or generated junk
- unrelated CHOKMA/gambling/casino/lottery artifacts

## Patch-Before-Replace Rule

- patch before replace
- avoid duplicate governance artifacts describing the same active truth
- historical docs must be marked clearly and excluded from the final handoff bundle

## No Fake Completion Rule

Do not claim handoff-ready unless:

- required files exist physically on disk
- required files are non-empty
- JSON schemas parse successfully
- referenced scripts and docs actually exist
- the bundle contains real files, not missing references
- validation scripts pass or the exact blocker is recorded

## Real-File Validation Rule

Every confirmed bug or drift fix must include:

- regression test or validation gate
- rule or pattern update
- prompt or system update when relevant
- future prevention note in `.ops/audit/CONTINUATION_AUDIT.md`

## Handoff Discipline

- final handoff bundle lives in `04_deployment_bundle/`
- the bundle must contain real files, not references to missing artifacts
- `04_deployment_bundle/MANIFEST.md`, `MANIFEST.json`, and `CHECKSUMS.SHA256.txt` must all exist after bundle generation
- no plaintext secrets, `.env`, keystores, caches, `node_modules`, or junk artifacts may enter the bundle

## Allowed Autonomous Work

Codex may autonomously:

- patch UI, internal admin scaffolds, and read-only ops dashboards
- patch governance docs, policies, validators, contracts, schemas, skills, and handoff artifacts
- patch Docker Compose templates, durability docs, and non-secret infra scripts
- run deterministic checks, tests, builds, dry validations, and bundle refreshes
- mark historical docs as historical and keep them out of the final bundle

## Guardrails

- brand truth comes from `governance/LOCKED_BUSINESS_FACTS.md`
- package truth comes from canonical governance docs only
- LISINER, Solis EMS, and similar vendor observations remain field context unless formally promoted
- ROI examples such as 250k THB to 50k-70k THB must be treated as scenario/model language, not universal guarantees
- `ops.sirinx.co` is internal-only, premium graphite/gold, and must reject cartoon/anime/gacha aesthetics
- mobile control is read-only by default
- no gambling, CHOKMA, casino, lottery, baccarat, or betting content may enter the runtime or handoff bundle
- no deployment, DNS, TLS, secret injection, or production cutover without approval

## Nested AGENTS

Use the nearest nested `AGENTS.md` for scoped work:

- `apps/web/AGENTS.md`
- `client/AGENTS.md`
- `server/AGENTS.md`
- `infra/AGENTS.md`
- `knowledge/AGENTS.md`
- `governance/AGENTS.md`
- `docs/AGENTS.md`
- `docs/design/AGENTS.md`
- `schemas/AGENTS.md`
- `tests/AGENTS.md`
- `.ops/AGENTS.md`

## Stop Condition

Stop at `SERVER-READY HOLD MODE` unless the user provides explicit deployment authorization and approved server access details.
