# SIRINX Agent Mesh — Deep Research Inventory

- **Date:** 2026-07-19 (Asia/Bangkok, +07)
- **Scope:** Read-only inventory of all agents, sub-agents, tasks, and files across the local agent mesh in `/Users/sirinx/SIRINXDev/sirinx-co`
- **Method:** 7 parallel read-only research passes over `.claude/`, `services/`, `crates/`, `infra/`, `scripts/`, `sites/`, and root governance docs. No files modified except this report. No secrets read or printed.
- **Anchor commits:** `245d029` (Kimi K3 lane), `778c178` (Telegram gateway config), `b7ba23f`, `82ee521`, `5b972ab`, `7304799`, `35f05b3` (verified via `git log --oneline -8`)

---

## (a) Executive Summary (สรุปผู้บริหาร)

**โครงสร้าง agent mesh ของ SIRINX วันนี้เป็น "โครงกระดูกที่วางแผนไว้ครบ แต่เติมเนื้อแล้วเพียงบางส่วน" — ทุกอย่างอยู่ในสภาพ hold-by-default ตามการออกแบบ**

1. **"47 Ronin" เป็นสถาปัตยกรรม ไม่ใช่ของที่มีจริงครบ:** ไฟล์ sub-agent ใน `.claude/agents/` มีเพียง **6 ไฟล์** (หัวหน้าแผนก L1–L5 + Kai) ส่วน roster 47 ช่องมีอยู่จริงใน 3 ระดับ: แผน (`AGENT_TEAM_PLAN.md:15-22`, 16+9+10+8+4=47), Rust schema (`crates/sirinx-agents/src/roster.rs:34` `SIZE: u8 = 47`), และ role descriptors ใน JS (`services/dev-control-api/src/agent-team.mjs:108-163`) — แต่ agent ที่มีโค้ดทำงานจริงมีแค่ **4 ตัว** (Kuranosuke, Jūnai, Kihei, Gengo ใน `crates/sirinx-agents/src/ronin.rs`) ข้อความใน `MASTER_PLAN.md:23` (A9) ที่อ้างว่า "47 Ronin sub-agents + 49 skills consolidated" เสร็จแล้วจึง **เกินความจริง**

2. **Skills มี 50 ตัว ไม่ใช่ 49:** registry (`SKILLS_REGISTRY.md:4`) และเอกสารอีก 4 จุดยังเขียนว่า 49 — skill ที่ 50 (`sirinx-master-plan`) ถูกเพิ่มใน commit `7304799` แต่ registry ไม่เคยอัปเดต สถานะจริง: **stub 24 ตัว, เอกสาร doctrine สมบูรณ์ 21 ตัว, reference สมบูรณ์ 3 ตัว, active 2 ตัว** (และ 3 ตัวอ้าง path/script ที่ไม่มีใน monorepo แล้ว)

3. **Kimi K3 lane ยืนยันแล้วว่ามีจริง** (commit `245d029`): lane `kimi-k3-openrouter` / `moonshotai/kimi-k3` ใน `team-runtime-bridge.mjs:80-100` และถูก **swap เข้าแทน** placeholder `~moonshotai/kimi-latest` ใน Fusion Router default panel (`openrouter-fusion-router.mjs:13`, panel ยัง 5 ตัว) — แต่ทุก lane อยู่ในสถานะ `approval-required-paid-api`, `canCallProvider: false`, `requiresHumanApproval: true`; **ไม่มี code path ใดเรียก provider จริงได้เลย** (`providerCallRouteExists: false`, `openrouter-fusion-router.mjs:350`) ข้อความ "for all agent teams" ใน commit ยังไม่ครบถ้วน — Hermes `MODEL_POLICY` ยังเป็น qwen-only (`adaptive-command-gateway.mjs:35-60`) เพราะ commit ไม่ได้แตะไฟล์นั้น

4. **Telegram lane เป็น scaffold dry-run ที่ทดสอบครบ** แต่ขาด 3 อย่างก่อน go-live: credentials ภายนอก repo, gate `telegram_send` ที่ durable (ยัง `hold`, ต้องมีตั๋ว `OPS-TG-…`), และการเชื่อม gate — พบช่องโหว่โครงสร้าง 2 จุด: gate state ใน `config.mjs:32` เป็น **hardcoded `"hold"`** ไม่ได้อ่านจาก Postgres และ `scripts/telegram-notify-preview.mjs` ไม่ได้เช็ค durable gate เอง มีรายการความปลอดภัยค้าง: bot token ที่ hardcode อยู่ใน audit copy ของ sirinx-solar-energy ต้อง rotate (`project-inventory.mjs:258-262`)

5. **Hermes วันนี้คือ "สัญญา + ท่อประปา dry-run" ไม่ใช่ระบบ autonomous ที่รันอยู่:** ทุก execution lane (worker, MCP, provider, message, deploy, gateway restart) ถูก hard-stop ด้วย phase lock `dryRun !== false` และ approval ที่มีชื่อเฉพาะ ไม่มี `package.json` ของตัวเอง — ถูก serve ผ่าน `dev-control-api/server.mjs`

6. **Integration map:** PRESENT = a2a-sync (Rust, HTTP delta sync ทำงานจริงแต่ไม่มี client loop), omniroute (router ใน sirinx-control), agents-mux, codex (protocol + registry, gated), claude (skills/sub-agents จริง) / PARTIAL = telegram, hermes, opencode (registry-only, `needs_install`) / MISSING = claude-cowork (0 hits — มีแต่ "Microsoft Copilot Cowork" เป็นการเปรียบเทียบ), cmux (มีแค่ comment ใน `scripts/agents-mux.sh:5-6`)

7. **คิวงาน:** งานวิศวกรรมถัดไปที่ unblocked คือ **B3** (port routes เข้า `sirinx-web`, `MASTER_PLAN.md:35`); B7 ถูก block ด้วย keystore rotation; gates ทั้ง 5 (deploy, cloudflare_dns, telegram_send, customer_messaging, adaptive_sync) ยัง hold ทั้งหมด ทุก checkbox ใน `GO_LIVE_GATE_CHECKLIST.md` ยังไม่ถูกติ๊ก — การเปิด gate เป็นการตัดสินใจของมนุษย์เท่านั้น

---

## (b) Agent Roster — `.claude/agents/`

Verified: **exactly 6 files** in `.claude/agents/`. No other in-repo agent-definition directory exists.

