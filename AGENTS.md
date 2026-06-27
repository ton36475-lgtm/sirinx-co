# Agents Coordination

## Worker Layer

- **OpenClaw / Codex / OpenCode / Claude Code / OpenHands / OpenJarvis**: Acting as execution sub-agents under read-only sandboxed layers or strictly guided developer tasks.
- **thClaws**: Asynchronous runtime queue and background worker.

## Master Coordinator

- Coordinates workflows from PRD -> Issues -> Tasks -> Diff -> Verify -> Approval.

## Oracle + Product Design Addendum

- **Oracle Provenance Agent**: Extracts claims, classifies proof status, links evidence, and appends timeline events. It must not mark anything `PROVEN` without a complete evidence chain.
- **Codex Product Design Worker**: Converts ideas into product briefs, flows, screens, wireframes, design tokens, specs, task packs, and evidence requirements before code.
- **Proof Classifier**: Owns status transitions across `UNVERIFIED`, `LOCAL`, `EVIDENCED`, `COMMITTED`, `EXTERNAL`, and `PROVEN`.
- **Timeline Keeper**: Maintains append-only event records and correction entries.
- **Evidence Hasher**: Produces SHA-256 and optional Git object IDs for evidence artifacts.

## Addendum Rules

- Memory is not truth.
- Verify before assert.
- Spec before code.
- Prototype is not production.
- Local-only until explicit approval.
- No real secrets or real customer data.

## Coding Language Policy

- Prefer Rust first for new executable local tooling, evidence utilities,
  runtime adapters, deterministic file processors, sandboxed plugins, and
  performance-sensitive hot paths.
- Do not force Rust into existing React/TypeScript frontend surfaces, Markdown,
  JSON schemas, CSS, static config, or provider-specific integration layers
  where another language is clearly the safer fit.
- When a new coding task uses a non-Rust language, record the reason in the
  task packet or implementation report.
- Use `docs/architecture/OPERATIONAL_LANGUAGE_MAP.md` and
  `policies/operational_language_map.yaml` as the routing source for choosing
  TypeScript, TSX, Python, Shell, Rust, SQL, Markdown, YAML, JSON, Thai,
  English, or mixed Thai-English in future automation work.

## Ghostclaw Master Handoff Addendum

### Project Mission

GHOSTCLAW / SIRINXDev Agent-Native OS is a local-first, approval-gated AI
development operating system. It coordinates human command, Hermes policy
gates, Codex/Claude/OpenCode worker layers, Ponytail review, Odysseus private
workspace planning, Obsidian memory, n8n/MCP automation plans, local model
runtime, and optional approved provider calls.

### Agent Roles

- Human Commander: approves or rejects high-risk actions and reviews
  PRE_APPROVAL_PACKET artifacts.
- Hermes Command Gate: owns policy, approval, routing, and memory writeback
  gates.
- Codex Worker: inspects, documents, patches only approved scopes, verifies,
  and reports evidence.
- Ponytail Code Gate: reviews diffs for unnecessary complexity, hidden debt,
  missing validation, and over-engineering.
- Odysseus Workspace: private localhost-only AI workspace UI for research,
  documents, agents, and local model workflows.
- Model Layer: routes local Ollama/llama.cpp tasks first; GLM-5.2,
  OpenRouter Fusion, or other external providers require approval.
- Automation Layer: n8n, MCP, and thClaws are planned as local/backbone tools
  and must not be activated externally without approval.

### Allowed Tools

- Read-only inspection, repo mapping, local documentation updates, dry-run
  evidence generation, schema drafting, local-only dashboard review, and
  syntax checks.
- Local file writes for approved docs, plans, templates, schemas, and safe
  scripts.
- Targeted tests only after the relevant implementation scope is approved.

### Blocked Tools And Actions

- No deploy, push, publish, public tunnel, cloud mutation, production webhook,
  paid provider call, Telegram live send, customer message, or external API
  mutation without explicit approval.
