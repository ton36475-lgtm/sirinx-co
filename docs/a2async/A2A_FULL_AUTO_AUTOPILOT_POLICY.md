# A2A Full Auto Autopilot Policy

A2A Sync v2 runs under the broader GHOSTCLAW Full Auto policy, but first-phase
scaffolding remains dry-run and local-only.

## Auto-Allowed in This Phase

- Create docs, agent cards, registry files, policy files, and local scripts.
- Create runtime directories under `~/SIRINXDev/.ghostclaw_runtime/a2async/`.
- Run syntax checks.
- Generate task manifests and dry-run command plans.

## Policy-Blocked in This Phase

- External API calls.
- Provider smoke tests.
- Docker start.
- Service start.
- Public endpoint exposure.
- Repo clone until the clone phase is explicitly run.
- Real KOB/Codex execution through a provider.
- Push, deploy, publish, or connector activation.
- Secret reading or printing.

## Runtime Gate

Real work is unlocked only by policy and adapter validators. Until then,
adapters should produce command plans instead of mutating external systems.