| File | ID (codename) | Role | Level | Tools declared | Skills bound | Key rules (evidence) |
|---|---|---|---|---|---|---|
| `.claude/agents/ronin-l1-perception-lead.md` | `ronin-l1-perception-lead` (Kuranosuke) | Head of L1 Perception dept, Ronin 01–16; collect/scan only, 4K-token class | L1 | Read, Glob, Grep, Bash | none in file; registry maps L1/L2 → intelligence skills (`SKILLS_REGISTRY.md:18-19`) | Read-only, never decides/edits; reports raw findings to L2 (file:11-17) |
| `.claude/agents/ronin-l2-analysis-lead.md` | `ronin-l2-analysis-lead` (Jūnai) | Head of L2 Analysis dept, Ronin 17–25; score/rank/insight, 8K class | L2 | Read, Glob, Grep, Bash | none in file; registry L1/L2 → intelligence | Verifies sources itself; scored options, never decisions; reports to L3 (file:10-16) |
| `.claude/agents/ronin-l3-decision-lead.md` | `ronin-l3-decision-lead` (Kihei) | Head of L3 Decision dept, Ronin 26–35; picks one path, writes plans/specs, 16K class | L3 | Read, Glob, Grep, Write | none in file; registry L3 → planning (`SKILLS_REGISTRY.md:19-20`) | Plan docs only, never code; every plan ends with Validation Gate + human-approval line (file:10-18) |
| `.claude/agents/ronin-l4-coordination-lead.md` | `ronin-l4-coordination-lead` (Gengo, COO) | Head of L4 Coordination dept, Ronin 36–43; **only dept allowed to change code**, 32K class | L4 | Read, Glob, Grep, Bash, Edit, Write | none in file; registry L4 → ops (`SKILLS_REGISTRY.md:20-21`) | Executes only approved L3 plan or direct human order; must run fmt/clippy/tests before "done"; gated side effects → dry-run + escalate (file:12-22) |
| `.claude/agents/ronin-l5-research-lead.md` | `ronin-l5-research-lead` (Mimura) | Head of L5 Research dept, Ronin 44–47; advisories, 128K class | L5 | Read, Glob, Grep, WebSearch, WebFetch | none in file; registry L5 → research (`SKILLS_REGISTRY.md:21-22`) | Advisories only; every claim cites source; web content untrusted (file:10-18) |
| `.claude/agents/kai-customer-liaison.md` | `kai-customer-liaison` (Kai) | Single customer-facing chatbot, Thai-first B2B solar tone | n/a (Chatbot) | Read, Glob, Grep | none in file; registry Kai → brand/content (`SKILLS_REGISTRY.md:22-23`) | **DRAFTS only** — real sending behind `customer_messaging` gate, human must open (file:11-20) |

Flow rule everywhere: **L1→L2→L3→L4 only (ห้ามข้ามชั้น)**; L5 advises; Kai never touches ops (`AGENT_TEAM_PLAN.md:24-27`). No `model:` key in any agent frontmatter — no model pinned at agent level.

### The "47 Ronin" claim — verified status

**47 is the designed roster size, consistently encoded — but only 6 sub-agent files and 4 coded agents exist.**

| Level of reality | Evidence | Status |
|---|---|---|
| Plan / org chart | `AGENT_TEAM_PLAN.md:1` title "47 Ronin Sub-Agent Team Plan"; `:15-22` L1 01–16, L2 17–25, L3 26–35, L4 36–43, L5 44–47 (sums to 47), + Kai unnumbered | Real (doctrine) |
| Rust runtime schema | `crates/sirinx-agents/src/roster.rs:34` `SIZE: u8 = 47`; layer map `:13-24`; only 12 codenames known `:37-54`; tests assert 16/9/10/8/4 `:73-96` | Real (schema) |
| Coded agents | Only **4**: Kuranosuke(01), Jūnai(17), Kihei(26), Gengo(36) — `crates/sirinx-agents/src/ronin.rs:40,61,112,147` (lead pipeline L1→L4) | Real (code) — 4 of 47 |
| JS role roster | `services/dev-control-api/src/agent-team.mjs:108-163` exactly 47 numbered **role descriptors**; `:9-106` 12 active profiles; mode `:307` `"12-active-profiles-plus-47-role-roster"`; profiles live outside repo at `~/.hermes/profiles` (`:6,280`) | Real (descriptors, not implementations) |
| Overstated done-claim | `MASTER_PLAN.md:23` (A9): "47 Ronin sub-agents + 49 skills consolidated" proof `.claude/` | **Overstated** — 6 files, and skills are 50 |
| Migration source | Legacy TS agents in `sirinx-solar-energy/src/agents/`; migration marked **open** at `RUST_MIGRATION_PLAN.md:58` | Pending |

---

## (c) Skills Registry — `.claude/skills/`

Verified: **50 directories**, each with `SKILL.md`. Status legend: **stub** = explicit 🚧 marker · **doc** = complete doctrine/procedure, no executable code · **reference** = full reference content · **active** = self-declared ✅.