- No secret reads or secret printing from env files, credentials, browser
  profiles, SSH keys, cloud configs, password stores, or local token files.
- No disabling authentication, binding services to `0.0.0.0`, exposing raw
  model/database/vector ports, or vendoring AGPL source into the monorepo.
- No global package installs, destructive commands, or mass rewrites without a
  PRE_APPROVAL_PACKET.

### Approval Gates

- Planning/docs gate: allowed after explicit local-only docs approval.
- Implementation gate: requires explicit implementation approval for the
  specific task.
- External gate: requires PRE_APPROVAL_PACKET before clone, provider call,
  Docker start, public access, deploy, push, publish, or live send.
- Memory writeback gate: allowed only for approved local notes or approved
  Obsidian/Hermes writeback.

### Coding Standards

- Inspect before editing.
- Prefer existing repo patterns and standard libraries.
- Keep patches minimal and reversible.
- Preserve validation, error handling, safety checks, accessibility, and
  data-loss protections.
- Record reasons when a new executable local tool is not Rust.

### Security Rules

- Localhost first.
- Secrets are never printed.
- External APIs and Cloudflare mutations are approval locked.
- Mobile nodes are for monitoring and approval only, not heavy execution.
- Generated, vendor, runtime, and local config artifacts must be separated from
  source commits unless explicitly staged as their own lane.

### Output Format

Every handoff or implementation report must include summary, files changed,
commands run, validation, risks, approvals needed, and next action.

### Stop Rules

Stop and request approval if the task needs secrets, network mutation, package
installation, Docker/service start, public access, push/deploy/publish, global
config mutation, or if dirty work could be overwritten.

## Full Auto Autopilot Addendum

The active automation target is now `FULL_AUTO` mode. Human approval queues are
replaced by policy decisions, job manifests, execution leases, automated
verification, auto rollback, quarantine, audit logs, and kill switch controls.

In full-auto mode:

- If policy allows the action, workers execute without asking for manual
  approval.
- If policy blocks the action, workers log the block, quarantine or skip the
  task, and continue to the next safe task.
- If policy is missing or ambiguous, workers fail closed.
- Human operators set goals, edit policies, inspect dashboards, and use the
  kill switch.

Hard blocks remain non-negotiable: never print secrets, never exfiltrate
credentials, never disable auth, never expose raw database/model/vector/admin
ports publicly, never send to non-opt-in contacts, never bypass quotas/captcha,
and never spend beyond budget caps.

## AI Money System Addendum

AI Money System is the revenue execution layer for GHOSTCLAW. Workers should
treat it as a repeatable money loop, not as passive knowledge.

Core loop:

`Market -> Offer -> Content -> Lead -> Sales -> Delivery -> Proof -> Metrics -> Scale`

Allowed autonomous outputs include local offer ladders, content calendars, lead
trackers, delivery boards, case-study drafts, KPI summaries, and owned-channel
content plans. Automated customer messaging requires opt-in, rate limits,
budget caps, audit logs, and the kill switch.

## Visual RAG Adapter Addendum

Visual RAG Adapter belongs to SPEC-02 Research-Memory-Pipeline. It is not a new
orchestration layer and does not replace Text RAG.

Use Visual/Hybrid RAG for layout-heavy sources: PDF tables, tariff sheets,
datasheets, charts, screenshots, competitor landing pages, dashboards, and
infographics. Treat PixelRAG as candidate/unverified until an official
paper/repo/playground is confirmed.

Initial scripts must create local manifests and benchmark scaffolds only: no
model install, no GPU task, no external API, no screenshot crawler, and no
secret-bearing browser/session capture.

## Deep Research OS Addendum

Sovereign Deep Research OS is the research execution layer for turning videos,
documents, screenshots, PDFs, tables, URLs, and notes into claim inventories,
evidence units, conflict logs, models, and decision reports.

