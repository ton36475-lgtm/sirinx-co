# Monorepo Target Tree

This is the planned canonical target tree. Empty directories are not created until their first safe PR imports a README, package, or code.

```text
sirinx-co/
├── AGENTS.md
├── agent.md
├── README.md
├── PROJECT_STATE.md
├── NEXT_ACTIONS.md
├── NODE_TOPOLOGY.md
├── MAC_CONTROL_PLANE.md
├── WINDOWS_WORKER_NODE.md
├── NETWORK_PORT_MAP.md
├── CLOUDFLARE_EDGE_PLAN.md
├── CLOUDFLARE_ACCESS_POLICY.md
├── PUBLIC_WEBSITE_GO_LIVE_CHECKLIST.md
├── MAC_HANDOFF_CHECKLIST.md
├── RELEASE_GATE.md
├── VALIDATION_MATRIX.md
├── ALPHA_VERIFICATION_REPORT.md
├── REPO_AUDIT_AND_MERGE_MAP.md
├── MIGRATION_SEQUENCE.md
├── SECURITY_QUARANTINE_REPORT.md
├── MOBILE_COMMAND_CENTER_SCHEMA.md
├── ALL_DEVICE_TOPOLOGY.md
├── NODE_HEARTBEAT_SCHEMA.md
├── EMERGENCY_STOP_RUNBOOK.md
├── apps/
├── services/
├── mcp/
├── packages/
├── infra/
├── docs/
├── security/
├── devtools/
├── workflows/
├── prompts/
├── kms/
├── research/
├── memory/
├── scripts/
└── tests/
```

## First Import Targets

1. `apps/web-sirinx` or `apps/web-opal`
2. `apps/dev-dashboard`
3. `services/dev-control-api`
4. `apps/mobile-command`

## Rule

No legacy directory is copied wholesale until its quarantine report is accepted.