| # | Skill | Trigger (1 line) | Status | Flags |
|---|---|---|---|---|
| 1 | `agent-team-orchestration` | Manual-only team launch for Hermes dashboard projects | doc (`disable-model-invocation: true`, `SKILL.md:4`) | — |
| 2 | `hermes-project-planning` | Task cards/phases/role splits for Hermes dashboard | doc | — |
| 3 | `sirinx-agentation-ui-review` | UI/UX review, glassmorphism, a11y | stub (`SKILL.md:85`) | — |
| 4 | `sirinx-agentforce-intelligence` | Salesforce Agentforce CRM integration | stub (`SKILL.md:81`) | — |
| 5 | `sirinx-ai-model-intelligence` | Model benchmark/registry, model selection per layer | stub (`SKILL.md:58`) | **model routing** (`SKILL.md:30-40`) |
| 6 | `sirinx-ai-war-intelligence` | Competitive/strategic AI war room | stub (`SKILL.md:54`) | — |
| 7 | `sirinx-alibaba-infrastructure` | Alibaba Cloud Bangkok ECS/OSS | stub (`SKILL.md:58`) | — |
| 8 | `sirinx-andromeda-dark-neural` | Creator/Coder/Operator 3-core neural fabric | draft v0.5 (`SKILL.md:75`) | — |
| 9 | `sirinx-autonomous-ops` | 24/7 self-healing ops, escalation | doc (121 lines) | **Telegram** (`SKILL.md:37,89,98-100`) |
| 10 | `sirinx-benchmark-guard` | Quality gate before delivery | doc | — |
| 11 | `sirinx-clawwork-monetization` | OpenClaw SaaS pricing/monetization | stub (`SKILL.md:52`) | — |
| 12 | `sirinx-cmo-marketing-funnel` | AIDA B2B solar funnel | stub (`SKILL.md:61`) | — |
| 13 | `sirinx-company-brain` | Central knowledge base for 47 Ronin | doc | — |
| 14 | `sirinx-content-pipeline` | Content ideation→publishing workflow | stub (`SKILL.md:79`) | — |
| 15 | `sirinx-context-engineering` | Token/context optimization for 47 agents | stub (`SKILL.md:65`) | — |
| 16 | `sirinx-dashboard-orchestration` | CEO/WARROOM real-time dashboard | stub (`SKILL.md:86`) | — |
| 17 | `sirinx-failure-registry` | Error tracking/patterns/auto-recovery | doc | **Telegram** (`SKILL.md:85`) |
| 18 | `sirinx-fb-group-scanner` | FB group lead scanning | stub (`SKILL.md:77`) | — |
| 19 | `sirinx-investment-proposal` | Thai solar/EV market-data proposals | doc | — |
| 20 | `sirinx-ipo-mental-model` | Input→Process→Output folder framework | active (`SKILL.md:78`) | — |
| 21 | `sirinx-lead-conversion` | Lead scoring/nurture/conversion | doc | **Telegram** (`SKILL.md:55`) |
| 22 | `sirinx-llm-switcher` | Dynamic model routing Claude/GPT/Qwen/DeepSeek/Gemini | stub (`SKILL.md:64`) | **model routing** (whole file); refs legacy `src/app/api/models/route.ts` (`SKILL.md:51`) |
| 23 | `sirinx-manus-portfolio` | TDD standards, project portfolio | stub (`SKILL.md:89`) | — |
| 24 | `sirinx-master-gem` | Brand creative studio: image gen, SEO/AEO, campaigns | reference (820 lines) | — |
| 25 | `sirinx-master-knowledge` | Master knowledge reference v10.0 | active (`SKILL.md:80`) — **stale paths** → `apps/sirinx-web/src/agents/*` (`SKILL.md:53-58`) does not exist | — |
| 26 | `sirinx-master-plan` | The canonical plan + working method | doc (references real `MASTER_PLAN.md`) | **Telegram** gate list (`SKILL.md:32`) |
| 27 | `sirinx-memory-architect` | Long-term agent memory (Supabase) | doc | — |
| 28 | `sirinx-meta-ads-marketing` | FB/IG ads for B2B solar | stub (`SKILL.md:71`) | — |
| 29 | `sirinx-multi-agent-coordinator` | 47-agent routing/conflict resolution | doc (120 lines) | — |
| 30 | `sirinx-multi-model-critique` | Multi-model draft→review→approve critique loops | doc (315 lines; impl checklist all unchecked `SKILL.md:302-310`) | **Kimi K2** (`:39,47,121,287`), **Kimi K3 + moonshotai/kimi-k3** (`:41,48`), **Telegram** (`:182,235,305`), **model routing** |
| 31 | `sirinx-n8n-automation` | n8n workflow automation | stub (`SKILL.md:99`) | **Telegram** (`SKILL.md:27,40,66,92`) |
| 32 | `sirinx-openclaw-automation-pipeline` | OpenClaw CI/CD deploy pipeline | stub (`SKILL.md:80`) | **Telegram** (`SKILL.md:74`) |
| 33 | `sirinx-pixle-office-ai` | Pixel-office virtual company UI + RBAC | stub (`SKILL.md:65`) | — |
| 34 | `sirinx-planner-executor` | Planner/Executor task decomposition | doc | — |
| 35 | `sirinx-prd-knowledge` | PRD/spec knowledge base | stub (`SKILL.md:75`) | **Telegram** env var (`SKILL.md:69`) |
| 36 | `sirinx-research-loop` | Continuous L5 research engine | doc | **Telegram** (`SKILL.md:79`) |
| 37 | `sirinx-research-web-app` | L5 research web app architecture | stub (`SKILL.md:59`) | — |
| 38 | `sirinx-revenue-engine` | Revenue tracking, THB targets | doc | — |
| 39 | `sirinx-robotics-iot` | Solar inverter/IoT integration | stub (`SKILL.md:44`) | — |
| 40 | `sirinx-sbct-intelligence` | Competitive/tech intelligence | stub (`SKILL.md:61`) | — |
| 41 | `sirinx-security-gate` | Security review for agent actions | doc | **Telegram** (`SKILL.md:70`) |
| 42 | `sirinx-seo-77-provinces` | 77-province SEO/AEO landing pages | reference (969 lines; depends_on master-gem `SKILL.md:25-28`) | — |
| 43 | `sirinx-serving-optimizer` | LLM serving/cost/latency optimization | doc | **model routing** (`SKILL.md:29-36`) |
| 44 | `sirinx-shopee-video-ai` | Shopee/TikTok video content | stub (`SKILL.md:88`) | — |
| 45 | `sirinx-telegram-integration` | Telegram bot alerts/commands | stub (`SKILL.md:92`) | **Telegram** (dedicated) |
| 46 | `sirinx-unified-os` | Master OS controlling 47 agents | stub (`SKILL.md:53`) | — |
| 47 | `sirinx-warroom-ceo-core` | CEO command interface | stub (`SKILL.md:62`) | — |
| 48 | `start-run-debug` | Start/stop/debug Hermes dashboard stack | doc — **stale**: `pnpm dashboard:*` scripts exist in no package.json here | — |
| 49 | `supabase-postgres-best-practices` | Postgres optimization best practices | reference (+36 aux files) | — |
| 50 | `website-browser-automation` | Playwright QA for Hermes dashboard | doc — same stale `pnpm dashboard:*` dependency | — |

**Flag summary:** Kimi K2/K3/moonshot → only `sirinx-multi-model-critique`. OpenRouter → mentioned in **no** skill (lives only in `services/dev-control-api/src/openrouter-fusion-router.mjs`). Telegram → 11 skills. Model routing → 4 skills.

**Registry mismatches:**
- `SKILLS_REGISTRY.md:4` says "49 total"; actual = **50** (`sirinx-master-plan` added in `7304799`, registry last touched `78601f7`). Same stale "49" in `MASTER_PLAN.md:20,23`, `INTEGRATION_MAP.md:12,57`, `RUST_MIGRATION_PLAN.md:72`. Runtime unaffected — `services/dev-control-api/server.mjs:82,170-177` reads `.claude/skills/` dynamically.
- `MASTER_PLAN.md:23` (A9) "47 Ronin sub-agents" done-claim is overstated (see §b).
- Stale references: `sirinx-master-knowledge` → non-existent `apps/sirinx-web/…`; `start-run-debug` + `website-browser-automation` → absent `pnpm dashboard:*` scripts; `sirinx-llm-switcher` → legacy repo path.
- Registry department→skill mapping (`SKILLS_REGISTRY.md:18-23`) is documentation-only; **no agent file declares a `skills:` binding**.

---

## (d) Model Lanes — incl. Kimi K3

**Commit `245d029` verification:** CONFIRMED with one nuance — it added `makeKimiK3OpenRouterLane()` to `team-runtime-bridge.mjs` and **replaced** the placeholder `~moonshotai/kimi-latest` with `moonshotai/kimi-k3` in the Fusion default panel (panel count stayed 5 — a swap, not an addition). `adaptive-command-gateway.mjs` was **not** touched, so "for all agent teams" holds only via the bridge lane + Fusion panel; Hermes policy remains qwen-only. No lane can actually call a provider today (`providerCallRouteExists: false`, `openrouter-fusion-router.mjs:350`).