Use `docs/deep_research/DEEP_RESEARCH_SYSTEM_DESIGN.md` as the execution design
and `docs/deep_research/DEEP_RESEARCH_OUTPUT_PACK.md` as the output contract.
Use `docs/deep_research/DEEP_RESEARCH_CONTROL_PLANE.md` for job class routing,
source policy, Mission Control status requirements, and the next local build
slice.
Use `scripts/a2a/a2a_deep_research_system.py` for local example validation and
runtime status generation. The script also writes
`apps/mission-control/src/fixtures/deepResearchStatus.json` for the read-only
Mission Control `Deep Research` tab, generates a local `source_registry.json`,
and creates a local report pack under `.ghostclaw_runtime`.

Current Deep Research work is local-only unless a separate retrieval lane is
opened. Do not browse, scrape, call providers, upload confidential raw files,
install models, run GPU jobs, publish, push, deploy, write connectors, or read
secrets from this lane. Every material claim must be supported by evidence or
marked unverified, and every recommendation must carry confidence and
assumption labels.

## Model Training Dataset Candidate Addendum

`hotdogs/uka-fable-reasoning` is registered as a model-training dataset
candidate, not an approved training input. Hugging Face metadata confirms the
repository exists, is manually gated, uses `AGPL-3.0`, and targets English/Thai
text-generation reasoning traces.

Allowed current work is limited to metadata records, access-request drafts,
provenance records, AGPL compliance notes, readiness scoring, and training/eval
plans. Do not submit the gated access form, download files, train models,
redistribute data, or expose raw reasoning traces until lawful access,
provenance, license review, row-level scans, and safety checks are complete.

Reasoning traces are internal-only. User-facing systems must summarize answers
without revealing hidden chain-of-thought.

## A2A Sync Bridge v2 Addendum

A2A Sync Bridge v2 is the local task and artifact bus between KOB CLI planner
profiles and Codex repo executor profiles. Treat KOB as the planner/router and
Codex as the worker that edits repos, creates files, and runs local validation.

Manus is an artifact-producing peer only. Use it for visual specs, interactive
HTML, websites, slides, videos, and handoff summaries. Manus output must enter
A2A as metadata and file references for Codex review, not as direct repo
mutation.

Prefer `codex-local` for execution. `codex-5.6` remains a legacy/profile alias
unless runtime discovery proves a concrete local executable route. Do not route
repo execution through KOB-hosted Codex models.

Current implementation is local file-queue only under
`~/SIRINXDev/.ghostclaw_runtime/a2async/`. Do not expose an A2A server, open a
public port, execute provider calls, clone repos, start Docker, push, deploy,
or publish during scaffolding. Use agent cards in `agents/a2a/`, registry files
in `registry/`, policies in `policies/`, and scripts in `scripts/a2a/`.

OpenCode and AGY Antigravity 2 may participate only as scoped executors. They
must have an executor lease and lane lock before repo mutation, and Codex-local
remains the final repo safety reviewer. Do not convert a policy block into a
jailbreak or bypass request.

Codex Command Broker is the required local decision layer before any A2A task
touches a tool, connector, provider, executor, or external Git repo. It writes
runtime decision artifacts from `policies/codex_command_broker.json` and can
only classify work as dry-run allowed, lease-required, registry-policy
controlled, first-phase blocked, or blocked. It must not run provider calls,
pushes, deploys, public endpoints, secret reads, direct repo mutation, or
policy bypass.

A2A scoped lane staging guard is the required review step before staging a
mixed-worktree lane. Use `policies/a2a_scoped_lanes.json` as the manifest and
`scripts/a2a/a2a_scoped_lane_status.py` to write a read-only runtime report.
The guard never stages, commits, pushes, deploys, clones, calls providers, or
turns a policy block into a bypass request.

A2A integration readiness reporting is read-only. Use
`scripts/a2a/a2a_integration_readiness.py` to summarize agent cards, broker
routes, connector payload target binding, and external Git repo registry
coverage. The report can mark live external execution blocked while still
allowing local review and planning to continue.

