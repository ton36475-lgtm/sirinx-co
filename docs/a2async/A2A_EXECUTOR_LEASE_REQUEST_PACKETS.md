# A2A Executor Lease Request Packets

Status: local-only review packets for lease-required integration rows.

This layer converts the Session Toolkit `integrationReadiness` rows into
reviewable lease request packets. It does not create active leases, acquire
lane locks, execute commands, write connectors, clone repos, start Docker,
call providers, push, deploy, or read secrets.

## Command

```bash
python3 scripts/a2a/a2a_executor_lease_requests.py
```

The command reads:

```text
apps/mission-control/src/fixtures/codexSessionSidebarToolkitStatus.json
```

The command writes runtime-only artifacts:

```text
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/state/executor_lease_requests/
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/executor_lease_requests.json
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/executor_lease_requests.md
```

## Request Types

| Source row                            | Request status            | Meaning                                                                                      |
| ------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------- |
| `opencode-executor-candidate`         | `ready_for_review`        | OpenCode is a candidate executor, but needs a separate lease and lane lock.                  |
| `agy-antigravity2-executor-candidate` | `ready_for_review`        | AGY is a candidate executor, but needs binary verification plus a scoped lease.              |
| `external-git-repo-registry`          | `ready_for_review`        | Repo registry audit can be prepared, but clone/install/service start remain separate lanes.  |
| `connector-sync`                      | `blocked_pending_targets` | Airtable, Linear, Notion, and GitHub target IDs are required before connector write packets. |

## State Boundary

The lease request packet is not an active lease.

```text
Integration Readiness row
-> lease request packet
-> human/operator review
-> active executor lease
-> lane lock
-> dry-run or scoped execution
-> Codex-local review
-> validation
```

Only the `active executor lease` step may create a file under:

```text
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/state/executor_leases/
```

Only the `lane lock` step may create a file under:

```text
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/state/lane_locks/
```

This request packet step writes only:

```text
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/state/executor_lease_requests/
```

## Policy Blocks

- no active lease creation
- no lane lock acquisition
- no command execution
- no connector write
- no provider call
- no repo clone
- no Docker/service start
- no push
- no deploy
- no secret reading

## Next Safe Action

Review `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/executor_lease_requests.md`.
Then choose one request packet and open a dedicated scoped lane if real work is
needed.