| File | Lane / model id | Provider | Lock state (quoted) | Approval required | Purpose |
|---|---|---|---|---|---|
| `services/dev-control-api/src/team-runtime-bridge.mjs:58-78,253` | `qwen-3-7-max-openrouter` / `qwen/qwen3.7-max` | OpenRouter | `status: "approval-required-paid-api"`, `canCallProvider: false`, `canReadApiKey: false`, `autoExecute: false` (`:64,71-73`) | Yes — `paid_api_call` + `openrouter_provider_call` blocked (`:13,21`); `providerCallApprovalRequired: true` (`:278`) | Primary cloud lane: large-context coding/synthesis/review; 1M ctx |
| `team-runtime-bridge.mjs:80-100,253` | **`kimi-k3-openrouter` / `moonshotai/kimi-k3`** | OpenRouter | `status: "approval-required-paid-api"`, `canCallProvider: false`, `canReadApiKey: false`, `autoExecute: false` (`:86,93-95`) | Yes — same bridge gates; `allowedUse`: "Planning and approval packet only until explicit provider-call approval exists" (`:97`) | **New in 245d029.** Official Moonshot flagship lane shared by all agent teams; 1,048,576 ctx; test-locked `team-runtime-bridge.test.mjs:43-50,169` |
| `team-runtime-bridge.mjs:102-124,253` | `qwen-3-6-local-ollama` / `qwen3.6:latest` | Ollama (local) | `status: "observed-local-model"` / `"not-observed-this-run"` (dynamic, `:110`); `canCallProvider: false` | No paid approval (`paidApiRequired: false`, `:114`); limited to "Manual local smoke planning only" (`:120`) | Local private planning fallback; explicitly "not Qwen 3.7 Max" (`:111`) |
| `team-runtime-bridge.mjs:161-173` | `qwen-openrouter-manual` / `qwen/qwen3.7-max` (runtime lane) | OpenRouter | `status: "approval-required-paid-api"` (`:164`) + `...lock()` spread incl. `requiresHumanApproval: true` (`:42-56,205-209`) | Yes — `nextExactStep`: "Create model-routing approval before any OpenRouter provider call." (`:172`) | Runtime-lane mirror of Qwen cloud candidate |
| `team-runtime-bridge.mjs:145-160` | `hermes-agent-team` / no modelId | Hermes TUI/Desktop | `status: hermesReady ? "manual-ready" : "blocked-context-too-small"` (`:148`) + `...lock()` | Yes — manual smoke approval packet (`:158`); `hermes_team_auto_start` blocked (`:22`) | Team-routing lane gated on 64k min context (`REQUIRED_HERMES_CONTEXT_WINDOW = 64000`, `:5,128-129`) |
| `services/dev-control-api/src/openrouter-qwen-adapter.mjs:3,202,250-255` | PRIMARY `qwen/qwen3.7-max` | OpenRouter | `...lock()` → `canCallPaidApi: false`, `canReadSecrets: false`, `requiresHumanApproval: true` (`:80-94,247`) | Yes — `openrouter_provider_call`, `openrouter_api_key_read`, `provider_credit_spend` blocked (`:20-22`) | Adapter primary; first entry of `models` fallback array (`:202`); request-preview only |
| `openrouter-qwen-adapter.mjs:4,202` | FALLBACK `qwen/qwen3-max` | OpenRouter | same `...lock()` (`:247`) | Yes — same gates | Server-side fallback |
| `services/dev-control-api/src/openrouter-fusion-router.mjs:3,154,311` | Outer/alias `openrouter/fusion` | OpenRouter | checklist item `fusion_model_locked` passes only if `status.model === FUSION_MODEL` (`:251-255`); `...lock()` (`:66-81`) | Yes — `canApproveProviderCallNow: false`, `providerCallRouteExists: false`, `humanApprovalRequired: true` (`:342-352`); `non_dry_run_fusion_smoke` blocked (`:34`) | Fusion Router controller slug (model-alias entrypoint, `:329`) |
| `openrouter-fusion-router.mjs:9` | Panel `~anthropic/claude-opus-latest` | OpenRouter | panel bounded `max: 8` (`:106-111,257-261`); `unbounded_panel` blocked (`:36`) | Yes — same approvalPacket | Default analysis panel member |
| `openrouter-fusion-router.mjs:10` | Panel `~openai/gpt-latest` | OpenRouter | same | Yes | Default panel member |
| `openrouter-fusion-router.mjs:11` | Panel `~google/gemini-pro-latest` | OpenRouter | same | Yes | Default panel member |
| `openrouter-fusion-router.mjs:12` | Panel `deepseek/deepseek-v3.2` | OpenRouter | same | Yes | Default panel member |
| `openrouter-fusion-router.mjs:13` | **Panel `moonshotai/kimi-k3`** | OpenRouter | same | Yes | **New in 245d029** — swapped in for `~moonshotai/kimi-latest`; test asserts present/old absent (`openrouter-fusion-router.test.mjs:25-26`) |
| `openrouter-fusion-router.mjs:16,317-320` | Judge `~openai/gpt-latest` | OpenRouter | checklist `judge_model_configured` (`:263-267`) | Yes | Fusion judge: consensus/contradictions/blind_spots (`:319`) |
| `services/hermes-api/src/adaptive-command-gateway.mjs:36-43` | `MODEL_POLICY.router` → `qwen/qwen3.7-max` | OpenRouter | `baseSafety()`: `canCallProvider: false`, `shouldForwardToLlm: false`, `requiresHumanApproval: true` (`:420-441`) | Yes — `provider_call` in `BLOCKED_ACTIONS` (`:26`) and `DANGEROUS_PATTERNS` (`:98`) | Fast ack / parse / classify / validate; 512 maxTokens |
| `adaptive-command-gateway.mjs:44-51` | `MODEL_POLICY.planner` → `qwen/qwen3.7-max` | OpenRouter | same `baseSafety()` | Yes — missions land `WAITING_APPROVAL` + `approvalRequired: true` (`:456,472`) | mission_planning / spec / architecture; 4096 maxTokens |
| `adaptive-command-gateway.mjs:52-59` | `MODEL_POLICY.reviewer` → `qwen/qwen3.7-max` | OpenRouter | same `baseSafety()` | Yes | review / qa / risk_assessment; 3000 maxTokens |

**Env var NAMES referenced (names only):** `OPENROUTER_API_KEY` (`team-runtime-bridge.mjs:70,92,285,352`; `openrouter-qwen-adapter.mjs:230`; `openrouter-fusion-router.mjs:236`), `HERMES_SITE_URL`, `HERMES_APP_TITLE`. `TELEGRAM_BOT_TOKEN` appears only as a secret-detection pattern (`adaptive-command-gateway.mjs:91`).

**Hermes model selection:** static hardcoded `MODEL_POLICY` (`adaptive-command-gateway.mjs:35-60`) — router/planner/reviewer all pinned `qwen/qwen3.7-max`; no dynamic picker, no allow/deny list; `--provider` CLI flag is free text, unvalidated (`:332,403`) but all provider execution blocked anyway. Secret-like input redacted and never forwarded (`:85-92,597-611`).

**Lock-taxonomy note:** no literal `locked/unlocked/pinned` field exists; the table quotes actual fields. Bridge `modelLanes` (rows 1–3) do **not** get the `...lock()` spread — only `runtimeLanes` do (`team-runtime-bridge.mjs:205-209`). The `~vendor/x-latest` panel slugs use a non-standard `~` prefix — likely placeholders, same as the one 245d029 replaced (UNVERIFIED whether OpenRouter accepts them).

