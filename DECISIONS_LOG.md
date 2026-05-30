# Decisions Log

## 2026-05-30: Monorepo Unification
- **Status**: Approved
- **Context**: Decided to unify all legacy repositories into a single monorepo (`sirinx-agent-native-os`) to coordinate agent interactions, ensure common dependency versions, and maintain absolute safety gates.
- **Decision**: Mac mini M2 locked as local-first control node. No cloud deploy or push authorized until Part 8 Approval is granted.

## 2026-05-30: AI Access Gateway Extraction
- **Status**: Approved
- **Context**: Vetted the legacy `Gemma4Client` Axios client containing story generation APIs and compliance check schemas, quarantined under automated mobile repository logs.
- **Decision**: Modularized it as a clean local ESM package `@sirinx/ai-access-gateway` to separate AI integrations from core logic, enforcing local-only API endpoints (`http://localhost:8000`).

## 2026-05-31: OpenClaw & OpenHands Adapter Extractions
- **Status**: Approved
- **Context**: Decided to isolate external agent-worker orchestration boundaries (OpenClaw and OpenHands) from core business logic into dedicated packages.
- **Decision**: Refactored the quarantined logic into `@sirinx/openclaw-adapter` and `@sirinx/openhands-adapter` with full process execution guards and sandboxed fallback runtimes.

## 2026-05-31: Mission Control Client-Side Package Linkage
- **Status**: Approved
- **Context**: Decided to visually and operationally link the front-end dashboard directly to our compiled local workspace packages.
- **Decision**: Declared dependencies on all extracted adapter clients, adding reactive console panels (routing diagrams, compliance score indexes, and shell sandbox command histories) to verify package functions directly.
