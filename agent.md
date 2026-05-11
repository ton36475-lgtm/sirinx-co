# SIRINX OS Agent Entry

Use this file as the short entrypoint for Codex, Hermes, Gemini, Claude Code, and local agents.

## Current PR

```text
PR-MONO-001: repo inventory and quarantine
```

## Mission

Create the canonical monorepo control plane for SIRINX OS while keeping every dangerous action behind approval gates.

## Commands

```bash
npm run check
npm run verify:mono-001
```

## Source of Truth

- Governance: `AGENTS.md`
- Current state: `PROJECT_STATE.md`
- Next actions: `NEXT_ACTIONS.md`
- Repo inventory: `REPO_AUDIT_AND_MERGE_MAP.md`
- Quarantine: `SECURITY_QUARANTINE_REPORT.md`

## Stop Boundary

Stop before push, deploy, cloud mutation, real external send, paid API, production DB write, or public internal exposure.