---

## (e) Integration Status per System

| System | Rating | What exists today | Evidence |
|---|---|---|---|
| **a2a-sync** | **PRESENT** (core works; no client loop, no persistence) | `POST /api/a2a/sync` registers peer `AgentCard` into in-memory OmniRoute + returns pending-work delta (`crates/sirinx-control/src/lib.rs:602-634`); `diff_work` + `SyncRequest/Response` types (`crates/sirinx-a2a/src/lib.rs:91-118`); tested (`lib.rs:1329-1390`). **Missing:** no transport in the crate itself, no LISTEN consumer for the emit-only `pg_notify` trigger (`crates/sirinx-store/migrations/0002_pending_work.sql:2`), cards not persisted across restart (`sirinx-control/src/lib.rs:68,99`), no code anywhere calls `/api/a2a/sync` except a curl example in `CODEX_HANDOFF.md:12-14` | `crates/sirinx-a2a/src/lib.rs:1-195`; `crates/sirinx-control/src/lib.rs:356-358,602-660` |
| **telegram** | **PARTIAL** (well-tested dry-run scaffold; go-live held) | Redacted config resolution + gate constant (`services/telegram-command-bot/src/config.mjs:63-101`); dry-run bot refuses live mode (`index.mjs:25-29`); preview writes `exports/telegram-preview-latest.json` (`scripts/telegram-notify-preview.mjs:23-40`); durable gate `telegram_send` default `hold` (`crates/sirinx-store/migrations/0003_control_gates.sql:19`); 4 independent block lists in dev-control-api. **Missing:** credentials outside repo, owner IDs, template approval, `OPS-TG-…` ticket; JS gate state is hardcoded `"hold"` (`config.mjs:32`) with no DB linkage; preview script doesn't consult durable gate | `docs/TELEGRAM_CONTROL_PLANE.md:76-82`; `GO_LIVE_GATE_CHECKLIST.md:42-48` |
| **hermes** | **PARTIAL** (contract + dry-run plumbing; nothing executes) | Inbox normalizer + policy gate (`services/hermes-api/src/inbox.mjs:86-323`, served at `server.mjs:615-651`); adaptive command gateway v0.2 with secret/dangerous-command blocking (`adaptive-command-gateway.mjs:85-105,597-629`); read-only status probes of local `hermes` CLI (`server.mjs:229-232,543-545`); night-watch classifier (`:486-537`). No `package.json` of its own — library served by dev-control-api. Phase lock: `dryRun:false` → 403 (`inbox.mjs:198-213,269-271`) | `services/hermes-api/` (5 files); `HERMES_AUTOPILOT_STATUS.md:25-34` |
| **codex** | **PRESENT** (protocol + gated registry; never executed) | `CODEX_HANDOFF.md` (canonical worker protocol: register as `agent:codex` via A2A sync, `:14`); `CODEX_WORK_REPORT.md` (PR-MONO-001/002 history); launch-gate + driver registry entries (`agent-launch-gate.mjs:24,28`; `agent-driver.mjs:22-28` classification `"passed"`, dry-run only, `canLaunchAgents: false`); `"codex"` in `command-schemas.ts:5`; `codex-local` whitelisted inbox source (`inbox.mjs:4`) | `CODEX_HANDOFF.md:1-50`; `services/dev-control-api/src/agent-driver.mjs:18,104-121` |
| **claude-cowork** | **MISSING** | Zero hits for "claude cowork" repo-wide. Only "Microsoft Copilot Cowork" as a competitive comparison in `.claude/skills/sirinx-multi-model-critique/SKILL.md:3,16,278-315`. No script, config, or code path | grep result (0 hits) |
| **opencode** | **PARTIAL** (registry entry only) | Launch-gate entry (`agent-launch-gate.mjs:27`); driver profile `classification: "needs_install"` — "No install was attempted; remains manual review only" (`agent-driver.mjs:59-65`); one next-gate label in a mission report (`reports/mission/A2A2A_P091T_FOOTER_LINE_QR_CTA_20260707.md:80`). No binary invocation, install script, or config | `services/dev-control-api/src/agent-driver.mjs:59-65` |
| **cmux** | **MISSING** (comment-only mention) | Sole hit: `scripts/agents-mux.sh:5-6` — "point MUX_BIN at a tmux-compatible binary (psmux, cmux) to use another multiplexer". No cmux-specific config anywhere | `scripts/agents-mux.sh:5-6` |
| **agents-mux** | **PRESENT** (working launcher) | `scripts/agents-mux.sh` (77 lines): tmux session `sirinx-agents` with windows `web` (`cargo run -p sirinx-web`, `:55`), `dashboard`+`control` health loop (only if `$SIRINX_ROOT/sirinx-os` checkout exists, `:58-65`), `telegram` dry-run (`:69`), `audit` every 15 min (`:72-74`); subcommands `start|attach|stop`. Does **not** launch codex/claude/opencode binaries | `scripts/agents-mux.sh:1-77`; `INTEGRATION_MAP.md:58`; `AGENT_TEAM_PLAN.md:44` |
| **omniroute** | **PRESENT** (working Rust router in control node) | `OmniRoute` capability router (`crates/sirinx-a2a/src/lib.rs:41-88`): register/route with specialization→priority→lexicographic tie-break, tested; live singleton `Arc<RwLock<OmniRoute>>` in sirinx-control (`lib.rs:67-68,90-99`); `POST /api/a2a/route` → card or 404 (`:642-660`); self-card from env + `skill:<name>` capabilities auto-loaded from `.claude/skills` (`:303-327`, `main.rs:48-56`); D1 `a2a_agent_cards` edge replica in brain-sync worker (populated independently — no code syncs the two registries) | `crates/sirinx-a2a/`; `crates/sirinx-control/src/lib.rs`; `infra/cloudflare/brain-sync-worker/src/worker.js:27-55` |
| **claude (Code)** | **PRESENT** (skills/sub-agents real; launcher gated) | `.claude/agents/` (6 files) + `.claude/skills/` (50 skills) drive OmniRoute capabilities (`crates/sirinx-control/src/main.rs:49-51`); `claude-code` driver profile `"passed"` but gated like codex (`agent-driver.mjs:29-35`); `~anthropic/claude-opus-latest` in Fusion panel (`openrouter-fusion-router.mjs:9`) | `AGENT_TEAM_PLAN.md:8-10` |

**Caveat on "agent launching":** all codex/claude/opencode launching via `ollama launch …` is registry metadata inside a hard-locked dry-run gate — `canLaunchAgents: false`, `commandExecuted: false` everywhere (`agent-driver.mjs:104-121`); the cited evidence doc `docs/knowledge/SIRINX_AGENT_DRIVER_V1.md` does not exist on disk. **No external agent binary is ever executed by repo code.**

---

## Annex A — A2A Mesh & Node Topology

