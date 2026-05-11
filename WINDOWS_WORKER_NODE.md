# Windows Worker Node

Status: planned.

The Windows PC is the worker node. It should run heavy local jobs and replica workloads, not act as the source of truth.

## Planned Responsibilities

- GPU jobs for media, local model experiments, vLLM/DeepSeek lanes, and ComfyUI.
- After Effects and GhostClaw media jobs in dry-run mode until approved.
- MySQL replica and backup worker after data gates pass.
- Worker heartbeat reporting to the Mac Control Plane.

## Blocked By Default

- Public worker ports.
- Direct production database writes.
- Direct GitHub push.
- Direct Cloudflare mutation.
- Raw filesystem mirror to mobile devices.
- Customer-facing sends.

## Worker Registration

Workers must register with:

- node id
- role
- hostname
- allowed capabilities
- current job state
- heartbeat timestamp
- safe shutdown command

See `NODE_HEARTBEAT_SCHEMA.md`.
