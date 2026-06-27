# Codex Session Sidebar Toolkit

Status: local-only toolkit manifest for the current GHOSTCLAW Codex session.

This toolkit is the read-only control surface that ties together Codex local,
KOB CLI, Hermes planner, OpenCode, AGY Antigravity 2, Manus, the A2A runtime,
the Command Broker, and the external Git repo registry.

It does not auto-approve raw commands. It auto-allows only the command classes
that the broker classifies as local, non-secret, non-destructive, and
dry-run/review safe.

## Command

```bash
python3 scripts/a2a/a2a_session_sidebar_toolkit.py
```

The command writes:

```text
apps/mission-control/src/fixtures/codexSessionSidebarToolkitStatus.json
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/codex_session_sidebar_toolkit.json
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/codex_session_sidebar_toolkit.md
```

## Included Surfaces

- Codex local sidebar as the operator surface.
- KOB CLI as planner, router, and context compressor.
- Hermes planner as policy/risk reviewer.
- Codex local as repo executor and validator.
- OpenCode and AGY Antigravity 2 as lease-required executor candidates.
- Manus as artifact producer with hash/metadata sync only.
- A2A runtime reports as evidence.
- Command Broker policy as the command decision source.
- External Git repo registry as the repo integration catalog.

## Allowed Now

- read repository files
- inspect architecture
- generate docs
- run lint/unit tests
- update Markdown
- create local test files
- create non-destructive patches after lease/lane lock
- simulate deploy plans without deploying
- sync artifact hashes
- append concise Obsidian memory pulses

## Blocked In This Toolkit

- approve-all without broker
- jailbreak or policy bypass
- secret read or print
- connector writes
- provider calls
- external repo clones
- Docker/service starts
- pushes
- deploys
- public endpoints
- generated asset mutation

## Workflow Map

```text
User goal
-> KOB or Hermes plan/risk review
-> A2A task or local command packet
-> Codex Command Broker decision
-> Codex local execution or report
-> validation artifact
-> runtime report
-> Obsidian pulse
```

## Mission Control Use

Mission Control can read
`apps/mission-control/src/fixtures/codexSessionSidebarToolkitStatus.json` as a
fixture. Browser UI code must not run shell commands directly. The fixture is a
status surface, not an executor.

Current UI wiring:

- Panel: `Session Toolkit`
- Source: `apps/mission-control/src/App.tsx`
- Mode: read-only fixture view
- Shows: agent routes, workflow routes, runtime reports, docs, registered
  repos, allowed dry-run actions, lease-required actions, and blocked actions
- Local Sync Queue: machine-readable task list for the next all-tool/all-repo
  sync slices, including KOB/Hermes context sync, tool/repo matrix refresh,
  Manus artifact hash sync, connector target binding, generated asset lane
  review, Deep Research fixture work, executor lease preflight, and Obsidian
  memory pulse.
- Integration Readiness: machine-readable matrix for Codex local, KOB CLI,
  Hermes, OpenCode, AGY Antigravity 2, Manus, external Git repos, connectors,
  Command Broker, A2A runtime, and Obsidian brain sync. Rows marked `ready`
  are local review surfaces, rows marked `lease_required` need a separate
  executor lane, and rows marked `blocked` require missing target or policy
  inputs before external action.
- Executor Lease Preflight: read-only command broker view showing registered
  commands, lease-required commands, active runtime leases, active lane locks,
  command hashes, required gates, and denied actions.
- Lease Request Packets: review-only packet list generated from
  `integrationReadiness` rows that require a future executor lease. These
  packets prepare OpenCode, AGY Antigravity 2, external repo audit, and
  connector target-binding review without creating active leases or acquiring
  lane locks.
- Objective Audit: read-only completion map for the current broad operator
  goal. It checks brokered auto-approve boundaries, Codex-local execution,
  KOB/Hermes routes, A2A reports, external repo registry, local sync queue,
  executor preflight, connector target binding, and external-action gates.

The queue is not an executor. Items marked `ready` are local review or runtime
artifact tasks. Items marked `lease_required` need a separate scoped lane before
mutation. Items marked `blocked` require missing target IDs or policy input
before they can leave draft mode.

The integration readiness matrix is also not an executor. It exists to make the
next safe lane explicit: Codex local remains the only repo executor; KOB and
Hermes stay in planning/routing/review mode; OpenCode, AGY, repo clone/audit,
connector sync, Docker, provider calls, push, and deploy require separate
lease-gated lanes before any real action.

The executor preflight is not an executor either. It exists so the operator can
see which commands require a lease, lane lock, command hash, runtime evidence,
and Codex review before any real action lane is opened. Commands with T5 or
deny decisions remain blocked even if they appear in the list.

The lease request packet layer is also not an executor. It writes only
reviewable request files under `.ghostclaw_runtime/a2async/state/executor_lease_requests/`
and a runtime report under `.ghostclaw_runtime/a2async/logs/`. It does not
write active leases, acquire locks, execute commands, call providers, write
connectors, clone repos, start Docker, push, deploy, or read secrets.

The objective audit is not a completion claim for live automation. It marks the
local control plane as visible and reviewable, while keeping connector sync,
repo clone, Docker start, provider call, push, deploy, generated asset mutation,
and public endpoint work gated behind separate scoped lanes.

## Verification

Mission Control was built to a runtime directory outside git:

```text
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/mission-control-session-toolkit-build
```

Build evidence:

```text
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/mission_control_session_toolkit_build.md
```

The evidence confirms the compiled artifact contains the `Session Toolkit`
panel, the `Codex Session Sidebar Toolkit` title, the `Local Sync Queue`,
`Integration Readiness`, `Lease Request Packets`, `Executor Lease Preflight`,
`Objective Audit`, the approve-all bypass boundary notice, and the provider-call
boundary notice. The build did not stage, push, or deploy. Repository
`apps/mission-control/dist` remains a separate dirty generated-assets lane and
must not be staged with this toolkit lane.

## Next Safe Action

Review the read-only panel locally, then decide whether to create the dedicated
Deep Research status fixture/panel or open a separate executor-lease lane for
one concrete external action. Open real connector sync, repo clone, Docker
start, provider call, push, deploy, generated asset mutation, or public
endpoint work only through a separate scoped lane and executor lease.
