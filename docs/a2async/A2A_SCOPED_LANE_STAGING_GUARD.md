# A2A Scoped Lane Staging Guard

Status: local-only staging review guard.

The scoped lane staging guard creates a read-only report before any Git staging
decision. It exists because the GHOSTCLAW worktree can contain many unrelated
dirty lanes, including generated distribution assets. The guard does not stage,
commit, push, deploy, clone repositories, call providers, or alter policy.

## Current Lane

The first registered lane is:

```text
codex-command-broker-mission-control
```

It covers the Codex Command Broker, the Mission Control read-only broker panel,
the broker status fixture, and the validator scripts that support operator
review.

The lane manifest is stored in:

```text
policies/a2a_scoped_lanes.json
```

## Command

```bash
python3 scripts/a2a/a2a_scoped_lane_status.py \
  --lane codex-command-broker-mission-control \
  --strict
```

The command writes:

```text
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/scoped_lane_status_codex-command-broker-mission-control.json
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/scoped_lane_status_codex-command-broker-mission-control.md
```

## What It Checks

- the allowed file list for the lane
- changed files inside the lane
- dirty files outside the lane, reported as context only
- required no-provider/no-push/no-deploy/no-jailbreak boundaries
- validation commands that should pass before a scoped stage

## What It Does Not Do

- no `git add .`
- no staging by script
- no commit
- no push
- no deploy
- no external repo clone
- no provider call
- no connector sync
- no policy bypass

## Stage Rule

If the report is ready for scoped stage, the operator can review the generated
Markdown report and stage only the manifest-listed files. The script prints a
suggested `git add -- ...` command as documentation only; it never executes it.
