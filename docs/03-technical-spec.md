# Technical Spec

## Current bounded slice

The active slice is B12, the fail-closed promotion path from the A23 static
resource-cleanup preflight to a future authoritative one-target cleanup flow.
This document does not authorize or implement cleanup.

## Existing verified boundary

A23 provides a pure, read-only structural validator for one literal generated
target. It binds the repository, target, operation preview, closed environment,
grant lifetime, principals, target manifest, process snapshot, thresholds, and
domain-separated digests. Its output is unconditionally `HOLD` and reports:

```text
authorityValidated=false
admissionValidated=false
approvalConsumed=false
replayProtectionAvailable=false
executorAvailable=false
canExecute=false
cleanupExecuted=false
```

Focused evidence: 10 of 10 A23 tests pass. This is not full-suite, database,
runtime, or production evidence.

## B12 authority requirements

A future authoritative transition must be additive and fail closed. It must:

1. keep `resource_cleanup` held by default;
2. bind one exact target, repository SHA, plan/scope/action digests, executable
   identity, maker, checker, human approver, expiry, and one-use nonce;
3. enforce distinct maker/checker/approver/executor principals;
4. consume approval and reserve the effect atomically in managed Postgres;
5. expose no direct application-table mutation path that bypasses the consumer;
6. reject missing, expired, replayed, revoked, mismatched, or already-consumed
   authority;
7. stop at `EFFECT_UNKNOWN` whenever the outcome cannot be reconciled;
8. write immutable pre-action and post-action evidence without treating a
   receipt shape as proof of execution;
9. require an exact separately issued human grant before the first effect.

## Executor admission requirements

The executor remains unavailable until action-time evidence resolves the Cargo
binary without symlink ambiguity and binds its absolute path, device, inode,
content digest, and exact revision. It must re-collect target, process,
worktree, free-space, and exclusion evidence immediately before the effect.
Admission is one target and one attempt; no automatic continuation is allowed.

## Resource boundary

Recovery is the only planned lane below the 15 GiB workload floor, but it still
requires fresh evidence that the operation stays above the 5 GiB emergency
floor plus reviewed worst-case growth. Full builds, installs, Docker,
disposable Postgres, model loading, and browser smoke remain barred until the
post-action measurement crosses the operation-specific threshold.

## Non-goals for this slice

- no cleanup, process signal, install, network call, provider call, live send,
  queue mutation, Git remote action, merge, migration application, or deploy;
- no secret or protected-config reads;
- no claim that migrations 0005-0006 or any proposed 0007 path passed Postgres;
- no reuse of `APPROVE_IMPLEMENTATION` as a resource-cleanup grant.

## Static result

The no-dispatch evidence/admission stage is implemented as A24 and independently
verified for that narrow scope. Nine focused tests pass. The evaluator always
returns HOLD and cannot transition a PREPARED attempt to REQUESTING. This result
does not satisfy any authority requirement above; migration 0007, RLS,
attestation, replay consumption, collectors, executor, and durable independent
checker remain future work.

A25 closes the narrower schema-engine gap: Ajv 8.20.0 compiles the Draft
2020-12 dependency graph in strict mode and checks positive and negative
instances for all four A24 schemas. It changes no evaluator result and adds no
collector, route, database, process, network, or effect capability.
