---
name: sirinx-ai-model-intelligence
description: >
  SIRINX AI Model Intelligence — ติดตาม, ประเมิน, และ recommend AI models สำหรับ platform
  Benchmark models, track releases, optimize model selection per use-case
  Triggers on: AI model, benchmark, model comparison, LLM evaluation, เปรียบเทียบ model
---

# SIRINX AI Model Intelligence — v1.0

**Mission:** ติดตามและประเมิน AI models ที่เหมาะสมสำหรับ SIRINX platform agents

---

## Model Registry

### Production Models (updated 2026-07-20 — see `ronin-model-routing`
### skill for the authoritative lane config; this table is the
### intelligence/benchmark view, not the router)

| Model | Provider | Context | Thai | Speed | Cost |
|-------|----------|---------|------|-------|------|
| claude-sonnet-5 | Anthropic | 200K | Good | Fast | $$ |
| claude-opus-4-8 | Anthropic | 200K | Good | Slow | $$$$ |
| claude-fable-5 | Anthropic | 200K | Good | Fast (extra-effort capable) | $$ |
| claude-haiku-4-5 | Anthropic | 200K | OK | Fast | $ |
| glm-5.2 (cointh.com proxy) | Zhipu, via 3rd-party proxy | — | Good | Fast | $ — see `ronin-model-routing` approval gate |
| cloudflare-workers-ai | Cloudflare | model-dependent | Varies | VFast | Free tier — see `ronin-model-routing` approval gate |

Superseded: `claude-sonnet-4-6`, `claude-opus-4-6` are prior-generation
IDs and are no longer the current family; qwen/deepseek/gemini rows
from the original stub were never wired to a real lane in this repo —
removed rather than left as unverified claims. If a future model
lane is actually implemented, add it here **and** to
`ronin-model-routing`'s lane table in the same commit.

### Model Assignment (47 Ronin Layers)

| Layer | Recommended Model | Reason |
|-------|------------------|--------|
| L1 Perception | claude-haiku-4-5 | Fast, cheap, structured output |
| L2 Analysis | claude-sonnet-5 | Balance cost/quality |
| L3 Decision | claude-sonnet-5 | Reasoning required |
| L4 Coordination | claude-opus-4-8 | Complex orchestration, hard-coding tasks |
| L5 Research | claude-sonnet-5 | Advisory research, no long-context lane wired yet |
| QA / post-limit-reset verification | claude-fable-5 | Cheapest reliable pass right after a usage-window reset |

## Benchmark Metrics

### SIRINX-Specific Benchmarks
1. **Thai Solar ROI Calculation** — Accuracy test
2. **Thai B2B Proposal Generation** — Quality score
3. **Agent Coordination** — Multi-step task completion
4. **Code Generation** — TypeScript Next.js 15

## Monitoring

- Agent: Mimura #44 (AI Trend Scanner) — weekly GitHub/HuggingFace/arXiv
- Agent: Kayano #46 (Benchmark Research) — monthly benchmarks
- Alert: New model release → auto-benchmark → recommendation report

## Status

✅ **Current** (as of 2026-07-20, B10 skill hygiene audit) — Model registry and lane
mapping reflect `ronin-model-routing`'s live config. Only the automated benchmark
pipeline (auto-run on new model release → recommendation report) remains unbuilt.
