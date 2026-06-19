# Repo Triage Matrix - 2026-06-04

Mode: read-only triage; no code execution.

| Repo | Status | Risk | Useful For | Root License | Skill Files | Next Action |
|---|---|---|---|---|---:|---|
| `ahatem__IoskeleyMono` | ready | low | Dashboard/Terminal UX | LICENSE | 0 | Review license and create optional dashboard/terminal font token. |
| `robzilla1738__harness-terminal` | ready | medium | Hermes Agent Office | LICENSE | 0 | Compare Harness CLI/event model with Agent Office state panel. |
| `Leonxlnx__taste-skill` | ready | low | Living Skill Index | LICENSE | 13 | Extract SKILL.md names and map into local Living Skill Index metadata. |
| `RyanCodrai__turbovec` | ready | medium | ADS/Media Factory | LICENSE | 0 | Read architecture only; decide if vector render ideas help HyperFrames specs. |
| `iOfficeAI__AionUi` | partial-needs-retry | medium | Hermes Agent Office | not detected at root | 0 | Retry checkout separately; do not use partial source. |
| `nesquena__hermes-webui` | ready | medium | Hermes Desktop/Gateway Recovery | LICENSE | 0 | Compare UI routes and runtime model against Hermes Desktop/Sites panel. |
| `DPStudioGR__ai-agent-skills` | ready | medium | Living Skill Index | not detected at root | 1 | Review skill format and keep install as manual-gated only. |
| `google-gemma__gemma-skills` | ready | low | Living Skill Index | LICENSE.txt | 1 | Extract model freshness skill structure for local skill index. |
| `pixel-agents-hq__pixel-agents` | ready | medium | Hermes Agent Office | LICENSE | 0 | Compare data model for agent status, rooms, hooks, and local rendering. |
| `harishkotra__agent-office` | ready | medium | Hermes Agent Office | LICENSE | 0 | Compare visual office model and state loop; no runtime execution. |
| `ringhyacinth__Star-Office-UI` | ready | medium | Hermes Agent Office | LICENSE | 1 | Compare OpenClaw-style visual concepts and safety assumptions. |
| `sreyas-endor__observatory` | ready | medium | Hermes Agent Office | not detected at root | 0 | Review hook ingestion design; do not install hooks. |
| `brellsanwouo__agentlantern` | ready | medium | Hermes Agent Office | LICENSE | 0 | Compare runtime viewer model for evidence panels. |
| `danny-avila__LibreChat` | ready | high | Control Deck Research | LICENSE | 0 | Research only; do not connect providers or import user data. |
| `Open-LLM-VTuber__Open-LLM-VTuber` | ready | medium | ADS/Media Factory | LICENSE, LICENSE-Live2D.md | 0 | Extract avatar pipeline ideas for Andromeda without running model code. |
| `fathah__hermes-desktop` | ready | medium | Hermes Desktop/Gateway Recovery | LICENSE | 4 | Compare desktop bug reports with source; no local app mutation. |
| `NousResearch__hermes-agent` | ready | medium | Living Skill Index, Hermes Desktop/Gateway Recovery | LICENSE | 177 | Use as upstream reference for config, gateway, and skills behavior. |

## Titles / README Signals

| Repo | README signal | Key manifests |
|---|---|---|
| `ahatem__IoskeleyMono` | Ioskeley Mono | README.md |
| `robzilla1738__harness-terminal` | Harness | README.md |
| `Leonxlnx__taste-skill` | <p align="center"> | README.md |
| `RyanCodrai__turbovec` | <p align="center"> | Cargo.toml, README.md |
| `iOfficeAI__AionUi` | - | not detected or partial |
| `nesquena__hermes-webui` | Hermes Web UI | package.json, pyproject.toml, requirements.txt, README.md |
| `DPStudioGR__ai-agent-skills` | AI Agent Skills | README.md |
| `google-gemma__gemma-skills` | gemma-skills | README.md |
| `pixel-agents-hq__pixel-agents` | <h1 align="center"> | package.json, package-lock.json, README.md |
| `harishkotra__agent-office` | 🏢 AgentOffice | package.json, README.md |
| `ringhyacinth__Star-Office-UI` | Star Office UI | pyproject.toml, README.md |
| `sreyas-endor__observatory` | Observatory | package.json, README.md |
| `brellsanwouo__agentlantern` | AgentLantern | package.json, package-lock.json, pyproject.toml, README.md |
| `danny-avila__LibreChat` | <p align="center"> | package.json, package-lock.json, README.md |
| `Open-LLM-VTuber__Open-LLM-VTuber` | ![](./assets/banner.jpg) | pyproject.toml, requirements.txt, README.md |
| `fathah__hermes-desktop` | <img width="100%" alt="HERMES DESKTOP" src="previews/header.webp" /> | package.json, package-lock.json, README.md |
| `NousResearch__hermes-agent` | <p align="center"> | package.json, package-lock.json, pyproject.toml, README.md |

## Blocked Or Research Only

| Candidate | Decision | Reason |
|---|---|---|
| ticket-buying bot / anti-bot evasion repos | blocked | platform abuse and likely ToS evasion; only defensive analysis allowed |
| Camofox / anti-fingerprint browser automation | blocked | can enable platform-abuse evasion; needs narrow defensive approval |
| AutoHedge / Vibe-Trading live trading automation | research-only | financial risk; no live trading automation |
| cybersecurity MCP packs with offensive tools | blocked until scope packet | owned/allowlisted assets only; no autonomous scanning |
| heretic / model uncensoring tools | not installed | safety and compliance risk; not needed for revenue content factory |
| Agentic Inbox / customer email automation | blocked until privacy packet | high privacy/customer-data risk |

## Dispatch Recommendation

1. Start with Agent Office comparison because 6 ready repos target the same UI problem.
2. Build Living Skill Index metadata from Taste Skill, Gemma Skills, and AI Agent Skills.
3. Keep Hermes Desktop recovery as a QA/debug lane using Desktop, WebUI, and upstream Hermes source.
4. Feed media/avatar lessons into ADS ANDROMEDA only as provider-neutral job specs.
5. Keep AionUI in retry queue; do not use its partial checkout.
