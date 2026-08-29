# Skills Registry — Monorepo Consolidation

All Claude Code skills from the github.com/ton36475-lgtm system now live
in this repo under `.claude/skills/` (50 total — the 49 imported below
plus `sirinx-master-plan`, added later in commit `7304799`), so every session and
sub-agent on the monorepo sees one skill set.

| Source repo | Skills | Notes |
| --- | --- | --- |
| `sirinx-solar-energy` | 45 (`sirinx-*`, `supabase-postgres-best-practices`) | full AI-WarRoom skill suite |
| `sirinx-os` | 4 (`agent-team-orchestration`, `hermes-project-planning`, `start-run-debug`, `website-browser-automation`) | Hermes ops skills |
| `codexskills` | 0 | repo is empty (only `.git`) — nothing to import |

Import policy:
- Copied verbatim, no renames; scanned for secret-like strings (none).
- The source repos keep their copies until each repo is archived per
  `RUST_MIGRATION_PLAN.md`; this directory is canonical from now on —
  edit skills HERE, then sync outward if a legacy repo still needs one.
- Department mapping: L1/L2 use intelligence skills (`sirinx-sbct-*`,
  `sirinx-fb-group-scanner`, …), L3 uses planning skills
  (`sirinx-planner-executor`, `hermes-project-planning`), L4 uses ops
  skills (`start-run-debug`, `sirinx-openclaw-automation-pipeline`),
  L5 uses research skills (`sirinx-research-loop`,
  `sirinx-ai-model-intelligence`), Kai uses brand/content skills
  (`sirinx-master-gem`, `sirinx-cmo-marketing-funnel`).