**Nodes** (`NODE_TOPOLOGY.md:9-15`; same five roles in `ALL_DEVICE_TOPOLOGY.md:18-22`):

| Node | Role | Constraints |
|---|---|---|
| Mac mini M2 | Control Plane | local dev dashboard, release gates, approval queue; Cloudflare Tunnel only after approval |
| Windows PC | Worker Node | GPU/media jobs, MySQL replica planning, dry-run renders; no public ports, no prod writes |
| Mobile | Command & approval node | view status, approve queued actions, emergency stop; no raw FS/shell/prod writes |
| Cloudflare | Edge & Zero Trust | Pages, Tunnel, Access, WAF, R2 after approval |
| GitHub | Source of truth | issues, branches, PR review, CI |

Sync policy (`ALL_DEVICE_TOPOLOGY.md:24-29`): source via GitHub, mirrors dry-run until approved, mobile gets dashboard/Telegram/GitHub views only, **secrets never sync**.

**Endpoints/ports in repo:** sirinx-control `127.0.0.1:8711` (`crates/sirinx-control/src/lib.rs:295`, `main.rs:46`); sirinx-web `:8080` (`SYSTEM_SCHEMA.md:148`); Hermes dashboard `8710` → control `8711` (`INTEGRATION_MAP.md:56`); Hermes A2A coordinator (Python, **external repo**) `127.0.0.1:9000` (`INTEGRATION_MAP.md:48-51`); brain-sync worker default `https://sirinx-brain-sync.workers.dev` (`infra/cloudflare/brain-sync-worker/src/worker.js:32`).

**Heartbeat contract** (`NODE_HEARTBEAT_SCHEMA.md`, status **draft**, `:3`): fields `nodeId, nodeType, hostname, status, capabilities[], blockedCapabilities[], currentJobs[], queueDepth, lastCheckedAt, version` (`:9-21`); required subset at `:26-32`; forbidden payload (tokens, cookies, `.env` values, personal data, chat logs, source contents) at `:36-42`. Matching TS type exists (`packages/types/src/command-schemas.ts:15-26`); `NODE_HEARTBEAT_SHARED_SECRET` reserved in `.env.example:20`; **no heartbeat endpoint implemented** — "Heartbeat endpoint planned" (`MAC_HANDOFF_CHECKLIST.md:32`).

**`a2a sync` today vs plan:** today = card registry exchange + pending-work delta over HTTP (`sirinx-control/src/lib.rs:602-634`). It does not push work, execute routed tasks, persist cards, or listen to NOTIFY. Planned: register hermes-os `:9000` card (B5, `MASTER_PLAN.md:37`), NOTIFY reaction (`RUST_MIGRATION_PLAN.md:75-77`), Hermes A2A bridge (`INTEGRATION_MAP.md:51`).

**Brain @ Edge worker** (`infra/cloudflare/brain-sync-worker/`, commit `35f05b3`): same delta-sync contract as sirinx-a2a; own card `brain-edge` (`worker.js:27-35`); `POST /api/brain/sync` (card upsert into D1 `a2a_agent_cards`, last-write-wins + tombstones, FTS5, `:37-159`); `GET /api/brain/search`, `GET /api/brain/notes`; auth `Bearer BRAIN_SYNC_TOKEN` (`:190-200`). D1 schema header claims applied live to `sirinx-unified-db` on 2026-07-18 (`schema.sql:1-3`); deploy gated on `deploy` gate + `wrangler secret put BRAIN_SYNC_TOKEN` (`wrangler.toml:5-8`; `INTEGRATION_MAP.md:60-67`). Live deployment UNVERIFIED.

## Annex B — Telegram Config State

`resolveTelegramGatewayConfig(env)` (`services/telegram-command-bot/src/config.mjs:63-101`) — **every secret redacted to boolean/count** (test: `config.test.mjs:83-97`):

| Field | Env var NAME | Default | Redacted |
|---|---|---|---|
| `credentials.botTokenConfigured` | `TELEGRAM_BOT_TOKEN` | unset → `false` | Yes (boolean) |
| `credentials.chatIdConfigured` | `TELEGRAM_CHAT_ID` | unset → `false` | Yes (boolean) |
| `credentials.ownerIdsConfigured` / `ownerCount` | `TELEGRAM_OWNER_IDS` | empty → `false` | Yes (boolean + count) |
| `confirmSend` | `SIRINX_TELEGRAM_CONFIRM` | must be exactly `"SEND"` (`:68,74`) | Yes (boolean) |
| `allowedCommands` | `TELEGRAM_ALLOWED_COMMANDS` | `["/status","/gates","/sync-plan","/stop"]` (`:14,58-61`) | n/a |
| `mode` | derived | `"dry-run"` if any env missing; `"env-ready-gate-held"` if all present (`:83`) | n/a |
| gate `telegram_send` | none — **hardcoded constant** | `state: "hold"`, `ticketPrefix: "OPS-TG-"` (`:30-39`) | n/a |
| `blockedActions` | none | `deploy, push, cloudflare-write, production-db-write, customer-send, paid-api, direct-shell` (`:16-24`) | n/a |
| `nightWatchAlertLevels` | none | `["success","success_warning","failure"]` — aligned with `classifyNightWatchCallback().telegramLevel` (`:28`; `adaptive-command-gateway.mjs:528`) | n/a |
| `liveSendReady` | derived | `envReady && gate.state==="open"` (`:76-77,96`) — can never be true from this module while gate is a hardcoded `"hold"` | n/a |

**Durable gates** (`crates/sirinx-store/migrations/0003_control_gates.sql:17-21`): `deploy`, `cloudflare_dns`, `telegram_send`, `customer_messaging`, `adaptive_sync` — all default `hold`; CHECK forces `open ⇒ ticket non-blank` (`:9-12`); RLS server-only (`:25`); mirrored in Rust `DEFAULT_GATES` all `Hold` + fail-closed `local_hold_overrides` (`crates/sirinx-control/src/lib.rs:46-62`).

**Works today (all dry-run):** `npm run telegram:config`, `telegram:bot:dry-run` (live refuses exit 1, `index.mjs:25-29`), `telegram:preview` (writes `exports/telegram-preview-latest.json`), `telegram:test` (7 vitest cases). Real send path triple-gated: `--send` + env credentials + `SIRINX_TELEGRAM_CONFIRM=SEND` (`telegram-notify-preview.mjs:7,42-46`).

## Annex C — Hermes Detail

