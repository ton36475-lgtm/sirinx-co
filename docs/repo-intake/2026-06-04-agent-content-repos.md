# Agent Content Repo Intake - 2026-06-04

Status: local source intake complete
Mode: read-only clone, no dependency install, no third-party code execution

## Scope

This intake pulls the GitHub repositories needed to continue the old Hermes /
SIRINX backlog in a practical order:

- ADS ANDROMEDA content factory and media pipeline.
- Hermes Agent Office / visual multi-agent runtime.
- Living skill index for design, browser/CDP, and model freshness.
- Hermes Desktop / web UI / upstream debugging sources.
- Developer UX assets.

All repositories are stored under:

```text
tools/repo-intake/2026-06-04/
```

Generated manifest:

```text
outputs/repo-intake/2026-06-04/repo-intake-manifest.json
outputs/repo-intake/2026-06-04/repo-intake-manifest.md
```

## Installed Source Repos

| Lane | Repo | Status | Use In SIRINX |
|---|---|---|---|
| Developer UX | `ahatem/IoskeleyMono` | ready | Font option for dashboards, terminal UI, and reports. |
| Terminal Runtime | `robzilla1738/harness-terminal` | ready | Agent-aware terminal source reference for Harness integration. |
| Frontend Quality | `Leonxlnx/taste-skill` | ready | Anti-slop design skill ideas for Codex/Hermes UI work. |
| Media Research | `RyanCodrai/turbovec` | ready | Vector/video research lane for media generation experiments. |
| Cowork UI | `iOfficeAI/AionUi` | partial-needs-retry | URL verified, but checkout stalled; do not use until retried. |
| Hermes UI | `nesquena/hermes-webui` | ready | Alternative Hermes web UI reference. |
| Skills | `DPStudioGR/ai-agent-skills` | ready | Chrome/CDP and reusable Hermes skill ideas. |
| Skills | `google-gemma/gemma-skills` | ready | Living best-practice skill pattern for model-specific knowledge. |
| Agent Office | `pixel-agents-hq/pixel-agents` | ready | Pixel-agent office visualization pattern. |
| Agent Office | `harishkotra/agent-office` | ready | Multi-agent visual office reference. |
| Agent Office | `ringhyacinth/Star-Office-UI` | ready | OpenClaw-style office UI reference. |
| Agent Office | `sreyas-endor/observatory` | ready | Universal hook pattern for agent status reporting. |
| Agent Office | `brellsanwouo/agentlantern` | ready | Runtime viewer and agent/tool visualization reference. |
| Multi-model UI | `danny-avila/LibreChat` | ready | Chat/control deck comparison, not production-connected. |
| Media / Avatar | `Open-LLM-VTuber/Open-LLM-VTuber` | ready | Avatar companion ideas for Andromeda and media factory. |
| Hermes Desktop | `fathah/hermes-desktop` | ready | Desktop UI bug/debug reference. |
| Hermes Upstream | `NousResearch/hermes-agent` | ready | Gateway/config/skills upstream reference. |

Existing cloned pack retained from earlier work:

```text
/Users/sirinx/project-hermes/trending/github-trending-2026-06-01/
```

That pack already contains 14 repositories including `MoneyPrinterTurbo`,
`markitdown`, `Scrapling`, `hermes-webui`, `VoxCPM`, `supermemory`, and
`pi-subagents`.

## Safety Decisions

Not installed or blocked by design:

| Candidate | Decision | Reason |
|---|---|---|
| Ticket-buying / anti-bot evasion automation | blocked | Platform abuse risk; defensive analysis only. |
| Camofox or anti-fingerprint automation | blocked | Can enable evasion workflows; requires narrow defensive scope. |
| AutoHedge / Vibe-Trading live trading | research-only | Financial risk; no trading automation. |
| Offensive cybersecurity MCP packs | blocked until scoped | Owned/allowlisted assets only. |
| Heretic / model uncensoring | not installed | Safety/compliance risk; not needed for revenue content factory. |
| Agentic Inbox / customer email automation | blocked | High privacy/customer data risk. |

## Immediate Integration Lanes

1. `content-factory` uses the ADS ANDROMEDA brand files already created.
2. `Agent Office` should compare `pixel-agents`, `agent-office`,
   `Star-Office-UI`, `observatory`, `agentlantern`, and Harness Terminal.
3. `Living Skill Index` should import ideas from `taste-skill`,
   `gemma-skills`, and `ai-agent-skills` as metadata first, not executable
   code.
4. `Hermes Desktop Recovery` should compare `fathah/hermes-desktop`,
   `NousResearch/hermes-agent`, and `nesquena/hermes-webui`.
5. `Media Factory` should review `Open-LLM-VTuber`, `turbovec`, and the
   existing `VoxCPM` clone before any provider-backed video generation.

## Stop Conditions

Stop before:

- `pnpm install`, `npm install`, `pip install`, `uv sync`, or repo setup scripts.
- Running any cloned repository code.
- Connecting external providers, social accounts, CRM, email, or browser
  automation credentials.
- Live Telegram/LINE/email/Facebook posting.
- Deploy, push, or public tunnel.
