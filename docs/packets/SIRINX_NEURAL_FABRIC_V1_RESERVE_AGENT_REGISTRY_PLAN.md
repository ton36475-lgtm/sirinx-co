# SIRINX Neural Fabric V1 — Reserve Agent Registry Plan

Status: `PLAN_RECORDED / RESERVE_ONLY / RUNTIME_ACTIVATION_DENIED`

Mission: `SIRINX_NEURAL_FABRIC_V1_B1A_RESERVE_AGENT_REGISTRY_PLAN_ONLY`

Parent architecture: `SIRINX_NEURAL_FABRIC_V1_LOCAL_ONLY`

This additive packet reserves catalog capacity for verified adapters without
changing the active three-agent engineering topology. It does not modify or
supersede the B1 runtime policy, activate an adapter, grant a write lease,
connect MCP, launch a CLI, or authorize a provider call.

## 1. Decision

```text
REGISTERED_AGENT_CATALOG_LIMIT = 16
PRIMARY_AGENT_SLOTS           = 3
NAMED_RESERVE_SLOTS           = 5
FUTURE_ADAPTER_SLOTS          = 8

MAX_PARALLEL_ACTIVE_AGENTS    = 3
MAX_PARALLEL_WRITERS          = 2
INDEPENDENT_REVIEWERS         = 1
```

Registration is inventory metadata only. A registered adapter consumes no
runtime capacity until admitted to a specific run. Every admitted adapter,
including a reserve or future adapter, counts toward the active-agent ceiling.
Every holder of a source-write lease counts toward the writer ceiling.

## 2. Catalog

| Slot | Adapter | Class | Default state | Default authority |
|---|---|---|---|---|
| P01 | Claude Code | primary maker | policy-defined | bounded maker |
| P02 | Codex | primary maker | policy-defined | bounded maker |
| P03 | OpenCode | primary verifier | policy-defined | read-only verifier |
| R01 | Kiro | named reserve | `DORMANT_UNVERIFIED` | none |
| R02 | Cline | named reserve | `DORMANT_UNVERIFIED` | none |
| R03 | AGY / Antigravity | named reserve | `DORMANT_UNVERIFIED` | none |
| R04 | GitHub Copilot | named reserve | `DORMANT_UNVERIFIED` | none |
| R05 | Kimi | named reserve | `DORMANT_UNVERIFIED` | none |
| F01-F08 | future adapters | unassigned reserve | `DORMANT_UNVERIFIED` | none |

Hermes remains engineering manager only and is not a catalog worker.
Registering a reserve adapter does not make it a maker, verifier, reviewer, or
fallback provider.

## 3. Admission contract

Before any reserve or future adapter can become active, a separate exact gate
must bind all of the following:

1. adapter identity, binary, version, and immutable source or package digest;
2. authentication method without exposing credential values;
3. provider, endpoint, cost, token, retry, and fallback limits;
4. tool allowlist and explicit forbidden actions;
5. repository, worktree, exact owned paths, and source-write permission;
6. structured input and output schemas;
7. worker receipt and independent-verifier contract;
8. timeout, cancellation, repair cap, and failure semantics;
9. security review and local synthetic acceptance evidence;
10. one-use capability nonce bound to the current plan and scope hashes.

Unknown or partially verified adapters fail closed as
`DORMANT_UNVERIFIED`. No automatic fallback may activate a reserve adapter.

## 4. Concurrency and independence

- At most three worker agents may be active in one engineering run.
- At most two active agents may hold source-write leases.
- At least one active slot is reserved for an independent verifier when two
  makers are admitted.
- A verifier must not be the same agent instance or principal that authored the
  candidate.
- Aliases, duplicate sessions, nested adapters, and optional adapters count as
  separate active instances.
- Increasing the active ceiling above three requires a new capacity plan,
  deterministic concurrency tests, and a separate exact one-use approval.

## 5. B1 preservation

This packet is additive. It does not change:

- `HERMES_ROLE = ENGINEERING_MANAGER_ONLY`;
- the Claude Code, Codex, and OpenCode primary topology;
- `MAX_PARALLEL_ACTIVE_AGENTS = 3`;
- `MAX_PARALLEL_WRITERS = 2`;
- `INDEPENDENT_REVIEWERS = 1`;
- provider calls as a separate exact gate;
- production merge, deployment, and external mutation as `HUMAN_RED`.

The parent B1 receipt remains authoritative for the enforced operating model:

