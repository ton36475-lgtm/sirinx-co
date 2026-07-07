# Pipeline Audit Runbook

Status: active local audit.

## Purpose

Run one repeatable no-skip pipeline audit before advancing SIRINX OS to the next phase.

## Command

```bash
npm run pipeline:audit
```

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

Production gates can still remain blocked even when local pipeline passes.
