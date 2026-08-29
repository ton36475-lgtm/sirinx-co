# Bounded Spawn Playbook

Status: planning and operator procedure; no automatic spawn service activated

## Principle

Never spawn all 47 roles. Select the smallest role set that can produce the
next required receipt and run no more than three workers beside the
coordinator.

## Spawn prerequisites

Before a worker starts, L4-36 must be able to prove:

- a validated `TaskEnvelopeV1` and exact role ID;
- prior-layer receipt or an explicit L5 advisory request;
- observed runtime principal and capability match;
- resource admission, maximum steps/time/tokens/cost, and cancellation path;
- exact path/resource lease for any B/C work;
- separate maker and checker identities;
- required approval ticket for any D action;
- output/evidence contract and terminal state.

If any item is absent, return `NO_ELIGIBLE_ROUTE` or `BLOCKED`; do not silently
substitute another role, provider, path, or action.

## Standard team shapes

### Research/inspection

```text
coordinator
+ one L1 observer (01-16)
+ one L2 analyst (17-25)
+ optional one L5 researcher (44-47)
```

All lanes are read-only. L3 compiles the result after receipts arrive.

### Local implementation

```text
coordinator L4-36
+ one maker: L4-37 | 38 | 39 | 40 | 41
+ independent checker: L4-42
+ optional adviser/verifier: L5-44..47 or L4-43 after checker completion
```

Only one maker holds a source lease. L4-42 never edits maker-owned files.

### Release preparation

```text
L3-35 validates gates/tickets
+ L4-42 verifies exact candidate
+ L4-43 assembles receipt/rollback packet
```

Push, merge, deploy, production migration, Cloudflare mutation, provider call,
queue mutation, or live send still requires its own action-specific ticket.

## Wave order

```text
Wave 1: L1 observation cards (up to 3)
receipt barrier
Wave 2: L2 analysis cards (up to 3)
receipt barrier
Wave 3: L3 planning/decision cards (up to 3)
scope + plan + action digest barrier
Wave 4: one L4 maker + one L4 checker
verdict barrier
Wave 5: L4-43 receipt/rollback and optional L5 truth audit
```

Do not keep a worker resident after its bounded stage. Return the result,
release the lease, and free the lane.

## Spawn envelope

Every orchestrator-to-worker message contains:

```text
task_id
run_id
role_id and card_id
goal and explicit non-goals
allowed inputs and source references
exact paths/resources
action class
budgets and deadline
prior receipt digests
required outputs/evidence
stop conditions
escalation target
```

It contains no secret values, raw credentials, browser cookies, unbounded logs,
or ambient authority.

## Completion handling

Worker text is treated as a candidate result. The manager checks schema,
budget, lease, scope, artifact digests, and terminal status, then stores an
event. Only an independent verifier and a committed receipt can advance the
task toward success.

## Current activation state

The repository has a passive 47-role registry, existing department heads, and
candidate dry-run dispatch code. Runtime spawn remains blocked until registry
parity, durable task/lease state, resource admission, cancellation, and
negative tests are complete.
