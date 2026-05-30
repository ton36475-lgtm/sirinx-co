# SIRINX AI-WarRoom — Master Configuration

**Platform:** SIRINX Solar Energy AI Platform v10.0 "47 Ronin"
**Runtime:** OpenClaw on Alibaba Cloud Bangkok (ap-southeast-7)
**Stack:** Next.js 15 + TypeScript + Tailwind CSS + Supabase
**Language:** ภาษาไทยเป็นหลัก (code เป็น English)

---

## Workspace Structure

```
AI-WarRoom/
├── CLAUDE.md                    ← This file
├── .claudeignore
├── .claude/
│   ├── settings.local.json
│   └── skills/                  ← SIRINX project skills (32 total)
├── sirinx-app/                  ← ✅ CANONICAL Next.js 15 app (port 3002)
├── apps/
│   └── sirinx-desktop/          ← Electron desktop launcher
├── docs/
│   ├── architecture.md
│   ├── andromeda-masterplan.md
│   └── pixle-office-structure.md
├── scripts/                     ← Automation scripts
├── packages/                    ← Shared packages (future)
├── .pixel-agents/               ← Agent character/layout JSON data
├── pixel-office-demo.html       ← Standalone Pixel Office demo
├── OPENCLAW-SETUP-GUIDE.md
└── install-openclaw.ps1
```

---

## Apps

### `sirinx-app/` — Next.js 15 Web App ✅ CANONICAL

```bash
cd sirinx-app
npm run dev        # Port 3002 (Turbopack)
npm run build
npm run typecheck
npm run lint
```

**Key directories:**
- `src/agents/` — 47 Ronin agent implementations
- `src/app/` — Next.js App Router pages
- `src/components/` — React components (layout/, agents/)
- `src/data/` — Static agent data

**Key routes:**
- `/` — Home (landing)
- `/dashboard` — CEO WarRoom Dashboard (KPIs, charts, activity)
- `/leads` — Lead Management (table, filters, modal)
- `/calculator` — Solar ROI Calculator (kWp, NPV, payback chart)
- `/reports` — Analytics Dashboard (charts, funnel, top agents)
- `/settings` — Admin Settings (company, agents, notifications, API keys)
- `/agents` — Agent DNA Command Center + Pixel Office View
- `/openclaw` — OpenClaw Commander
- `/api/models` — Model list API
- `/api/openclaw/run` — Execute OpenClaw command
- `/api/ai-customize` — AI customization

### `apps/sirinx-desktop/` — Electron Desktop Launcher

```bash
cd apps/sirinx-desktop
npm start          # Launch Electron
npm run dev        # Dev mode
npm run build      # Build portable .exe
```

Launches sirinx-app at `http://localhost:3002` with system tray.

---

## Agent System — 47 Ronin

### Layer Structure

| Layer | Count | Role | Token Budget |
|-------|-------|------|-------------|
| L1 Perception | 16 | Data collection, scanning | 4K |
| L2 Analysis | 9 | Processing, scoring, insights | 8K |
| L3 Decision | 10 | Strategy, proposals, decisions | 16K |
| L4 Coordination | 8 | Orchestration, execution | 32K |
| L5 Research | 4 | AI trends, benchmarks, R&D | 128K |
| Chatbot | 1 (Kai) | Customer-facing (5-step CoT) | 16K |

### Ronin Codenames
- L1: Kuranosuke(01)→Kin'emon(16)
- L2: Jūnai(17)→Jūrōzaemon(25)
- L3: Kihei(26)→Yasoemon(43)
- L4: Gengo(35-Orchestrator)→Yogorō(42)
- L5: Mimura(44), Yokogawa(45), Kayano(46), Terasaka(47)

### Key Patterns

```typescript
// All agents extend BaseAgent
class MyAgent extends BaseAgent {
  protected async process(input: AgentInput): Promise<AgentOutput> { ... }
}

// Cross-agent communication
this.publishEvent('event-type', payload)  // NOT object argument

// Cast strict types
const data = input.payload as unknown as MySpecificType

// Factory singleton
const agent = AgentFactory.getAgent('kuranosuke-01')
```

---

## Design System