Codex Goal Plan Board is the Mission Control read-only surface for "all work"
coordination on this Mac mini M2. Use
`scripts/a2a/a2a_goal_plan_board.py` to generate the runtime report and static
fixture before reviewing broad workflow requests. The board may summarize safe
next actions, gated lanes, blocked actions, runtime paths, and Obsidian digest
metadata, but it must not unlock security, auto-approve every workflow, read
secrets, call providers, sync connectors, clone repos, push, deploy, or expose
public endpoints.

If an operator provides an approve-all or `security_controls: none`
configuration, normalize it through `policies/codex_command_broker.json`
instead of applying it directly. Local read, inspection, lint, test, docs, and
simulation actions may remain dry-run allowed. Repo-affecting patches require a
lease and lane lock. Secret access, user-data export, auth/authz/payment
mutation, unknown scripts, migrations, destructive overwrite, production
deploy, external writes, logging/monitoring disablement, access-control bypass,
credential exfiltration, audit tampering, and hidden execution history remain
hard-blocked.

Automated Code Review Workflow is a report-only A2A lane. It may hash-sync the
exported workflow document, plan lint/type/test/security/documentation checks,
and render local JSON/Markdown plus Mission Control fixture evidence. It must
not apply patches, stage files, commit, push, deploy, read secrets, call
providers, or write connectors. Patch recommendations require a separate
executor lease and lane lock.

Manus or user-provided export files under Downloads are identity inputs until
Codex review accepts specific sections. Use `a2a_manus_adapter.py` for
metadata/hash sync only. Do not install `.skill` packages, import schema files,
replace agent instructions, migrate databases, or copy generated source into
production without a dedicated scoped review lane.

Codex Full Command Broker Matrix is the required local control surface for
"unlock all commands" requests. Interpret that phrase as "classify every command
class before execution", not as a request to bypass policy. Use
`scripts/a2a/a2a_codex_tool_repo_matrix.py` to generate the Tool Matrix fixture
and runtime reports. Unknown tools/actions fail closed until added to
`policies/codex_command_broker.json`.

Codex Command Packet Control is the required pre-execution artifact for local
executor commands. Use `scripts/a2a/a2a_command_packet.py` to record the masked
command preview, command hash, broker decision, command-level risk flags, lease
state, and packet decision. The packet generator must not execute shell
commands. Repo-affecting packets still need executor lease and lane lock before
any runner acts.

web-sirinx generated assets and Cloudflare Pages deploy work must stay in the
`Web Deploy` lane. Use `scripts/a2a/a2a_web_sirinx_deploy_lane.py` to inspect
`apps/web-sirinx/dist/public` and generated asset references. Do not stage,
push, deploy, call Wrangler, read Cloudflare credentials, or mix generated
assets into unrelated lanes. Deploy requires a separate scoped lane with
check/test/build, target binding, rollback plan, health checks, and clean
staging evidence.

Pending web-sirinx deploy work must be represented by
`scripts/a2a/a2a_web_sirinx_deploy_packet.py` before any deploy lane can open.
The packet registers command previews and broker decisions only. It must not
run check/test/build, stage files, call Wrangler, push, deploy, read Cloudflare
credentials, or call provider APIs.

Command Broker Production is the required interpretation for "unlock every
command" requests. Use `scripts/a2a/a2a_command_broker_production_lane.py` to
generate runtime registries, policies, schemas, logs, locks, and Mission
Control status outside git. This unlocks command visibility, not unrestricted
execution. The broker must not execute shell commands, stage, commit, push,
deploy, call providers, sync connectors, read secrets, edit audit logs, or
provide approve-all. Unknown commands fail closed, T3/T4 commands require
review or executor lease, and T5 commands remain denied.

Use `packages/command-broker` as the typed local decision contract for new
Codex/OpenCode/AGY/Manus/A2A executor routes. Its `decideCommandRequest` API
returns a risk tier, production decision, required gate, and evidence list. It
does not execute commands and currently keeps `allowedToExecute=false` for all
decisions.

