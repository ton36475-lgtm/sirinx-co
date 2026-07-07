# SIRINX/GHOSTCLAW Engineering Constitution

Version: 1.0
Scope: OpenCode / Codex / AI agents working on SIRINX ecosystem

## 0. Workflow Architecture

This project uses an **ai-auto-work** pattern: dual-model orchestration with OpenCode as executor and Codex as adversarial reviewer.

- **OpenCode (Executor)**: coding, fixing, testing
- **Codex (Reviewer)**: adversarial review via `codex-cli` MCP tools (concurrency, edge cases, security)
- **Quality Gate**: compile + tests must pass before review
- **Convergence Loop**: OpenCode fixes → Codex reviews → repeat until Critical=0, High≤2

## 1. Simplicity First

- Implement only what requirements explicitly ask
- Use existing dependencies first; avoid premature abstraction
- No new languages for single-point needs without documented justification

## 2. Local-First & Security

- No deploy, push, or publish without explicit approval
- Never commit secrets, .env values, tokens, private keys
- SIRINX_LINE_MODE must stay dry-run unless explicitly overridden
- LINE production traffic goes through sirinx.co/api/line/webhook only

## 3. Quality Gates

- Compile must pass before any review cycle
- Tests must pass (unit + smoke + build)
- Codex review must find 0 Critical, ≤2 High issues
- No gate bypass: all checks run before review-input lands

## 4. Atomic Scope

- One task = one commit (≤3 files / ≤100 lines)
- Each task in isolation; handoff via files only
- Systematic errors update `.ai/` shared knowledge, not just code

## 5. Review Culture

- Codex audits for: concurrency races, resource leaks, edge cases, security
- All CRITICAL/HIGH findings must be resolved before next iteration
- Each iteration log tracks previous review disposition

## 6. Conflict Resolution

1. This constitution and `.ai/constitution/*.md`
2. `.ai/context/project.md` and shared architecture docs
3. Agent-specific runtime files (`.claude/`, `.codex/`)
