# Skills Registry — Monorepo Consolidation

All Claude Code skills from the github.com/ton36475-lgtm system now live
in this repo under `.claude/skills/` (53 total), so every session and
sub-agent on the monorepo sees one skill set.

| Source repo | Skills | Notes |
| --- | --- | --- |
| `sirinx-solar-energy` | 45 (`sirinx-*`, `supabase-postgres-best-practices`) | full AI-WarRoom skill suite |
| `sirinx-os` | 4 (`agent-team-orchestration`, `hermes-project-planning`, `start-run-debug`, `website-browser-automation`) | Hermes ops skills |
| `codexskills` | 0 | repo is empty (only `.git`) — nothing to import |
| *(native — created directly in `sirinx-co`, post-consolidation)* | 3 (`ghostclaw-manager`, `kimi-k3-swarm`, `ronin-model-routing`) | not imported from any source repo; written against this repo's real architecture from the start |

45 + 4 + 0 + 3 = **53**, matching `ls .claude/skills/ | wc -l`. (The
previous version of this file said 50 and omitted the native 3 from the
table entirely — fixed 2026-07-20 as part of the B10 audit below.)

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

---

## B10 skill hygiene audit (2026-07-20)

L1 (Kuranosuke) ran a full read-only audit of all 53 skills. Root cause:
most `sirinx-*` skills were imported verbatim from `sirinx-solar-energy`
(a *different*, Next.js 15 + OpenClaw repo) and describe that repo's
routes/files/architecture, not this one. L4 (Gengo) implemented the
findings below. Every skill in `.claude/skills/` falls into exactly one
of these four buckets.

### OK — no change needed (31)

Content is either already repo-agnostic/portable, or (for the 3 native
skills) was written against `sirinx-co`'s real architecture from the
start.

`ghostclaw-manager`, `kimi-k3-swarm`, `ronin-model-routing` (native, not
imported — see source-repo table above), `sirinx-agentforce-intelligence`,
`sirinx-ai-war-intelligence`, `sirinx-alibaba-infrastructure`,
`sirinx-autonomous-ops`, `sirinx-benchmark-guard`,
`sirinx-clawwork-monetization`, `sirinx-cmo-marketing-funnel`,
`sirinx-company-brain`, `sirinx-content-pipeline`,
`sirinx-context-engineering`, `sirinx-failure-registry`,
`sirinx-investment-proposal`, `sirinx-ipo-mental-model`,
`sirinx-manus-portfolio`, `sirinx-master-gem`, `sirinx-master-plan`,
`sirinx-memory-architect`, `sirinx-multi-agent-coordinator`,
`sirinx-planner-executor`, `sirinx-research-loop`,
`sirinx-revenue-engine`, `sirinx-robotics-iot`,
`sirinx-sbct-intelligence`, `sirinx-security-gate`,
`sirinx-seo-77-provinces`, `sirinx-serving-optimizer`,
`sirinx-shopee-video-ai`, `sirinx-telegram-integration`.

### Architecture-mismatch banner applied (19)

These describe `sirinx-solar-energy`'s Next.js/`apps/sirinx-web`/OpenClaw
architecture (routes like `/warroom`, files like
`apps/sirinx-web/src/agents/base-agent.ts`) as if it were this repo. A
repo-scope note was inserted after the YAML frontmatter, before the
first heading, pointing readers at `SYSTEM_ARCHITECTURE.md`,
`docs/RONIN_ROSTER.md`, and `.claude/skills/ghostclaw-manager/SKILL.md`
for `sirinx-co`'s actual architecture. No other content changed.

`agent-team-orchestration`, `hermes-project-planning`,
`sirinx-agentation-ui-review`, `sirinx-andromeda-dark-neural`,
`sirinx-dashboard-orchestration`, `sirinx-fb-group-scanner`,
`sirinx-master-knowledge`, `sirinx-meta-ads-marketing`,
`sirinx-multi-model-critique`, `sirinx-n8n-automation`,
`sirinx-openclaw-automation-pipeline`, `sirinx-pixle-office-ai`,
`sirinx-prd-knowledge`, `sirinx-research-web-app`, `sirinx-unified-os`,
`sirinx-warroom-ceo-core`, `start-run-debug`,
`website-browser-automation`, `sirinx-llm-switcher`.

### Stale-fact fixed (2)

- `sirinx-lead-conversion` — "L4 #35 Gengo" corrected to "L4 #36 Gengo"
  (Gengo's real coded slot per `docs/RONIN_ROSTER.md` /
  `crates/sirinx-agents/src/roster.rs`).
- `sirinx-ai-model-intelligence` — content was already substantially
  rewritten and current (2026-07-20), but a leftover `🚧 **Stub**`
  status line at the bottom contradicted that. Updated to reflect
  reality: registry/lane mapping is current, only the automated
  benchmark pipeline remains unbuilt.

### Minor-path-fixed (1)

- `supabase-postgres-best-practices` — cited
  `references/schema-partial-indexes.md`, which doesn't exist; corrected
  to the real filename, `references/query-partial-indexes.md`.

31 + 19 + 2 + 1 = **53** (all skills accounted for).

### Known limitation — not fixed in this pass

Roughly a dozen skills (found during the audit: at least
`sirinx-ai-war-intelligence`, `sirinx-cmo-marketing-funnel`,
`sirinx-content-pipeline`, `sirinx-fb-group-scanner`, `sirinx-master-gem`,
`sirinx-meta-ads-marketing`, `sirinx-robotics-iot`,
`sirinx-sbct-intelligence`, `sirinx-shopee-video-ai`,
`sirinx-telegram-integration` — likely a couple more) reference
Ronin codenames at slots `docs/RONIN_ROSTER.md` marks *unassigned*
(e.g. "Kanroku #09", "Sadaemon #21", "Kyūdayū #10", "Magokurō #11") —
invented identities for placeholder slots, the same class of error
`docs/RONIN_ROSTER.md` (A23) was written to stop happening. Rewriting or
inventing replacement content for these is out of scope for a hygiene
pass (this audit fixes factual/architecture errors, it doesn't author
new fictional lore to replace old fictional lore). Flagged here as a
follow-up backlog item for a future pass — not fixed now.

---

*Last updated: 2026-07-20 (B10 skill hygiene audit — see `MASTER_PLAN.md`).*
