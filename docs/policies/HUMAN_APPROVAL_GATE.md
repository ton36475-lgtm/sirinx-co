# Human Approval Gate Rules

Status: legacy compatibility.

The Part 8 human gatekeeping process is retained as history and for old
evidence packets. The active model is now full-auto Autopilot:

```text
Goal -> Autopilot Router -> Policy Engine -> Execution Lease -> Execute -> Verify -> Retry/Rollback -> Audit -> Memory
```

Use these files for new work:

- `docs/autopilot/FULL_AUTO_SYSTEM.md`
- `docs/autopilot/AUTOPILOT_POLICY_SPEC.md`
- `docs/autopilot/EXECUTION_LEASE_SPEC.md`
- `policies/autopilot_policy.yaml`

Old approval language should be migrated to:

- approval packet -> job manifest
- approval token -> execution lease
- pending approval -> policy blocked / quarantined / auto execute
