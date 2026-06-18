# GLM-5.2 Model Layer Runbook

Status: planned API-first model layer.

## Strategy

Use GLM-5.2 through an API-first smoke test before considering self-hosting.
Self-hosting a full model is not a default path and requires approved GPU
capacity, cost analysis, and rollback planning.

## Configuration

- API key: `ZAI_API_KEY` from environment only.
- Base URL: `GLM52_BASE_URL` from environment, with approved default
  `https://api.z.ai/api/paas/v4/`.
- Model: `GLM52_MODEL` from environment, default `glm-5.2`.
- Reasoning effort: use high/max only for long-context planning after approval.

## Smoke Test Requirements

- Fail safely when `ZAI_API_KEY` is missing.
- Never print the key.
- Send only a tiny harmless test prompt.
- Print success/failure status only.
- Do not write responses containing secrets to tracked files.

## Routing Policy

- Local/Ollama first for private lightweight tasks.
- GLM-5.2 for approved long-horizon repo planning.
- External provider use must be cost-aware and approval-gated.