Use `validateAdapterContract` from `packages/command-broker` before opening any
Docker localhost start, external repo clone, provider API smoke, or MCP
connector activation lane. Adapter validators are preflight-only. A passing
validator still requires an executor lease or review and must keep
`allowedToExecute=false`; a failing validator must produce a machine-readable
`DENY` reason instead of trying to self-heal by bypassing policy.

A2A Goal Coverage Audit is the required read-only status surface for broad
"all tool/all repo" integration requests. Use
`scripts/a2a/a2a_goal_coverage_audit.py` to measure agent cards, broker routes,
external repo registry, adapter contracts, scoped lanes, runtime reports, and
connector target binding before opening any real action lane. The audit writes
runtime evidence only and must not clone, push, deploy, call providers, sync
connectors, read secrets, mutate generated assets, or bypass policy.

Codex Session Sidebar Toolkit is the local operator fixture for the current
session. Use `scripts/a2a/a2a_session_sidebar_toolkit.py` to generate
`apps/mission-control/src/fixtures/codexSessionSidebarToolkitStatus.json` and
runtime reports that summarize Codex, KOB, Hermes, Manus, OpenCode, AGY,
Command Broker, A2A runtime reports, and Git repo registry state. The toolkit
is a read-only status surface. It must not execute commands, approve blocked
actions, write connectors, call providers, clone repos, start Docker, push, or
deploy.

Use the Session Toolkit integration readiness matrix to decide the next scoped
lane. Rows marked `ready` are local review surfaces only. Rows marked
`lease_required` need a separate executor lease and lane lock before any real
action. Rows marked `blocked` require missing target IDs, policy input, or a
dedicated safety decision. Do not reinterpret a readiness row as permission to
execute.

Use `scripts/a2a/a2a_executor_lease_requests.py` only to generate review-only
request packets from Session Toolkit readiness rows. These packets may describe
OpenCode, AGY Antigravity 2, external repo audit, or connector target binding
work, but they are not active leases. The script must not acquire lane locks,
execute commands, write connectors, call providers, clone repos, start Docker,
push, deploy, read secrets, or mutate generated assets.

The Session Toolkit objective audit is the local proof surface for broad
"all-process AI" requests. Treat verified rows as control-plane visibility, not
permission for live automation. Connector sync, repo clone, provider calls,
Docker/service starts, push, deploy, generated asset mutation, and public
endpoint work still require separate scoped lanes and executor leases.

## Obsidian Brain Sync Addendum

KOB and Codex should sync all substantive local work to the SIRINX Obsidian
Brain using concise, non-secret memory pulses.

- Vault root:
  `/Users/sirinx/Documents/Obsidian Vault/SIRINX`
- Digest note:
  `/Users/sirinx/Documents/Obsidian Vault/SIRINX/AI HQ Knowledge Digest.md`
- Policy:
  `policies/obsidian_brain_sync.yaml`
- Script:
  `scripts/a2a/a2a_obsidian_sync.py`

## Mercury Whitelist Skills Addendum

Mercury whitelist skills are installed into Hermes as a local-only skill
surface for the active `shogun` profile. Treat them as defensive planning,
design, testing, audit, product, React, and secure-coding guidance.

- Install report:
  `reports/mercury-skills/20260606-145321/INSTALL_SUMMARY.md`
- Staging/audit path:
  `/Users/sirinx/.hermes/skills/mercury-whitelist`
- Active profile mirror:
  `/Users/sirinx/.hermes/profiles/shogun/skills/<category>/<skill>/SKILL.md`

Do not run live Hermes provider prompts, restart gateways, mutate credentials,
push, deploy, publish, or bulk-import additional Mercury skills unless that
specific lane is opened. Offline preload checks and local skill-list evidence
are allowed.

Append only short summaries with source paths and next actions. Never write
secrets, `.env` values, private keys, browser cookies, raw tokens, or large raw
logs into Obsidian.
