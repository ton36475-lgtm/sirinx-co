# SIRINX Agent Guidance Schema V1

Status: `ACTIVE_LOCAL_GOVERNANCE`
Architecture: `SIRINX_NEURAL_FABRIC_V1`
Policy: `policies/hermes-3-agent-operating-model.v1.json`

## Purpose

This contract defines how generated CLI guidance may coexist with the
canonical SIRINX engineering policy. It is a documentation and validation
surface; it does not launch an agent, grant a lease, authorize a provider, or
approve an external effect.

## Authority precedence

1. Exact human approval and platform safety rules.
2. `SIRINX_NEURAL_FABRIC_V1`.
3. `policies/hermes-3-agent-operating-model.v1.json`.
4. Root `AGENTS.md` and `.ai/constitution.md`.
5. Digest-bound task contract, path lease, and acceptance packet.
6. Generated OMX/OMC/Orca or agent-specific guidance.

Lower layers may narrow execution. They must not expand authority, concurrency,
write access, provider access, or external effects granted by a higher layer.

## Canonical operating fields

```text
HERMES_ROLE           = ENGINEERING_MANAGER_ONLY
IMPLEMENTATION_AGENTS = CLAUDE_CODE + CODEX + OPENCODE
MAX_PARALLEL_AGENTS   = 3
MAX_PARALLEL_WRITERS  = 2
INDEPENDENT_REVIEWER  = 1
KIMI                  = OPTIONAL_READ_ONLY_ADAPTER
MERGE_DEPLOY_PROD     = HUMAN_RED
PROVIDER_CALL         = SEPARATE_EXACT_GATE
```

## Role contract

| Principal | Default role | Write authority | Review authority |
|---|---|---|---|
| Hermes | engineering manager | workflow metadata only | evidence convergence; no self-approval |
| Claude Code | bounded maker | assigned frontend/UX worktree paths | not its own candidate |
| Codex | bounded maker | assigned backend/data/API worktree paths | not its own candidate |
| OpenCode | independent verifier | none by default | candidate-specific read-only verification |
| Kimi | optional adapter | none | research/docs only after adapter verification |

OpenCode never repairs a candidate. Repairs return to Claude Code or Codex
under a new maker task and lease, then OpenCode re-verifies the new candidate.

## Concurrency and lease contract

- no more than three worker agents per engineering run;
- every active optional adapter counts toward that three-agent limit;
- no more than two concurrent write leases;
- one owner and one active lease for each writable path;
- every writer uses a distinct worktree from one frozen base SHA;
- the verifier holds no write lease;
- integration uses a separate lease after candidate-specific receipts;
- Hermes is not counted as a fourth coder because it holds no product-code
  write lease.

## Generated overlay contract

Generated blocks must remain bounded by their marker pairs:

```text
<!-- OMX:AGENTS:START --> ... <!-- OMX:AGENTS:END -->
<!-- OMX:RUNTIME:START --> ... <!-- OMX:RUNTIME:END -->
<!-- OMX:TEAM:WORKER:START --> ... <!-- OMX:TEAM:WORKER:END -->
```

An overlay update is invalid if it:

- permits more than three worker agents or two writers;
- assigns product implementation to Hermes;
- makes OpenCode a default writer or permits self-review;
- makes Kimi a default/writable worker;
- treats `auto`, `autopilot`, `godmode`, `approve_all`, a roster, or a cmux
  pane as an authority grant;
- enables provider calls or undeclared fallback;
- downgrades merge, deploy, production, customer messaging, or marketplace
  mutation from `HUMAN_RED`;
- treats P092 or another pre-Neural-Fabric topology as current authority.

## Required task contract

Before a writer starts, its task contract must bind:

- run ID, task ID, principal ID, role, and immutable base SHA;
- repository, isolated worktree, branch, owned paths, and forbidden paths;
- objective, dependencies, constraints, acceptance criteria, and test commands;
- provider, secret, database, messaging, deploy, and external-write boundary;
- expiry, nonce, plan digest, path-set digest, and one-use approval when
  required;
- output fields for files, diff, commands, tests, assumptions, risks,
  blockers, and output digest.

## Required worker receipt

A receipt must bind task, principal, base SHA, path lease, changed files,
commands and exit codes, test artifacts, findings, residual risks, and output
digest. Hermes independently reads the diff and reruns required checks.

No final receipt means the task cannot enter `DONE`.

## Failure behavior

Unknown or conflicting guidance fails closed. Do not infer authority, silently
increase concurrency, change provider, read a secret, start a service, or
perform an external action. Return `BLOCKED` with the conflicting field and
the exact higher-authority contract.
