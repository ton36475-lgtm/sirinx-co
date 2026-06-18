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
