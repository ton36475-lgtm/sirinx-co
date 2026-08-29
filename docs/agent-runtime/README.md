# SIRINX Agent Runtime Contracts

This folder is the operating design for the 47-role agent manager. These files
are additive contracts; they do not start agents, schedules, providers,
connectors, or external actions.

- [`47_ROLE_MANAGER_ARCHITECTURE.md`](47_ROLE_MANAGER_ARCHITECTURE.md) — role,
  scheduler, state, lease, and API architecture.
- [`BACKGROUND_TASK_HARNESS.md`](BACKGROUND_TASK_HARNESS.md) — disabled
  background-task plan and verification harness.
- [`AGENTIC_AI_MANAGEMENT.md`](AGENTIC_AI_MANAGEMENT.md) — runtime principal,
  budget, routing, observability, and panic rules.
- [`PROVIDER_MODEL_ADMISSION.md`](PROVIDER_MODEL_ADMISSION.md) — exact model,
  provider, resource, license, effect, and ticket admission rules.
- [`MCP_A2A_CONNECTION_PLAN.md`](MCP_A2A_CONNECTION_PLAN.md) — disabled
  Cloudflare MCP, local-client, A2A peer, Telegram, and LINE connection plan.
- [`LEGACY_GHOSTCLAW_CONTRACT_CROSSWALK.md`](LEGACY_GHOSTCLAW_CONTRACT_CROSSWALK.md)
  — reconciles current Rust, JS, Claude, Hermes, GhostClaw, and A2A views.
- [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) — staged delivery and proof
  gates.
- [`SPAWN_PLAYBOOK.md`](SPAWN_PLAYBOOK.md) — bounded team shapes, spawn
  prerequisites, waves, and completion handling.

Machine-readable schemas live in `schemas/agent-runtime/`; the proposed
background schedules and connection plans live in `config/agent-runtime/` with
`enabled: false`.
The bounded local invariant checker is
`scripts/validate-ronin-role-registry.mjs`.
