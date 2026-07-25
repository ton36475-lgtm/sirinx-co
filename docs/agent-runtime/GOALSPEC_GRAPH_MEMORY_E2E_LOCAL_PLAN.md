# GoalSpec + Shared Graph Memory Local Execution Plan

Status: LOCAL_INTEGRATION_AND_INDEPENDENT_REVIEW

## Approval identity

- Grant: `SIRINX_SHARED_GRAPH_MEMORY_V1_PROJECT_LOCAL_CODE_ONLY`
- Base commit: `1f05814c3e9d173e525234d69b3ce7f2d1b01a57`
- Worktree: `/Users/sirinx/SIRINXDev/worktrees/sirinx-goalspec-e2e-20260724`
- Branch: `agent/goalspec-e2e-local-20260724`
- One-use grant: consumed by this bounded implementation run

## Non-negotiable boundaries

- Provider inference is denied.
- External writes are denied.
- Global installs, automatic config writes, hooks, service starts, deploys,
  pushes, merges, and production database actions are denied.
- MCP transport is local stdio only.
- Graphify runs in code-only/offline mode.
- Agents may read graph memory and submit proposals only.
- Hermes plus the canonical Obsidian vault remain the durable memory authority.
- No implementation may read or print secrets.

## Architecture boundary

```text
source tree
  -> Graphify code-only index
  -> read-only stdio graph tools

agent observation
  -> deterministic proposal validation
  -> local proposal queue/checkpoint
  -> Hermes review packet
  -> approved Obsidian sync (outside this run)

canonical Obsidian vault
  -> read-only inventory with secret blocking and PII redaction
  -> content-addressed sanitized projection
  -> exact-digest read-only stdio queries
  -> no direct agent write or promotion

GoalSpec HTTP intent
  -> strict untrusted DTO
  -> deterministic local planner
  -> sealed no-provider tool catalog
  -> run evidence/status
  -> no external effect execution
```

Graphify is structural code context. LangGraph may coordinate local proposal
state. LangChain may wrap deterministic local tools. Neither is a durable
memory authority.

## Writer leases

### Maker A — graph-memory tooling

Owned paths:

- `tools/graph-memory/**`
- `.graphifyignore`

Forbidden:

- `.mcp.json`
- `.claude/**`
- `.codex/**`
- user/global configuration
- hooks
- all Rust and frontend paths

### Maker B — GoalSpec execution core

Owned paths:

- `crates/sirinx-autoloop/src/goal.rs`
- `crates/sirinx-autoloop/src/lib.rs`
- `crates/sirinx-autoloop/src/tool.rs`
- `crates/sirinx-autoloop/tests/**`

Forbidden:

- provider bridges
- subprocess/network/filesystem execution tools
- control-plane and frontend paths
- all configuration outside the owned crate

### Integration owner — primary Codex session

Owned after maker convergence:

- `.graphifyignore`
- `Cargo.lock`
- `crates/sirinx-agents/src/engineering_registry.rs`
- `crates/sirinx-control/**`
- `MASTER_PLAN.md`
- `docs/agent-runtime/**`
- evidence and receipts under `reports/`

The integration owner does not modify maker-owned paths while makers hold
leases.

## Required acceptance evidence

1. Local graph index and proposal validation tests pass without a provider.
2. Agent-facing graph MCP exposes read-only tools over stdio only.
3. Proposal workflow cannot approve, delete, or write Obsidian memory.
4. GoalSpec cannot embed approval, tool names, or effect authority.
5. The execution profile exposes only deterministic no-provider/no-effect
   tools.
6. Duplicate tool registration and ambiguous side-effect declarations fail
   closed.
7. Run status and evidence distinguish planned, running, passed, failed, and
   blocked states.
8. Focused tests pass before workspace-wide checks.
9. An independent reviewer inspects scope, security, and evidence.

## Engineering-agent structural capacity

- Named adapter catalog: 11.
- Future reserve slots: 5.
- Total catalog ceiling: 16.
- Structural active-agent ceiling: 11.
- Source writers: at most 2.
- Independent verifier: exactly 1 for every source-writing plan.
- Hermes remains manager-only and cannot be admitted as a worker.
- Every slot is dormant/unverified, provider-denied, and proposal-only by
  default. Structural eligibility never launches a CLI or grants authority.
- Known and future adapter principals cannot be duplicated within one run.

## Local sandbox convergence

The local sandbox inventory and admission order are recorded in
`LOCAL_SANDBOX_ADMISSION_INVENTORY_20260724.md`. Dirty canonical roots remain
protected. Candidate patches must be replayed into fresh worktrees from a
verified current base and independently reviewed before integration.

## Deferred work

- Public website work is deferred until the system-builder, memory, GoalSpec,
  admission, and workspace-wide QA gates pass.
- Live Hermes MCP configuration is deferred because automatic configuration
  writes and runtime activation are denied.
- Provider-backed agents, Telegram delivery, LINE delivery, Cloudflare
  mutation, and production deploy require separate exact approvals.
