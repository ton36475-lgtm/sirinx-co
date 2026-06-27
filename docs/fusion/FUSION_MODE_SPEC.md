# Fusion Mode Spec

Status: local-first design spec. External model calls require policy allow,
budget cap, rate limit, key availability, and audit logging.

## Goal

Fusion Mode coordinates multiple model roles through an autopilot policy-gated
council: classifier, scout, technical expert, critic, judge, synthesizer, cost
governor, execution lease, and memory writeback.

## Task Packet

```json
{
  "task_id": "local-task-id",
  "project": "GHOSTCLAW",
  "user_goal": "",
  "task_type": "",
  "risk_level": "low|medium|high",
  "requires_files": true,
  "requires_web": false,
  "requires_provider": false,
  "requires_policy_allow": true,
  "budget_limit_usd": 0,
  "output_format": "markdown",
  "blocked_actions": [
    "deploy_failed_tests",
    "publish_non_whitelist",
    "live_send_non_opt_in"
  ]
}
```

## Context Builder

Context packs include current user goal, project state, rules, previous
decisions, constraints, relevant files, allowed actions, blocked actions, and
output templates.

## Model Panel

- Local guard/classifier.
- Scout model.
- Technical expert.
- Reasoning critic.
- Strategy/product model.
- Judge.
- Final synthesizer.

## Debate / Review Layer

The review layer extracts consensus, contradictions, unique insights, blind
spots, factual risks, implementation risks, and cost risks.

## Judge Layer

The judge must not average answers. It selects the safest, most useful,
lowest-risk direction and marks uncertainty.

## Cost Governor

- Use local/cheap models first.
- Escalate only when quality/risk justifies cost.
- Stop or downgrade when budget is exceeded.
- Log model, cost estimate, latency, confidence, and approval state.

## Autopilot Policy Gate

Planning output can be local-only. External provider calls, push, deploy,
publish, live messages, production DB writes, and paid API batches require
policy allow, execution lease, budget cap, rate limit, verification, rollback,
and audit logging.

## Memory Writeback

Write only non-secret policy-allowed memory deltas. Store decisions, risks,
prompts, evidence, and next actions.

## Final Output Format

1. Final recommendation.
2. Why this direction.
3. Consensus.
4. Disagreements.
5. Risks.
6. Execution plan.
7. Cost / complexity.
8. Policy decision.
9. Next action.
10. Memory update.

## Stop Rules

Block or quarantine if a task requires secrets, network calls, provider
execution, public access, deploy, push, publish, or live sends without policy
allow.

Also block gated dataset submission, dataset download, model training, or
reasoning trace exposure unless dataset provenance, license, and trace-handling
policies pass.