**What Hermes does today (code-level):**
- Inbox dry-run normalizer + policy gate: `normalizeHermesInboxRequest()` (`services/hermes-api/src/inbox.mjs:86-179`), `evaluateHermesInboxDryRun()` (`:246-323`) — non-local sources without verified signature → 401 (`:265-267`); `dryRun:false` → 403 `phase_1_dry_run_only` (`:269-271`); caption-bound image-edit special case with text-to-image fallback blocked (`:104-133`); all outcomes return `externalWrites: false`. Served at `POST /api/hermes-inbox/dry-run` with `signatureVerified: false` hard-coded (`server.mjs:615-651`); 202 auto-opens approval request (`:623-632`).
- Adaptive Command Gateway v0.2: slash-command parser (`/clear /status /jobs /kanban … /mission … /hermes approve|cancel|sync`, `adaptive-command-gateway.mjs:4-20,231-418`); secret-leak guard (`:85-92,193-219`); 10 dangerous-command categories blocked (`:94-105,614-629`); dry-run missions end at `WAITING_APPROVAL` with `workerExecution` all-false (`:452-484,648-697`).
- Read-only live probes: `GET /api/hermes` shells to local `hermes` CLI + checks dashboard `HERMES_DASHBOARD_URL` (default `http://127.0.0.1:9119`) + tmux `hermes-gateway-safe` (`server.mjs:77,229-232,284-289,543-545`).
- dev-control-api hermes-* modules: `hermes-agent-audit.mjs` (evidence-checklist audit; stop point "MANUAL GATEWAY RESTART APPROVAL REQUIRED", `:213`); `hermes-image-edit.mjs` (caption-bound edit contract; "STOP BEFORE LIVE PROVIDER CALL", `:233`); `hermes-spec-first-swarm.mjs` (16-phase state machine; code blocked until `APPROVE_IMPLEMENTATION`, `:3,126-143`); `gateway-agent.mjs` (aggregating plan, dry-run).

**Night-watch callback policy** (`adaptive-command-gateway.mjs:486-537`): parses `Hermes night-watch status: OK|WARN|FAILED`; `exitCode≠0 || FAILED` → failed + `telegramLevel: "failure"` + `shouldNotifyFailure: true`; WARN → `completed_with_warning` — "optional/degraded services should not be reported as script failure" (`:533-535`); default log `.hermes/logs/night-watch-latest.md` (`:512`). Note: referenced `pnpm night-watch` script exists in no package.json here (only `project-inventory.mjs:400`) — UNVERIFIED where it lives.

