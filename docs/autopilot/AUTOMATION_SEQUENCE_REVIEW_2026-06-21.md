# Automation Sequence Review - 2026-06-21

Status: local review complete, no external service started.

## Scope

This review checks the current automation order across GHOSTCLAW / SIRINXDev:

- Autopilot control plane
- AI Money local revenue artifacts
- Visual RAG research-memory scaffolds
- Fable reasoning model-training candidate
- PinchTab browser automation candidate
- TigrimOSR runtime candidate
- Odysseus / GLM / external repo helper scripts
- legacy approval-gate documents that still exist beside the full-auto plan

No Docker service, daemon, browser profile, MCP connector, provider API, publish
job, customer message, deploy, or push was run during this review.

## Current Control-Plane Finding

The Autopilot implementation is currently a safe scaffold, not a production
automation executor.

It can:

- classify a goal
- detect simple hard-block keywords
- create a policy decision
- create an execution lease
- write manifests and audit records under the runtime root
- write a local completion marker for allowed leases
- quarantine external adapter actions that do not have validated adapter
  contracts

It does not yet enforce all production-grade controls needed for real external
actions:

- no command allowlist or command hash verification
- no budget ledger enforcement
- no rate-limit ledger enforcement
- no repository allowlist enforcement inside the executor
- no localhost port inspection inside the executor
- no connector/API credential readiness check inside the executor
- no rollback implementation beyond record-only quarantine
- no actual adapter runner for Docker, n8n, MCP, provider, CRM, or publish jobs

Decision: treat Autopilot as ready for `A0/A1/A2 local artifact workflows` only.
Do not use it for real `A3/A4/A5` actions until adapter validators and runtime
ledgers are added.

## Recommended Execution Order

### Phase 0 - Baseline And Hygiene

Goal: keep the worktree and runtime state reviewable before any automation run.

1. Keep dirty lanes separated by scope.
2. Remove or ignore generated `__pycache__` files before commit.
3. Run safe syntax checks for Python and shell scripts.
4. Run masked secret and risk scans only; do not print matching secret values.
5. Confirm `git diff --check` is clean.

Ready now: yes.

### Phase 1 - Governance Reconciliation

Goal: resolve the mixed language between full-auto docs and older human-approval
docs.

Current state:

- `docs/autopilot/*` and `policies/*` define full-auto policy control.
- older files still reference approval packets and human approval gates.
- helper scripts such as external clone and Odysseus start still ask for manual
  approval phrases.

Required action:

1. Mark legacy approval docs as legacy, or rewrite them as job manifest /
   execution lease docs.
2. Decide whether scripts with manual prompts remain "manual safety tools" or
   get replaced by policy-lease wrappers.
3. Keep hard safety blocks as non-negotiable even in full-auto mode.

Ready now: partially. Needs documentation cleanup before live full-auto.

### Phase 2 - Autopilot Core Hardening

Goal: make policy decisions actionable and enforceable before real actions.

Required additions:

- `action_type` enum with explicit adapter names. Status: started.
- adapter contract documentation. Status: created in
  `docs/autopilot/AUTOPILOT_ADAPTER_CONTRACTS.md`.
- machine-readable adapter registry. Status: created in
  `policies/autopilot_adapter_registry.json`.
- per-adapter validators for `docker_localhost_start`, `external_repo_clone`,
  `provider_api_smoke`, and `mcp_connector_activation`. Status: implemented.
- `allowed_paths` and `allowed_repos` validation.
- `budget_caps` and `rate_limits` runtime ledgers.
- kill switch check before every execution step.
- command allowlist and command hash check.
- adapter preflight contracts:
  - `docker_localhost_start`
  - `external_repo_clone`
  - `provider_api_smoke`
  - `mcp_connector_activation`
  - `n8n_workflow_activation`
  - `social_publish`
  - `email_or_line_send`
  - `deploy`
- rollback contract per adapter. Status: documented, not enforced per adapter.
- audit event for every policy allow/block/skip/fail.

Ready now: partially. Core now fails closed for missing/invalid adapter
contracts and can validate four adapter types, but real adapter execution
remains blocked until runner code and runtime ledgers exist.

### Phase 3 - Local Artifact Workflows

These can run before external adapters because they only write local runtime
artifacts outside git.

#### AI Money

Status: safe local artifact generator.

Allowed now:

- daily money board
- offer ladder
- local lead tracker template
- content calendar draft
- case-study draft
- revenue tracker
- KPI summary

Not allowed yet:

- real outreach
- CRM writes
- email/LINE sends
- social publishing
- paid ad actions

#### Visual RAG

Status: safe local manifest/testset scaffold.

Allowed now:

- register source metadata
- create benchmark scaffold
- route source into text/visual/hybrid mode
- create evidence manifests with placeholder paths

Not allowed yet:

- screenshot crawling
- model loading
- GPU embedding
- client private document ingestion
- external PixelRAG clone/use

#### Model Training Candidate

Status: correctly blocked for real training.

Allowed now:

- candidate card
- access request draft
- provenance schema
- readiness score
- training/eval plan

Blocked:

- gated dataset download
- row inspection
- training run
- redistribution
- hosted/commercial use

Reason: access, provenance, file manifest, AGPL review, base model, and training
dependencies are not complete.

Ready now: yes for local artifacts, no for real training.

### Phase 4 - Browser Automation Candidate Path

#### PinchTab

