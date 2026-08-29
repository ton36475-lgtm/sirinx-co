# Implementation Plan

## Completed local slice

- A23 static resource-cleanup preflight: implemented and independently verified
  for the claimed HOLD-only scope.
- Focused result: 10 tests passed; no effect or external action occurred.
- A25 Draft 2020-12 schema-engine parity: strict compilation plus positive and
  negative instances pass for the four A24 schemas; dependency metadata is
  pinned and no package was installed.

## Active B12 sequence

1. Map the existing migrations 0005-0006, RLS, approval-grant, outbox, receipt,
   and runtime admission contracts.
2. Specify the smallest additive authority boundary that does not weaken the
   existing server-only tables or hard-coded migration checks.
3. Implement a no-execution admission vertical slice that binds resolved
   executable identity and a closed effect lifecycle while retaining
   `resource_cleanup=HOLD`.
4. Add negative tests for role overlap, stale evidence, replay, executable
   drift, target drift, circuit hold, unknown effects, and forged receipts.
5. Obtain independent review and update the evidence report.
6. Only after resource recovery and a separately reviewed database change,
   run disposable Postgres tests for migration/RLS/race/tamper behavior.
7. Ask the human operator for one exact, single-use cleanup grant only after
   authority, replay protection, executor admission, and receipts are verified.

Current progress: steps 1-5 are complete for the non-authoritative A24
evidence-plane candidate. Steps 6-7 and every runtime effect remain blocked by
resource admission and the absent shared Authority Kernel. The report-bound
sample was 13.918 GiB free, still below the 15 GiB workload floor.

Selected next local-only slice: a closed Connection Evidence Admission Preview
that rejects caller-authored readiness booleans and always returns
`EVIDENCE_VALIDATED_NOT_ADMITTED` with every connect/emit/send capability false.
It must add no route, database, fetch, process start, provider call, or message.

## Deferred release sequence

After the resource gate passes: full local verification, Billing Lock evidence,
CI, migrations 0003-0006 in disposable Postgres, authenticated browser smoke,
independent review, exact-ticket merge, and separately ticketed Rust/Cloudflare/
messaging deploy lanes. No later phase inherits authority from an earlier one.