**ghostclaw-hermes-v3-command-center** (`sites/ghostclaw-hermes-v3-command-center/`): **fully static briefing — not mock, but not wired to any API.** Zero `fetch`/`useEffect`/`useState` in `app/`; all content hard-coded (`app/page.tsx:8-80`); self-declares "curated planning snapshot—not live telemetry" (`:120-121`); production origin pinned `https://ghostclaw-hermes-command-center.e-galli.chatgpt.site` (`app/layout.tsx:10-12`), `index:false`; `MASTER_PLAN.md:29` confirms deployed read-only owner briefing (PR #8).

**Hermes stop points (consolidated):** phase lock `dryRun!==false` (`inbox.mjs:198-213`); signature auth (`inbox.mjs:265-267`, `server.mjs:620`); policy-core hard blocks (secret read/print, raw-chat-to-memory — `packages/policy-core/src/index.mjs:134-156`); policy-core approval gates (external/production, customer-visible, paid API, destructive — `:158-201`); gateway banner "WAITING FOR GATEWAY RELOAD APPROVAL" (`adaptive-command-gateway.mjs:1-2`); `/hermes approve` intent-only, `executionBlocked: true` (`:352-364,559`); autopilot boundary (`HERMES_AUTOPILOT_STATUS.md:25-34`); B5 node bridge queued (`MASTER_PLAN.md:37`).

---

## (f) Consolidated Gap + Blocker List (mapped to owner docs)

| # | Gap / blocker | Evidence | Owner doc mapping |
|---|---|---|---|
| G1 | **47-Ronin reality gap:** 6 sub-agent files, 4 coded agents, 12 known codenames; A9 done-claim overstated | `MASTER_PLAN.md:23`; `crates/sirinx-agents/src/ronin.rs:40,61,112,147`; `roster.rs:37-54` | `RUST_MIGRATION_PLAN.md:58` (migration open); queue B4 (`MASTER_PLAN.md:36`) |
| G2 | **Skills count drift:** 50 actual vs "49" in registry + 4 docs; 24 stubs; 3 skills reference stale paths | `SKILLS_REGISTRY.md:4`; `MASTER_PLAN.md:20,23`; `INTEGRATION_MAP.md:12,57`; `RUST_MIGRATION_PLAN.md:72`; `sirinx-master-knowledge/SKILL.md:53-58`; `start-run-debug/SKILL.md` | No queue item — doc-debt |
| G3 | **No executable model path:** all lanes locked; `providerCallRouteExists: false`; K3 absent from Hermes `MODEL_POLICY`; `~vendor/x-latest` slugs likely placeholders | `openrouter-fusion-router.mjs:350`; `adaptive-command-gateway.mjs:35-60`; `team-runtime-bridge.mjs:172` | Gate `deploy`/paid-API approval chain (`GO_LIVE_GATE_CHECKLIST.md`); C3 (`MASTER_PLAN.md:48`) |
| G4 | **Telegram go-live gaps:** credentials + owner IDs + template approval + `OPS-TG-…` ticket; JS gate hardcoded `"hold"` (no DB linkage); preview script bypasses durable gate | `config.mjs:32`; `telegram-notify-preview.mjs:30-31,42`; `GO_LIVE_GATE_CHECKLIST.md:42-48` | C5 (`MASTER_PLAN.md:50`); `docs/TELEGRAM_CONTROL_PLANE.md:76-82` |
| G5 | **SECURITY: hardcoded bot-token patterns in sirinx-solar-energy audit copy — rotation required** | `services/dev-control-api/src/project-inventory.mjs:258-262,407`; `external-gate-preflight.mjs:24-42` (403 recorded) | `SECURITY_QUARANTINE_REPORT.md`; `NEXT_ACTIONS.md:6` (immediate review) |
| G6 | **A2A missing pieces:** no client sync loop, no NOTIFY listener, no card persistence, heartbeat endpoint unimplemented | `sirinx-control/src/lib.rs:602-660`; `MAC_HANDOFF_CHECKLIST.md:32`; `NODE_HEARTBEAT_SCHEMA.md:3` (draft) | B5 (`MASTER_PLAN.md:37`); `RUST_MIGRATION_PLAN.md:75-77` |
| G7 | **Brain-sync worker undeployed** (gated); D1 schema claimed applied 2026-07-18 | `wrangler.toml:5-8`; `schema.sql:1-3`; `INTEGRATION_MAP.md:60-67` | C3 (`MASTER_PLAN.md:48` — `BRAIN_SYNC_TOKEN`); `deploy` gate |
| G8 | **GhostClaw blocked:** committed Android keystore must be rotated+purged first | `MASTER_PLAN.md:39` (B7 "blocked: rotate+purge committed Android keystore first"); `INTEGRATION_MAP.md:35-45` | C4 (`MASTER_PLAN.md:49`) |
| G9 | **Hermes is contract-only:** no execution anywhere; `pnpm night-watch` script missing; locked contract doc `docs/knowledge/SIRINX_HERMES_INBOX_CONTRACT_2026-05-20.md` not in repo | `inbox.mjs:198-213`; `project-inventory.mjs:400`; hermes-api README | B5; `HERMES_AUTOPILOT_STATUS.md:7-11,25-34` |
| G10 | **claude-cowork & cmux absent; opencode needs_install**; no external agent binary ever executed | grep (0 hits); `agent-driver.mjs:59-65,104-121`; `scripts/agents-mux.sh:5-6` | No queue item — decision needed whether these lanes are wanted |
| G11 | **All 5 control gates held; every checklist box unchecked; 19/19 prerequisites open** | `GO_LIVE_GATE_CHECKLIST.md:23-65`; `0003_control_gates.sql:17-21` | C5 (`MASTER_PLAN.md:50`); open order: deploy → cloudflare_dns → telegram_send → customer_messaging (adaptive_sync independent) |
| G12 | **Human-only operator queue pending:** C1 GitHub Actions, C2 TCC revoke, C3 secrets provisioning, C4 tunnel strategy + keystore, C5 gate tickets | `MASTER_PLAN.md:44-50` | `NEXT_ACTIONS.md:5-20` (7 immediate reviews + 4 after-approval items); 8 prohibitions `NEXT_ACTIONS.md:24-31` |

---

## (g) Suggested Next 5 Actions (respecting hold-by-default gates)

1. **Land B3 (top unblocked engineering item):** port remaining routes from `automation-system-backend` + `sirinx` api-gateway into `sirinx-web` until "route inventory diff = empty" (`MASTER_PLAN.md:35`), via the sirinx-master-plan method (L3 plan → L4 implementation → full verify chain `SKILL.md:22-25`). Pure local code work — no gate touched.
2. **Fix the doc-debt in one docs-only commit:** update "49"→"50" in `SKILLS_REGISTRY.md:4`, `MASTER_PLAN.md:20,23`, `INTEGRATION_MAP.md:12,57`, `RUST_MIGRATION_PLAN.md:72`; correct the A9 wording to reflect 6 sub-agent files / 4 coded agents / 47-slot roster; repair the 3 stale skill paths (`sirinx-master-knowledge`, `start-run-debug`, `website-browser-automation`). Documentation-only — allowed without approval per `AGENTS.md` Autonomy.
3. **Prepare (do not open) the Telegram evidence packet:** run `npm run telegram:preview` and archive `exports/telegram-preview-latest.json`; draft the message templates for approval; file the two structural fixes as plan items — wire `config.mjs` gate state to the durable gate, add a durable-gate check to `telegram-notify-preview.mjs`. Also prepare the **bot-token rotation** evidence card (G5) for the human to execute outside the repo. Everything stays dry-run; opening `telegram_send` remains a human `OPS-TG-…` decision.
4. **Build the A2A client loop + persistence as dry-run-first engineering (feeds B5):** add card persistence and a Mac-side sync client that calls `POST /api/a2a/sync`, plus a NOTIFY listener behind a flag; keep heartbeat endpoint as a drafted contract implementation without secrets (`NODE_HEARTBEAT_SCHEMA.md` forbids are already specified). No external mutation involved.
5. **Queue the operator packet for the human:** consolidate C1–C5 (`MASTER_PLAN.md:44-50`) and the 7 immediate `NEXT_ACTIONS.md` reviews into one decision packet — GitHub Actions enablement, TCC revoke date, host secret provisioning (`DATABASE_URL`, `CONTROL_API_TOKEN`, `BRAIN_SYNC_TOKEN`), tunnel strategy choice, GhostClaw keystore rotation — so gate openings can proceed in the documented order once the human decides. Agents prepare; only the human opens.

---

## Truth Protocol — Verified vs UNVERIFIED

**Verified from repo (file:line cited throughout):**
- 6 agent files in `.claude/agents/`; roles/levels/tools as tabled.
- 47-slot roster as plan + Rust schema + JS descriptors; exactly 4 coded Ronin agents; 12 known codenames.
- 50 skill directories; per-skill status flags as tabled; registry/docs say 49 (drift confirmed in 5 files).
- Kimi K3 lane in `team-runtime-bridge.mjs:80-100,253` and Fusion panel `openrouter-fusion-router.mjs:13`; commit `245d029` diff confirms swap of `~moonshotai/kimi-latest`; `adaptive-command-gateway.mjs` untouched by that commit.
- All model lanes locked; no provider-call code path (`providerCallRouteExists: false`); no `model:` key in agent frontmatter.
- Telegram config redaction, hardcoded gate `"hold"`, dry-run refusals, durable gate defaults; `telegram_send=hold` in both SQL and Rust `DEFAULT_GATES`.
- Hermes: 5 files, no own `package.json`, phase lock, stop points, static ghostclaw command center (no fetch/state hooks).
- a2a-sync/OmniRoute behavior as coded; brain-sync worker code + gated deploy; heartbeat contract draft with no endpoint.
- Integration grep results: claude-cowork 0 hits; cmux comment-only; opencode registry-only; codex/claude present as protocol/registry; agents-mux functional.
- MASTER_PLAN B/C queues, NEXT_ACTIONS, GO_LIVE_GATE_CHECKLIST states as tabled (all gates held, all boxes unchecked).
- Recent commits match the brief (`git log --oneline -8`).

**UNVERIFIED (could not be confirmed from this repo):**
- Live deployment of brain-sync worker to Cloudflare (repo says gated; `schema.sql:2` header claims D1 applied 2026-07-18 — not independently verifiable here).
- Existence/pricing of `qwen/qwen3.7-max` and `moonshotai/kimi-k3` on OpenRouter; `sourceVerification` strings are hardcoded claims (`team-runtime-bridge.mjs:68,90`); code itself warns "recheck before paid call" (`openrouter-qwen-adapter.mjs:253`).
- Whether OpenRouter accepts `~vendor/x-latest` slugs (look like placeholders).
- "Live smoke" claim for A6 (`MASTER_PLAN.md:20`) — no logs/artifacts in-repo.
- External systems: hermes-os (`127.0.0.1:9000`, Obsidian vaults), GhostClaw repo, Postman collection, `~/.hermes/profiles`, legacy `/Users/sirinx/sirinx-os` tree — outside this repo.
- Whether any wrapper enforces the durable gate on `telegram-notify-preview.mjs --send` (procedural only, as far as repo shows).
- Where `pnpm night-watch` is defined (referenced only in `project-inventory.mjs:400`).
- Where the locked Hermes inbox contract doc `docs/knowledge/SIRINX_HERMES_INBOX_CONTRACT_2026-05-20.md` lives (absent here).
- thClaws version observation (`requiredVersion: "0.61.0"` vs `localObservedVersion: "0.8.8"`, `openrouter-fusion-router.mjs:335-339`) — hardcoded, not re-verified this run.
- `OPENROUTER_API_KEY` presence in the host environment (correctly not checked — secret-presence is a manual gate step).
- Runtime contents of `SKILLS_DIR` feeding OmniRoute capabilities (depends on host, not repo state).

*Report generated 2026-07-19 by read-only deep research. No gates opened, no messages sent, no deploys, no git writes, no secrets read.*
