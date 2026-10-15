# Pipeline Audit Runbook

Status: active local audit.

## Purpose

Run one repeatable no-skip pipeline audit before advancing SIRINX OS to the next phase.

## Commands

Manual full audit (includes project verifier, configured local service probes, CLI readiness, and repo secret-pattern scan):

```bash
npm run pipeline:audit
```

The agents-mux scheduled loop uses the lightweight local audit every 15 minutes:

```bash
npm run pipeline:audit -- --scheduled
```

Scheduled mode checks only Git status/branch and internal disk capacity. It does not run builds, network checks, account CLIs, Telegram previews, or secret scans. It warns below the 15 GiB workload floor; command failures are reported as failures. Set `PIPELINE_AUDIT_OUTPUT` to a distinct path when running concurrently with another audit writer.

## What It Checks

- Git branch and cleanliness.
- PR-MONO local verifier.
- AdaptiveSync dry-run planner.
- Telegram dry-run preview.
- Local HQ service on `127.0.0.1:5177`.
- Local Office API health and token gate on `127.0.0.1:8790`.
- GitHub CLI auth readiness.
- Cloudflare `cloudflared` readiness.
- Windows Drive D mount readiness.
- Public/private domain read-only DNS/HTTP state.
- Secret-risk patterns in the repo.

## What It Does Not Do

- No GitHub push.
- No PR creation.
- No Cloudflare mutation.
- No DNS write.
- No Telegram send.
- No BotFather action.
- No Supabase/Notion/ClickUp/Drive/Figma write.
- No production database write.

## Output

The latest local audit is written to:

```text
exports/pipeline-audit-latest.json
```

That file is ignored by Git because it is generated state.

## Gate Meaning

- `pass`: safe and ready for the next local step.
- `warn`: blocked by account/service setup or unavailable optional dependency.
- `fail`: must fix before phase advancement.
- Scheduled mode uses `warn` for disk below 15 GiB so routine monitoring does not claim capacity admission; a Git/df command failure remains `fail`.

Production gates can still remain blocked even when local pipeline passes.