```css
/* Colors */
--deep-navy:     #0A2342;   /* Primary background */
--solar-gold:    #F5A623;   /* Accent, CTAs */
--emerald-green: #10B981;   /* Success, active */
--glass-white:   rgba(255,255,255,0.08);
--glass-border:  rgba(255,255,255,0.12);

/* Font */
font-family: 'Sarabun', sans-serif;  /* Thai + English */

/* Glassmorphism card */
background: rgba(255,255,255,0.08);
backdrop-filter: blur(20px);
border: 1px solid rgba(255,255,255,0.12);
border-radius: 16px;
```

---

## Available Skills (Project-level)

### Core Infrastructure
- `sirinx-unified-os` — Master OS, agent orchestration
- `sirinx-alibaba-infrastructure` — Cloud infra (Alibaba Bangkok)
- `sirinx-llm-switcher` — Dynamic model routing
- `sirinx-context-engineering` — Token optimization
- `sirinx-openclaw-automation-pipeline` — CI/CD for OpenClaw
- `sirinx-master-knowledge` — Single source of truth
- `sirinx-master-gem` — Master gem / core system crystallization
- `sirinx-seo-77-provinces` — SEO/AEO for all 77 Thai provinces (Skill #31)
- `sirinx-multi-model-critique` — Open Core multi-model critique pipeline: Draft→Review→Approve (Skill #32)

### Business & Marketing
- `sirinx-cmo-marketing-funnel` — AIDA B2B solar marketing
- `sirinx-meta-ads-marketing` — Facebook/Instagram Ads
- `sirinx-fb-group-scanner` — FB Group lead scanning
- `sirinx-content-pipeline` — Automated content creation
- `sirinx-shopee-video-ai` — E-commerce video AI
- `sirinx-clawwork-monetization` — Revenue model & pricing
- `sirinx-seo-77-provinces` — SEO coverage for all 77 Thai provinces

### Intelligence & Analytics
- `sirinx-sbct-intelligence` — Strategic competitive intel
- `sirinx-agentforce-intelligence` — Salesforce CRM integration
- `sirinx-dashboard-orchestration` — CEO WARROOM dashboard
- `sirinx-ai-model-intelligence` — Model evaluation & benchmarks
- `sirinx-ai-war-intelligence` — Strategic AI operations
- `sirinx-prd-knowledge` — Product requirements knowledge base
- `sirinx-investment-proposal` — Investment proposal generation & analysis

### Integrations & Automation
- `sirinx-telegram-integration` — Telegram bot & alerts
- `sirinx-n8n-automation` — Workflow automation (n8n)
- `sirinx-robotics-iot` — IoT, inverters, sensors
- `sirinx-agentation-ui-review` — UI/UX review & design

### Architecture & Concepts
- `sirinx-andromeda-dark-neural` — Creator/Coder/Operator 3-core
- `sirinx-pixle-office-ai` — Virtual AI company departments
- `sirinx-warroom-ceo-core` — CEO command interface
- `sirinx-research-web-app` — Layer 5 research dashboard
- `sirinx-ipo-mental-model` — Input→Process→Output framework
- `sirinx-manus-portfolio` — TDD standards, project tracking

### Global Skills (from ~/.claude/skills/)
- `solarcell-system` — Solar Energy Universal Platform
- `fullstack-developer` — Full-stack development
- `fma-01` → `fma-08` — Future Multi Agentic suite

---

## Environment Variables

```env
# apps/sirinx-web/.env.local
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
OPENCLAW_API_KEY=...
ANTHROPIC_API_KEY=...
```

---

## Business Context

**Company:** SIRINX Solar Energy (Thailand)
**ICP:** Factories/Warehouses/Hotels with electricity bill > 50K THB/month
**Model:** B2B EPC installation + O&M + AI platform (SaaS)
**Target Market:** B2B industrial solar Thailand
**Key Differentiator:** AI-powered 47 Ronin agent system for full automation

---

## Important Notes

1. **ห้ามข้ามชั้น agent** — L1 → L2 → L3 → L4 เท่านั้น
2. **tsconfig target=ES2020** — required for Set/Map iteration
3. **Tailwind v3.4.1** (ไม่ใช่ v4 — กรุณาตรวจสอบก่อนใช้ v4 features)
4. **Port 3002** — sirinx-web runs on 3002 (not 3000)
5. **Thai first** — documentation และ content เป็นภาษาไทย
