# Emergency Stop Runbook

Status: planning runbook.

## When To Use

Use emergency stop when a job attempts to:

- push without approval
- deploy without approval
- mutate Cloudflare without approval
- expose internal services
- send customer messages unexpectedly
- trigger paid APIs unexpectedly
- write production data unexpectedly

## Immediate Actions

1. Stop the current agent/process.
2. Stop local tunnel process if running.
3. Disable queued external actions.
4. Preserve logs.
5. Record the event in `PROJECT_STATE.md`.
6. Open a repair branch only after reviewing the failure.

## Cloudflare Rollback

Preview only for PR-MONO-001:

```text
cloudflared tunnel route dns delete <hostname>
cloudflared tunnel cleanup office-brain
```

Do not run these commands without approval.

## Git Rollback

Use non-destructive rollback first:

```text
git status
git restore --staged <file>
```

Do not use destructive resets unless explicitly approved.