```text
1a15ef3fa8246c18d5ca395e42906be8e2685bac04d4d01ddf2b55616cd2bb5c
```

## 6. Canonical plan body

Hash rule: capture only the lines between the digest markers, preserve their
order, delimit every line with LF, and retain one final LF.

<!-- PLAN_BODY_DIGEST_START -->
MISSION=SIRINX_NEURAL_FABRIC_V1_B1A_RESERVE_AGENT_REGISTRY_PLAN_ONLY
PARENT_MISSION=SIRINX_NEURAL_FABRIC_V1_LOCAL_ONLY
PARENT_B1_RECEIPT_SHA256=1a15ef3fa8246c18d5ca395e42906be8e2685bac04d4d01ddf2b55616cd2bb5c
CHANGE_CLASS=DOCUMENTATION_PLAN_ONLY
HERMES_ROLE=ENGINEERING_MANAGER_ONLY
REGISTERED_AGENT_CATALOG_LIMIT=16
MAX_PARALLEL_ACTIVE_AGENTS=3
MAX_PARALLEL_WRITERS=2
INDEPENDENT_REVIEWERS=1
PRIMARY_AGENT_01=CLAUDE_CODE
PRIMARY_AGENT_02=CODEX
PRIMARY_AGENT_03=OPENCODE
RESERVE_AGENT_01=KIRO
RESERVE_AGENT_02=CLINE
RESERVE_AGENT_03=AGY_ANTIGRAVITY
RESERVE_AGENT_04=GITHUB_COPILOT
RESERVE_AGENT_05=KIMI
FUTURE_ADAPTER_SLOTS=8
RESERVE_DEFAULT_STATE=DORMANT_UNVERIFIED
ACTIVE_AGENT_ACCOUNTING=ALL_ACTIVE_ADAPTERS_COUNT_TOWARD_LIMIT
WRITER_ACCOUNTING=ALL_WRITE_LEASE_HOLDERS_COUNT_TOWARD_LIMIT
ONBOARDING_REQUIRED=BINARY_VERSION_AUTH_TOOL_ALLOWLIST_STRUCTURED_OUTPUT_RECEIPT_SECURITY_REVIEW
FUTURE_ADAPTER_ACTIVATION=SEPARATE_EXACT_GATE
PRESERVE_B1_ACTIVE_LIMITS=true
PRESERVE_PARENT_MANIFESTS=true
NO_EXISTING_ARTIFACT_MODIFICATION=true
OUTPUT_01=docs/packets/SIRINX_NEURAL_FABRIC_V1_RESERVE_AGENT_REGISTRY_PLAN.md
OUTPUT_02=docs/receipts/SIRINX_NEURAL_FABRIC_V1_B1A_RESERVE_AGENT_REGISTRY_PLAN_RECEIPT.md
RECEIPT_REQUIRED=true
PROVIDER_CALL=DENY
RUNTIME_ACTIVATION=DENY
WRITE_LEASE=DENY
MCP_CONNECTION=DENY
CLI_LAUNCH=DENY
EXTERNAL_WRITE=DENY
SECRET_READ=DENY
SERVICE_START=DENY
DATABASE_ACTION=DENY
GIT_STAGE_COMMIT_PUSH_MERGE=DENY
DEPLOY=DENY
<!-- PLAN_BODY_DIGEST_END -->

Expected digest:

```text
42cae6a2f6e7cc89b274a4ac5f8072d94502c23c28c3d07599b74c52d440e996
```

## 7. Exact path boundary

This slice may create only:

```text
docs/packets/SIRINX_NEURAL_FABRIC_V1_RESERVE_AGENT_REGISTRY_PLAN.md
docs/receipts/SIRINX_NEURAL_FABRIC_V1_B1A_RESERVE_AGENT_REGISTRY_PLAN_RECEIPT.md
```

The C-sorted, LF-final pathset digest is:

```text
78c5832d51447971eb82a719469f7466e174094b53aa23b99ad37495a0323b8c
```

No existing repository artifact may be modified by B1A.

## 8. Explicit non-authorization

B1A does not authorize adapter installation, authentication, login, provider
traffic, CLI or MCP execution, runtime reload, process start, database access,
secret access, external messaging, Git staging or commit, push, merge,
deployment, or any production mutation.

## 9. Next gate

This plan records reserve capacity only. Each adapter activation, or any change
to the three-agent active ceiling, requires its own exact one-use grant and
current acceptance evidence.
