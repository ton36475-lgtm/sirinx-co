# OpenClaw Multi-Model Orchestration Engine

**SIRINX AI-WarRoom | Future Multi Agentic | v1.0.0**

ระบบ Orchestration Engine ที่ทำให้ Claude, ChatGPT, Gemini, Qwen ทำงานเป็นทีมเดียวกัน
ไม่ใช่แค่รันแยกกัน — แต่ทำงานร่วมกันแบบ systematic และ structured

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   OpenClaw Control Plane                 │
│                      orchestrator.js                     │
├──────────────┬─────────────────┬──────────────────────  │
│  Critique    │    Parallel      │      Cascade           │
│  Loop        │    Build         │      (Cost-opt)        │
│  Claude→GPT  │  Claude+GPT+...  │  Qwen→Gemini→Claude   │
├──────────────┴─────────────────┴──────────────────────  │
│              Model Registry (model-registry.js)          │
├──────────────┬─────────────────┬────────────────────────│
│   Claude     │    ChatGPT      │   Gemini | Qwen         │
│   (Sonnet)   │    (GPT-4o)     │   (Flash) | (Plus)      │
├──────────────┴─────────────────┴────────────────────────│
│              Artifact Store (JSON-based)                  │
│         Models communicate through artifacts only        │
├─────────────────────────────────────────────────────────│
│      47 Ronin Agent Scheduler (agent-scheduler.js)       │
│    L1(16) → L2(9) → L3(10) → L4(8) → L5(4) + Kai      │
└─────────────────────────────────────────────────────────┘
```

---

## Getting Started

### 1. ติดตั้ง Dependencies

```bash
cd future-openclaw-hybrid/engine
npm install
```

### 2. สร้าง .env file

```bash
cp .env.example .env
# แล้วแก้ไขใส่ API keys
```

ขั้นต่ำต้องมี 1 key:
- `ANTHROPIC_API_KEY` — สำหรับ Claude
- `OPENAI_API_KEY` — สำหรับ ChatGPT

Keys อื่นเป็น optional — Engine ทำงานได้แม้ขาด keys บางตัว (graceful degradation)

### 3. รัน

```bash
# ดูสถานะ
node index.js status

# Auto-route task
node index.js route "สร้าง SEO content โซลาร์เซลล์ เชียงใหม่"

# Critique loop
node index.js critique "Write investment proposal for solar project"

# Parallel execution
node index.js parallel --tasks=my-tasks.yaml

# Cascade (cost-optimized)
node index.js cascade "Write blog post" --chain=qwen,claude

# Start full server (Telegram + 47 agents)
node index.js serve
```

---

## Workflows

### 1. Critique Loop (`critique-loop.js`)
```
Claude drafts → ChatGPT reviews (structured findings) → Claude refines
Repeat until: score >= threshold OR max rounds reached
```

**ใช้เมื่อ:** ต้องการ quality สูง เช่น investment proposals, marketing copy, SEO articles

**Cost:** ~0.02-0.10 THB per run (2-3 rounds)

### 2. Parallel Build (`parallel-build.js`)
```
Task A → Claude ──┐
Task B → ChatGPT ─┼──▶ merge
Task C → Qwen ────┘
```

**ใช้เมื่อ:** ต้องการทำงานหลายอย่างพร้อมกัน เช่น copy + code + meta tags

**Speedup:** ~3-4x เร็วกว่า sequential

### 3. Cascade (`cascade.js`)
```
Qwen (cheapest) ──▶ score < 70 ──▶ Gemini ──▶ score < 70 ──▶ Claude
                    score >= 70: STOP (ประหยัด cost)
```

**ใช้เมื่อ:** งาน bulk ที่ต้องการ balance cost vs quality

**Cost savings:** ถ้า Qwen ผ่าน — ประหยัด 80-95% vs ใช้ Claude ตลอด

---

## Model Routing (model-registry.js)

| Task Type | Primary | Fallback |
|-----------|---------|----------|
| `code_generation` | ChatGPT | Claude |
| `seo_content` | Claude | ChatGPT |
| `marketing_copy` | Claude | ChatGPT |
| `creative_content_th` | Claude | Gemini |
| `data_analysis` | ChatGPT | Claude |
| `bulk_processing` | Qwen | Gemini |
| `translation` | Claude | Gemini |
| `reasoning` | ChatGPT (o1) | Claude Opus |
| `image_prompt` | Gemini | Claude |

---

## Cost Strategy (cost-optimizer.js)

**เป้าหมาย: 1,400 THB/เดือน**

| Tier | Models | Budget | ใช้เมื่อ |
|------|--------|--------|---------|
| Premium 5% | Claude Opus, o1 | 70 THB | งานสำคัญมาก |
| Standard 15% | Claude Sonnet, GPT-4o | 210 THB | งานทั่วไป |
| Economy 80% | Qwen, Gemini Flash | 1,120 THB | bulk tasks |

**ราคา (USD per 1M tokens):**

| Model | Input | Output |
|-------|-------|--------|
| Claude Opus | $15 | $75 |
| Claude Sonnet | $3 | $15 |
| GPT-4o | $2.5 | $10 |
| GPT-4o-mini | $0.15 | $0.60 |
| Gemini Flash | $0.075 | $0.30 |
| Qwen Plus | $0.50 | $1.50 |

---

## 47 Ronin Agent Scheduler

ทุก agent มีงานทำตลอดเวลา — ไม่มี idle

### Layer Structure

| Layer | Count | Role | Token Budget |
|-------|-------|------|-------------|
| L1 Perception | 16 | Scan leads, monitor, collect data | 4K |
| L2 Analysis | 9 | Score, calculate, analyze | 8K |
| L3 Decision | 10 | Strategy, pricing, planning | 16K |
| L4 Coordination | 8 | Execute, manage, report | 32K |
| L5 R&D | 4 | Benchmark, optimize, prototype | 128K |
| Chatbot | 1 (Kai) | Customer conversations | 16K |

### Idle Detection

```
ทุก 1 นาที → ตรวจสอบทุก agent
ถ้า idle > 15 นาที → auto-generate tasks ตาม specialization
ถ้า urgent situation → broadcast ไปยัง agents ที่เกี่ยวข้อง
```

### Revenue Tracking

แต่ละ task มี `estimatedRevenueTHB` — สะสมต่อ agent ต่อ session

ตัวอย่าง:
- `senzaki-15` (Real Estate Scanner): 30,000-50,000 THB per task
- `yasohachi-28` (Lead Prioritizer): 500,000 THB potential per session
- `kayano-46` (Prototype Developer): 100,000 THB per prototype

---

## Artifact Store

Models communicate through structured JSON artifacts — ไม่ใช่ free-form chat

```
artifacts/store/
  run_abc123_task_1234.json       ← Input task
  run_abc123_draft_1235.json      ← Claude's draft
  run_abc123_review_1236.json     ← ChatGPT's review
  run_abc123_result_1237.json     ← Final merged output
