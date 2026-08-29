# Agentic AI Management

Status: management contract; no daemon or schedule activated

## Management objective

Use heterogeneous AI apps, CLIs, local models, and cloud models as bounded
runtime principals behind one task/lease/evidence system. A model or vendor is a
worker capability—not a department, authority, or completion signal.

## Roles versus principals

- A Ronin role states the mission, inputs, outputs, evidence, and action class.
- A runtime principal is an observed app/CLI/service capable of hosting work.
- A task envelope binds one role to one principal for one bounded stage.
- A lease grants exact paths/resources for a short time.
- An approval ticket grants one exact external action; it never grants a role
  general authority.

The manager may select Codex, Claude Code/Cowork, Kimi, OpenCode, Hermes,
WebMCP/browser tooling, a local GGUF model, or a ticketed remote model only when
the principal's verified capabilities and data policy match the role.

## Admission policy

Before dispatch, verify:

1. resource floor and lane availability;
2. exact role and required prior-layer receipt;
3. observed principal identity and version;
4. data class, model/provider route, and egress policy;
5. path/resource lease and conflicting-writer check;
6. maximum steps, tokens, calls, cost, time, and output size;
7. checker and rollback assignment;
8. stop conditions and cancellation path.

No automatic provider fallback is allowed unless the ticket names the ordered
fallback set and caps.

## Mac mini M2 operating envelope

- one coordinator;
- at most three worker lanes;
- one local inference server at a time;
- local model concurrency 1 and conservative context;
- one repository writer at a time per worktree;
- one browser context for release evidence;
- background work yields to interactive work;
- installs, full builds, model downloads, and disposable database work require
  at least 15 GiB free plus a reviewed expected disk delta.

The 47 roles are time-sliced through this envelope.

## Work assignment score

Candidate principals are ranked by hard eligibility first, then:

```text
capability match
+ evidence quality
+ deterministic/tool-schema support
+ local/privacy fit
+ availability
- cost
- latency
- unresolved risk
- context-switch/resource pressure
```

Hard ineligibility always wins. A high model score cannot bypass missing auth,
license, lease, approval, data-class, or evidence requirements.

## Budgets and loop control

Every stage defines `max_steps`, deadline, token/output ceiling, external call
count, cost ceiling, retry policy, and terminal states. Default terminal states
are `SUCCEEDED`, `FAILED`, `BLOCKED`, `CANCELED`, `QUARANTINED`,
`EFFECT_UNKNOWN`, and `DEAD_LETTER`.

The coordinator stops a run when it reaches a budget, loses its lease, detects
scope drift, conflicts with another writer, encounters protected data, or
cannot prove an external effect.

## Knowledge and memory

Agents may read task-scoped summaries and source-linked decisions. Durable
memory receives concise, approved pulses only: what changed, evidence path, and
next safe action. Never persist raw chat logs, secrets, credential/config
contents, browser cookies, customer payloads, or large raw logs.

## Operator dashboard minimum

Show separately:

- configured roles, observed principals, eligible routes, active leases;
- planned, queued, running, waiting, checking, blocked, and terminal tasks;
- maker/checker identity and scope;
- budget consumption and deadline;
- gate/ticket state and expiry;
- evidence completeness and exact SHA;
- DLQ and `EFFECT_UNKNOWN` counts;
- panic state and rollback readiness.

Never label configured, observed, spawned, queued, or acknowledged as `DONE`.

## Incident and panic behavior

Panic mode rejects new claims, revokes unused capabilities/tickets, holds every
external gate, lets safe leases expire, stops retry scheduling, preserves
receipts/DLQ, and routes ambiguous effects to human reconciliation. It does not
erase evidence or auto-roll back an effect whose outcome is unknown.

## Governance metrics

Initial service-level objectives:

- zero duplicate external logical effects;
- zero receipt-chain gaps;
- zero self-approved tasks;
- zero source writes without an exact lease;
- every external effect has a ticket and read-back receipt;
- every completion claim is exact-SHA bound;
- blocked/DLQ items become visible to the operator within five minutes.
