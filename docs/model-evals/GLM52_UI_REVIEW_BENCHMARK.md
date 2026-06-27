# GLM-5.2 UI Review Benchmark

Status: local-only benchmark scaffold.

## Purpose

This benchmark turns `BACKLOG-092` into a reviewable UI-evaluation packet for
Mission Control. It prepares a compact prompt and read-only status fixture so
GLM-5.2 can later review the A2A2A Team Coding Start and Next Scoped Packet UI
without receiving repo write access.

## Source Packet

- Source fixture:
  `apps/mission-control/src/fixtures/a2a2aNextScopedCodingPacket.json`
- Source packet: `SCOPED-CODING-420bddf8b5`
- Selected backlog item: `BACKLOG-092`
- Task: review a small Mission Control UI excerpt for layout clarity,
  responsiveness, accessibility, and scope control.

## Generated Artifacts

Run:

```bash
python3 scripts/model_eval/glm52_ui_review_benchmark.py
```

Outputs:

- Mission Control fixture:
  `apps/mission-control/src/fixtures/glm52UiBenchmarkStatus.json`
- Runtime report:
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/model_evals/glm52_ui_review/reports/glm52_ui_review_benchmark_status.json`
- Prompt:
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/model_evals/glm52_ui_review/prompts/mission_control_backlog_092_ui_review.md`

## Evaluation Contract

The model output must include:

- `findings`
- `recommended_ui_changes`
- `responsive_risks`
- `accessibility_risks`
- `implementation_plan`
- `tests_to_run`
- `no_code`

The output is report-only. It does not authorize direct code changes, provider
calls, connector sync, deploy, push, or public benchmark claims.

## Scoring

Score each criterion from 1 to 5:

- visual hierarchy
- layout practicality
- responsive constraints
- accessibility risks
- implementation specificity
- design system consistency
- safety and scope control

Passing threshold: average score at least `4.0`, with no unsafe action
suggestions and no invented production state.

## Policy Boundary

- Provider calls require a future Command Broker lease.
- Manual Playground/API output must be summarized into a report-only artifact
  before Codex uses it.
- Codex remains the only repo editor.
- Do not store secrets, API keys, raw provider traces, or hidden reasoning in
  tracked files.
- Do not claim GLM-5.2 passed until the model output is actually collected and
  scored.

## Next Step

If a provider lease is later approved, run the generated prompt manually or
through a budget-gated route, paste only the summarized findings into a new
report-only worker result, and open a separate scoped Codex packet for any local
UI change.