```

### Artifact Types

- **task** — input: task description, params, priority
- **draft** — model output: content, tokens, cost
- **review** — structured feedback: score, findings, recommendation
- **result** — final output: content, cost summary, quality

---

## Telegram Integration

```bash
# Set in .env
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...

# Start
node index.js serve
```

**Commands:**
- `/orchestrate [task]` — Auto-route ไปยัง best model
- `/critique [task]` — Critique loop (Claude → ChatGPT)
- `/parallel [tasks JSON]` — Parallel execution
- `/cascade [task]` — Cost-optimized cascade
- `/status` — Engine status + available models
- `/agents` — สถานะ 47 Ronin agents ทั้งหมด
- `/cost` — Cost summary ประจำ session

---

## Adding New Models

1. สร้าง `engine/models/newmodel.js` extend `BaseModel`
2. Implement: `initialize()`, `generate()`, `review()`
3. เพิ่มใน `model-registry.js` TASK_MODEL_MAP
4. Register ใน `orchestrator.js` init()
5. เพิ่ม pricing ใน `config.js` PRICING

Template:
```javascript
import { BaseModel } from './base-model.js';

export class NewModel extends BaseModel {
  constructor() { super('newmodel'); }
  async initialize() { /* setup client */ }
  async generate(input) { /* call API */ }
  async review(content, task) { /* structured review */ }
}
```

**Models ready to activate (เพิ่ม API key แล้วทำงานได้ทันที):**
- Gemini (`GOOGLE_API_KEY` + `npm i @google/generative-ai`)
- Qwen (`DASHSCOPE_API_KEY`)
- GLM (`ZHIPU_API_KEY`)
- Kimi (`KIMI_API_KEY`)

---

## File Structure

```
engine/
├── index.js                   ← CLI entry point
├── orchestrator.js            ← Main control plane
├── model-registry.js          ← Task routing & model management
├── cost-optimizer.js          ← Cost tracking & budget management
├── config.js                  ← Config, pricing, env vars
├── agent-scheduler.js         ← 47 Ronin task scheduler
├── agent-definitions.js       ← All 47 agent definitions
├── task-generator.js          ← Auto-generate tasks for idle agents
├── telegram-bridge.js         ← Telegram bot integration
├── package.json
├── .env.example
├── models/
│   ├── base-model.js          ← Abstract base class
│   ├── claude.js              ← Anthropic Claude adapter
│   ├── chatgpt.js             ← OpenAI ChatGPT adapter
│   ├── gemini.js              ← Google Gemini adapter (extensible)
│   └── qwen.js                ← Alibaba Qwen adapter (extensible)
├── workflows/
│   ├── critique-loop.js       ← Draft→Review→Refine pipeline
│   ├── parallel-build.js      ← Parallel execution & merge
│   └── cascade.js             ← Cost-optimized escalation
├── artifacts/
│   ├── artifact-store.js      ← JSON artifact read/write
│   ├── schemas.js             ← Artifact schema definitions
│   └── store/                 ← Runtime artifact storage
└── examples/
    ├── example-critique-seo.js
    ├── example-parallel-campaign.js
    └── example-cascade-content.js
```

---

## ตัวอย่าง Programmatic Usage

```javascript
import { Orchestrator } from './orchestrator.js';

const engine = new Orchestrator();
await engine.init();

// 1. Auto-route
const result = await engine.route('สร้าง SEO article สำหรับ solar เชียงใหม่');
console.log(result.content);

// 2. Critique loop
const critiqued = await engine.critique('Write investment proposal', {
  drafter: 'claude',
  reviewer: 'chatgpt',
  maxRounds: 3,
  qualityThreshold: 80,
});

// 3. Parallel
const parallel = await engine.parallel([
  { id: 'copy',   task: 'Write Thai marketing copy', model: 'claude' },
  { id: 'code',   task: 'Write API endpoint',         model: 'chatgpt' },
  { id: 'seo',    task: 'Write SEO meta tags',         model: null },  // auto
]);

// 4. Cascade (cost-optimized)
const cascaded = await engine.cascade('Write blog post about solar ROI', {
  chain: ['qwen', 'gemini', 'claude'],
  qualityThreshold: 75,
});

// 5. Cost summary
console.log(engine.costOptimizer.formatSummary());
```

---

*Built for SIRINX Solar Energy AI Platform — 47 Ronin Multi-Agent System*
*Runtime: OpenClaw on Alibaba Cloud Bangkok (ap-southeast-7)*