Status: read-only clone and source audit complete.

Ready now:

- localhost-only runbook exists.
- `docker-compose.localhost.override.yml` exists in the external clone.
- rendered compose config was validated with Docker Compose v5.1.2.
- port `9867` is bound to `host_ip: 127.0.0.1` only.

Next allowed validation:

- start with a one-run token
- health check on `127.0.0.1`
- stop immediately

Still blocked during first validation:

- browser profile creation
- personal Chrome profile
- persistent session reuse
- MCP activation
- cookie inspection
- upload/download endpoint use
- network export body capture
- public website automation
- captcha or challenge solving
- LAN/public bind

#### TigrimOSR

Status: GitHub/raw-file intake only, not cloned.

Next safe step:

- read-only external clone
- Cargo metadata
- risk grep

Blocked:

- Docker start
- UI start
- browser control
- shell route
- provider key setup
- remote mode

Ready now: PinchTab preflight ready; TigrimOSR clone/audit pending.

### Phase 5 - Private Workspace And Agent Runtime Services

Odysseus, DeerFlow, Flowise, n8n, and MCP connectors must not be started through
the current Autopilot executor yet.

Required first:

- adapter-specific localhost override
- auth-enabled proof
- no public bind proof
- service health endpoint plan
- stop command
- runtime evidence directory
- rollback/cleanup command

Ready now: no for service start through full-auto. Runbooks and config-only work
are acceptable.

### Phase 6 - Provider/API Smoke Tests

GLM-5.2 and other provider smoke tests must run only after:

- key exists in environment
- no key is printed
- budget ledger exists
- request is small and logged
- private repo/client data is not sent
- fallback path is defined

Current `glm52_api_smoke_test.py` is safe in the sense that it skips when the key
is missing and masks the key, but it is not integrated with Autopilot budget or
kill-switch checks.

Ready now: manual/local smoke only if key and budget policy are explicitly set;
not ready for unattended full-auto provider calls.

### Phase 7 - Business Actions

CRM writes, n8n activation, Chatwoot/Twenty writes, email, LINE, Telegram, social
posting, and owned-channel publishing must come after:

- opt-in proof
- channel allowlist
- rate-limit ledger
- content safety classifier
- unsubscribe/opt-out rule
- rollback/deactivate path
- audit log

Ready now: no. Draft artifacts only.

### Phase 8 - Deploy / Push / Public Endpoint

This is last.

Minimum prerequisites:

- clean branch lane
- tests/build green
- secret scan masked and reviewed
- backup or rollback ready
- canary health check
- public auth/access layer
- no raw database/model/vector/admin port exposed
- audit log

Ready now: no.

## Findings

### F1 - Autopilot Is Scaffold-Only For Real Actions

Severity: high for live automation.

The current executor completes allowed leases by writing a local marker. This is
safe, but it means full automation is not actually wired to real action
adapters. Real adapters must not be added until policy enforcement is stronger.
External adapter tasks now quarantine by default without a validated contract.

### F2 - Manual Approval Language Still Coexists With Full-Auto Language

Severity: medium.

Older docs and helper scripts still use approval packet / approval phrase
language. This is not dangerous by itself, but it makes the operating model
ambiguous. Keep them as legacy/manual safety tools or convert them to
policy-lease wording.

### F3 - Provider/API Smoke Is Not Budget-Ledger Integrated

Severity: medium.

`scripts/models/glm52_api_smoke_test.py` avoids printing keys and skips without
`ZAI_API_KEY`, but it does not consult Autopilot budget/kill-switch state.

### F4 - External Service Start Scripts Are Safer Than Full-Auto, But Not Unified

Severity: medium.

Odysseus start and external clone helpers still require manual phrases. That is
safe, but inconsistent with the full-auto docs. Decide whether to keep them as
manual break-glass tools or wrap them with leases.

### F5 - Generated Python Cache Files Are Present

Severity: low, fixed during review.

`__pycache__` files existed under script folders after syntax validation. The
repo now ignores `__pycache__/` and `*.py[cod]`, and the generated cache files
from this review were removed from the worktree.

## Verified Checks

- Python compile passed for Autopilot, AI Money, Visual RAG, model-training, and
  GLM smoke scripts.
- Shell syntax checks passed for Autopilot execution wrappers, preflight,
  security scanners, external clone helper, and Odysseus localhost starter.
- `git diff --check` passed.
- Python cache artifacts were removed and ignored.
- Autopilot hard-block behavior blocked `print secret from .env`.
- Autopilot hard-block behavior blocked `bypass captcha on website`.
- Autopilot router created a local manifest and lease for a harmless local
  automation review artifact.
- Autopilot unit tests now cover local artifact allow, external Docker
  quarantine, decide-only auto-classification, and lease contract field
  propagation.
- Autopilot unit tests now cover positive and negative adapter contract cases
  for Docker localhost, external clone, provider smoke, and MCP activation.

## Recommended Next Work Packet

1. Add `.gitignore` entries for generated `__pycache__/` if not already covered.
2. Harden Autopilot with:
   - runtime budget/rate ledgers
   - command hash verification
   - adapter runner registry
   - adapter-specific dry-run/preflight artifacts
3. Keep AI Money and Visual RAG as local artifact-only lanes.
4. Run PinchTab first localhost validation only after the one-run-token start
   packet is prepared.
5. Keep Fable reasoning in candidate-only mode until access/legal/provenance
   gates pass.
