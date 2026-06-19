# Pending Work Execution Board - 2026-06-04

Status: active local continuation board
Primary goal: turn old pending work into revenue-oriented local execution
without crossing live-send, provider, deploy, or push gates.

## Current Truth

- ADS ANDROMEDA brand/video/content factory exists locally.
- Content pipeline generated prompts, video queue, QC checklist, Facebook
  drafts, approval packet, schedule queue, and money plan for 2026-06-04.
- Repo intake completed with 16 ready source repos and 1 partial repo.
- Earlier GitHub trending pack already exists in `project-hermes/trending`.
- Kob AI is configured but blocked by missing `KOB_API_KEY` and
  `KOB_HEAVY_MODEL`.
- thClaws mobile is blocked by missing phone-side env/pairing.
- OBSStack v7 is blocked until the real HTML/bundle path or Drive URL is
  provided.
- Telegram live reporting remains blocked unless live send is explicitly
  approved.

## Workstreams

| Priority | Workstream | Owner | Input | Next Safe Action | Blocker |
|---|---|---|---|---|---|
| P0 | ADS ANDROMEDA money pipeline | Hermes + Codex + QA | `brands/ads-andromeda`, `packages/content-factory` | Generate batch 02 and run publisher dry-run only. | Live Facebook publish requires page ID/token and approval. |
| P0 | Repo intake triage | Codex reviewer | `tools/repo-intake/2026-06-04` | Extract README/license/risk notes into a comparison matrix. | No dependency install or code execution. |
| P1 | Agent Office visual runtime | Frontend + QA | Pixel Agents, Agent Office, Star Office UI, Observatory, AgentLantern, Harness | Build a local static comparison panel first. | No hooks until approval. |
| P1 | Living Skill Index | Planner + Scribe | Taste Skill, Gemma Skills, AI Agent Skills | Create skill metadata JSON and read-only viewer. | Do not auto-install external skills. |
| P1 | Hermes Desktop recovery | Devops + QA | Hermes Desktop, Hermes Agent upstream, Hermes WebUI | Compare config/SSE/toolset handling against local bug reports. | No gateway mutation until approved. |
| P1 | Media factory | Content + Design | Open-LLM-VTuber, turbovec, VoxCPM, HyperFrames specs | Convert Andromeda episode pack into provider-neutral video job cards. | No provider calls until approved. |
| P2 | Harness integration | Runtime Gatekeeper | Harness app installed, source cloned | Draft shell integration and agent-hook plan. | Needs `APPROVE_HARNESS_SHELL_INTEGRATION_LOCAL_ONLY` and hook approval. |
| P2 | Kob heavy worker | Devops | `scripts/kob-*` in project-hermes | Wait for hidden key/model config, then run smoke. | Missing key/model. |
| P2 | thClaws mobile node | Devops | `scripts/thclaws-mobile` | Provide phone prompt pack and env checklist. | Phone-side setup incomplete. |
| P2 | OBSStack v7 verification | Scribe | pending report only | Wait for actual v7 file path or Drive URL. | Artifact missing locally. |

## Hermes Team Assignments

| Agent | Assignment |
|---|---|
| Hermes CEO | Keep gate state, decide next safe local task, block live actions. |
| Planner | Maintain board, transform repo findings into implementation specs. |
| Codex | Read repo sources, implement local docs/scripts/tests only. |
| QA | Verify manifests, generated outputs, `git diff --check`, and no live side effects. |
| Designer | Extract UI/brand ideas from Taste Skill, Ioskeley, Pixel/Office repos. |
| Media | Turn Andromeda episodes into image/video/QC job packets. |
| Reporter | Produce Telegram-safe report drafts without live sending. |

## Next Command Batch

```bash
cd /Users/sirinx/SIRINXDev/sirinx-agent-native-os

# Review new repo intake manifest
sed -n '1,220p' outputs/repo-intake/2026-06-04/repo-intake-manifest.md

# Continue money workflow without live publish
pnpm ads:automation-pipeline -- --date 2026-06-05 --count 5 --start-episode 6

# Verify generated local artifacts
pnpm --filter @sirinx/content-factory build
git diff --check
```

## Approval Gates Still Required

```text
APPROVE_ADS_ANDROMEDA_FACEBOOK_PUBLISHER_DRY_RUN_LOCAL_ONLY
APPROVE_ADS_ANDROMEDA_BATCH02_BM_EPISODES_LOCAL_ONLY
APPROVE_ADS_ANDROMEDA_FACEBOOK_LIVE_PUBLISH
APPROVE_HARNESS_SHELL_INTEGRATION_LOCAL_ONLY
APPROVE_HARNESS_AGENT_HOOKS_CODEX_HERMES_LOCAL_ONLY
APPROVE_KOB_API_KEY_CONFIG_LOCAL_ONLY
APPROVE_THCLAWS_MOBILE_ENV_CONFIG_LOCAL_ONLY
APPROVE_LIVE_TELEGRAM_COMMAND_UX_TEST
APPROVE_OBSSTACK_V7_FILE_VERIFY <path-or-url>
```

## Non-Negotiable Boundaries

```text
dry_run=true
live_send=false
provider_call=false
external_message_send=false
deploy=false
push=false
third_party_code_execution=false
dependency_install=false
```
