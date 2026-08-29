# Multi-Agent AI Orchestration — GitHub Landscape Report
**Date:** 2026-07-19 · **Prepared for:** SIRINX OS (Hermes orchestrator + 4-lane worktree mesh)
**Method:** GitHub REST API (`api.github.com`) for all star counts unless marked *(snippet)*. Note: the fetch proxy serves slightly cached API snapshots for some repos — treat counts as ±a few % and `pushed_at` dates on a few entries as stale-cached. Every repo claim has a URL.

---

## 1. Ranked: coding-agent orchestrators / parallelizers (the "lane-runner" niche)

This is SIRINX's direct competitive/peer set: tools that run multiple Claude Code / Codex / OpenCode / Kimi-CLI-style agents in parallel, mostly with git-worktree isolation.

| # | Repo | Stars (2026-07-19) | Pattern | Stack | Maintenance |
|---|------|-------:|---------|-------|-------------|
| 1 | [BloopAI/vibe-kanban](https://github.com/BloopAI/vibe-kanban) | 26,111 | Kanban issues → agent workspaces (branch+terminal+dev server), diff review, PR merge | **Rust** backend + TS/React frontend, Apache-2.0 | ⚠️ **Sunsetting** — banner on README. Active through ~2026-04 |
| 2 | [manaflow-ai/cmux](https://github.com/manaflow-ai/cmux) | 19,464 | Ghostty-based native macOS terminal; vertical tabs, notification rings, in-app browser, CLI + socket API; tmux-shim for Claude teammate mode | Swift | ✅ Active (created 2026-01-28; 7.7k★ in first month) |
| 3 | [smtg-ai/claude-squad](https://github.com/smtg-ai/claude-squad) | 7,518 | tmux + git worktrees + TUI; `cs` binary, profiles per agent CLI, yolo/auto-accept mode | Go, AGPL-3.0 | ✅ Active |
| 4 | [stablyai/orca](https://github.com/stablyai/orca) | 6,713 | "ADE" desktop + mobile (iOS/Android) for fleets of parallel agents; 30+ CLIs incl. Claude Code, Codex, OpenCode; SSH remote worktrees, GitHub+Linear integration | TypeScript, MIT (YC-backed) | ✅ Active (created 2026-03-17). *A blog claimed 15.7k★ — API says 6.7k; blog inflated* |
| 5 | [superset-sh/superset](https://github.com/superset-sh/superset) | 2,459 | Electron desktop "IDE for the agent era"; 10+ parallel agents, worktree isolation, workspace setup/teardown presets, diff viewer, IDE handoff | TypeScript/Bun, **Elastic License 2.0** (source-available, not OSI) | ✅ Active |
| 6 | [craigsc/cmux](https://github.com/craigsc/cmux) | 585 | "tmux for Claude Code" — shell worktree manager with tab-completion, merge subcommands | Shell, MIT | Low activity |
| — | Conductor (Melty Labs, [conductor.build](https://www.conductor.build/)) | n/a | Polished macOS app, workspaces + review flow; popular but **closed-source** ([meltylabs org](https://github.com/meltylabs) hosts only tutorials) | Proprietary | Commercial, active |

**Swarm/harness layer (agents orchestrating agents inside one CLI):**

| Repo | Stars | Notes |
|------|-------:|-------|
| [code-yeongyu/oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) | 45,194 (API; GitHub UI snippets showed 50–57k) | OpenCode plugin, formerly oh-my-opencode. "Team Mode" with ~11 specialized agents, multi-model routing (Claude/Kimi/GLM for orchestration, GPT for reasoning). Explicitly anti-lock-in: "orchestrate them all." TS, very active |
| [ruvnet/claude-flow](https://github.com/ruvnet/claude-flow) | 14,351 | Swarm orchestration platform for Claude; hierarchical agent teams, MCP-native, RAG. TS, MIT, active |
| [openclaw/openclaw](https://github.com/openclaw/openclaw) | 236,436 | Peter Steinberger's local-first personal-AI gateway (ex-Clawdbot/Moltbot). Fastest repo ever to 100k★ (~2 days). Not a coding orchestrator per se, but *the* reference for agent-mesh UX: chat-surface control (WhatsApp/Telegram/Slack) of a persistent local agent. TS, MIT |

## 2. Ranked: general multi-agent frameworks

| Repo | Stars | Pattern | Status |
|------|-------:|---------|--------|
| [OpenHands/OpenHands](https://github.com/OpenHands/OpenHands) | 78,207 | Full AI-dev agent platform (Python); sandboxed execution, its own multi-agent delegation | ✅ Active |
| [microsoft/autogen](https://github.com/microsoft/autogen) | 54,710 | Conversational multi-agent framework | ⚠️ Maintenance mode (bug/security fixes only); successor is Agent Framework; community fork AG2 continues the line |
| [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI) | 44,433 | Role-based "crews" + flows; fastest on-ramp | ✅ Active |
| [block/goose](https://github.com/block/goose) | 30,659 | MCP-native extensible agent; **Rust** core — proof Rust is a credible agent-core language | ✅ Active |
| [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) | 21,267 | Graph-based durable agent runtime; checkpointing, human-in-loop; consensus "production" pick | ✅ Active |
| [openai/openai-agents-python](https://github.com/openai/openai-agents-python) | 19,068 | Lightweight handoffs/guardrails/tracing (ex-Swarm lineage) | ✅ Active |
| [google/adk-python](https://github.com/google/adk-python) | 17,776 | Code-first agent toolkit, A2A-native | ✅ Active |
| [microsoft/agent-framework](https://github.com/microsoft/agent-framework) | 7,218 | AutoGen + Semantic Kernel successor; MAF 1.0 GA'd ~April 2026; Python + .NET | ✅ Active |

## 3. Agent-to-agent protocols

| Repo | Stars | Notes |
|------|-------:|-------|
| [a2aproject/A2A](https://github.com/a2aproject/A2A) | 24,850 | Google's Agent2Agent protocol, now Linux Foundation. v1.0 early 2026; 150+ supporting orgs (AWS, MS, Salesforce, SAP). JSON-RPC over HTTP + SSE, Agent Cards at `/.well-known/agent.json`. SDKs for Python/Go/JS/Java/.NET/**Rust (`a2a-lf`)** |
| [modelcontextprotocol/modelcontextprotocol](https://github.com/modelcontextprotocol/modelcontextprotocol) | 8,628 (spec repo) | Anthropic's MCP — de facto agent↔tool standard; first-party support from Anthropic/OpenAI/Google/MS |

Both live under the **Agentic AI Foundation (AAIF)**, launched Dec 2025 under the Linux Foundation. Consensus in 2026: MCP = agent↔tools, A2A = agent↔agent; complementary, not competing. ([protocol comparison](https://presenc.ai/research/a2a-vs-mcp-agent-communication-2026), [A2A adoption](https://aigrowthagent.co/articles/a2a-protocol-explained-2026/))

## 4. Rising repos, 2026-04 → 2026-07 (GitHub search: created after 2026-04-01, sorted by stars)

| Repo | Stars | What it does |
|------|-------:|--------------|
| [microsoft/conductor](https://github.com/microsoft/conductor) | 328 | **Microsoft's own entry**: CLI for defining/running multi-agent workflows on GitHub Copilot SDK + Anthropic Agents SDK. Python, MIT. Created 2026-02, pushed 2026-07-17 — very fresh, vendor-backed |
| [Sma1lboy/kobe](https://github.com/Sma1lboy/kobe) | 85 | Terminal IDE for coding agents: fan out many in parallel, each in own worktree, one screen. Engine-agnostic. TS, MIT |
| [ClipboardHealth/groundcrew](https://github.com/ClipboardHealth/groundcrew) | 55 | Dispatch task backlog (Jira/Linear) to local interactive agents; one worktree per task, **sandboxed by default**. TS, MIT |
| [TheAhmadOsman/parallel-agent-worktree-skill](https://github.com/TheAhmadOsman/parallel-agent-worktree-skill) | 32 | Portable Agent Skill: plan/spawn/review/merge parallel CLI agents in worktrees with deterministic Python/Bash runners, condition-gated. **Ships a Kimi CLI example**; adaptable to Codex/Claude/OpenCode |
| [ai-creed/ai-14all](https://github.com/ai-creed/ai-14all) | 30 | Mission-control desktop app for parallel agents across worktrees. TS |
| [alamops/agetor](https://github.com/alamops/agetor) | 25 | Local-first kanban "harness orchestrator" for Claude Code/Codex in worktrees. TS, MIT |
| [kkd927/kmux](https://github.com/kkd927/kmux) | 15 | Terminal workspace w/ session resume, API-usage dashboards, automated worktrees. TS, MIT |
| [0xmmo/crew](https://github.com/0xmmo/crew) | new/small | Counter-trend: lets Claude Code agents talk to each other directly — "no branches, no worktrees" |
| [battysh/batty](https://github.com/battysh/batty) | 48 | Rust, MIT. Kanban-driven, tmux-native, **test-gated** supervisor with architect→manager→engineer hierarchy. A [trending-list blog](https://insights.reinventing.ai/resources) hyped it as "viral" (chess-engine origin story), but API shows 48★ and last push 2026-04-25 — *treat blog hype with suspicion* |

Honorable mentions found during discovery: [Asynkron.Swarm](https://github.com/asynkron/Asynkron.Swarm) (.NET; N agents **compete** on same task, supervisor evaluates & merges best), [AryaLabsHQ/agentree](https://github.com/AryaLabsHQ/agentree), [aixolotls/wtx](https://github.com/aixolotls/wtx) (reusable worktree pool — good for big repos), [automazeio/ccpm](https://github.com/automazeio/ccpm) (PRD→epic→task PM system on GitHub Issues), [danilotorrisi/claude-session-manager](https://github.com/danilotorrisi/claude-session-manager) (HTTP/SSE API over tmux sessions — a control-plane pattern), [alltuner/factoryfloor](https://github.com/alltuner/factoryfloor) (native macOS, Ghostty engine).

## 5. Winning patterns in 2026

1. **Git-worktree isolation is the settled default.** Every serious tool uses it. The acknowledged *unsolved* frontier is runtime isolation: port collisions, shared databases, env files ([Upsun wishlist](https://developer.upsun.com/posts/2026/git-worktrees-for-parallel-ai-coding-agents), [Grass blog](https://codeongrass.com/blog/parallel-coding-agents-worktree-isolation-ownership/)).
2. **Attention management is the new battleground.** cmux's entire pitch is notification rings, unread badges, jump-to-latest-unread via OSC 9/99/777 escape codes — the bottleneck moved from generation to *knowing which of 5 agents needs you*.
3. **Kanban → dispatch.** vibe-kanban, batty, agetor, groundcrew all front a task board (or Jira/Linear) and dispatch cards to isolated agents. Review/merge is the human's job; generation is the agent's.
4. **Programmable control planes.** Winners expose the orchestrator itself as an API: cmux CLI+socket, Superset CLI/MCP/SDK, CSM's HTTP+SSE. tmux screen-scraping is the fallback, not the interface.
5. **Review-gate & test-gate automation.** Test-gated completion (batty), tiered reviews (qrspi-plus), diff-first merge discipline ([playbook](https://www.developersdigest.tech/blog/git-worktrees-claude-code-parallel-agents-guide)) — matches SIRINX's existing dry-run/approval posture.
6. **Multi-model routing, provider-agnostic.** oh-my-openagent (45k★) rides Claude/Kimi/GLM/GPT/Gemini simultaneously and explicitly markets anti-lock-in. Orchestrator models ≠ worker models.
7. **Mobile/web control planes** (Orca, Grass, vibe-kanban cloud relay) — approve/deny from the phone.
8. **Hierarchical teams** (architect→manager→engineer) in batty, claude-flow, oh-my-openagent Team Mode; plus vendor-native parallelism: Claude Code's experimental teammate mode (tmux-based, which cmux shims), Copilot app worktrees, Cursor multi-agent.
9. **Protocols consolidating:** MCP + A2A both under AAIF/Linux Foundation; A2A hit v1.0 with a Rust SDK — file-based A2A sync like SIRINX's is the scrappy-but-valid low end of the same spectrum.
10. **Consolidation risk is real:** vibe-kanban (26k★) is sunsetting; AutoGen is in maintenance mode. Full-GUI plays are capital-intensive; CLI/TUI + API plays survive.

## 6. What SIRINX should adopt next

Mapped to: (a) Hermes orchestrator, (b) 4 lanes in worktrees running codex/opencode/claude/kimi, (c) file-based A2A sync, (d) Rust monorepo, (e) dry-run/approval-gated dispatch.

1. **Attention/notification model (steal from cmux).** Emit OSC 9/99/777 from lane runners → Hermes aggregates an attention queue ("which lane is blocked/done"). Highest-value single feature; cmux hit 19k★ in ~4 months largely on this.
2. **Keep file-based A2A, add an MCP facade.** Expose Hermes's task board / lane status as an MCP server (vibe-kanban and Superset both did this) so any lane CLI can query peers natively; files remain the durable fallback. If external interop ever matters, A2A has a Rust SDK (`a2a-lf`) that fits the monorepo.
3. **Test-gated completion (batty/vibe-kanban).** A lane cannot transition a card to "done" unless the repo's verification chain passes in its worktree. Natural extension of the existing dry-run/approval gates.
4. **Workspace presets (Superset).** Per-worktree setup/teardown hooks (`.superset/config.json` pattern): copy `.env`, install deps, **allocate a unique port**, template env vars. Solves the #1 unsolved worktree pain — runtime collisions — and is cheap to build in Rust.
5. **Merge discipline automation.** Diff-first review queue; serialize merges (one lane branch at a time, rebase next worktree onto updated main); scope-creep check at diff time. Codify the community playbook into Hermes merge automation.
6. **Compete-and-pick dispatch (Asynkron.Swarm).** For high-value tasks, fan the same prompt to 2 lanes (e.g. codex vs claude), have Hermes (or a cheap model) score diffs, human approves the winner. Fits approval-gated dispatch perfectly.
7. **Multi-model cost routing (oh-my-openagent).** Cheap/fast models for orchestration & polling, strong models for execution — aligns with the repo's new Kimi K3 OpenRouter lane.
8. **Thin control plane over tmux, not a GUI.** vibe-kanban's sunset is the cautionary tale. CSM's pattern (HTTP/SSE API over tmux sessions) or a cmux-style socket API gives programmability without GUI capital costs; add a read-only web dashboard later if needed.
9. **Rust is validated for this layer.** goose (30k★), vibe-kanban backend, batty are all Rust — the monorepo bet is on-trend. Borrow cmux's *ideas* (it's Swift, code isn't portable).
10. **Skip for now:** full A2A-protocol server (overkill for 4 local lanes), mobile app (Orca's lane), competing with foundation-model vendor teammate modes.

---
*Caveats: star counts via GitHub API through a caching fetch proxy on 2026-07-19; oh-my-openagent and Orca counts conflict with higher numbers in secondary sources (noted inline). "Batty" blog hype did not match its 48★ reality. Conductor (Melty) is closed-source — included for pattern reference only.*
