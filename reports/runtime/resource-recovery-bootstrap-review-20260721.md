# Resource Recovery Bootstrap Review Evidence — 2026-07-21

Verdict: `RECORDED_COMPARISON_VALIDATED / BOOTSTRAP_REVIEW_BLOCKED / NO_AUTHORITY / NO_CLEANUP / PRODUCTION_HOLD`

## Scope

A32 compares the four literal candidates already identified by A22 after A31
showed that C01 no longer nominally restores the 15 GiB workload floor. It does
not refresh A31, collect action-time evidence, issue a grant, select a cleanup
operation, authorize multiple targets, or expose an executor/route.

The canonical packet is
`config/agent-runtime/resource-recovery.bootstrap-review.v1.json`; its
domain-separated packet digest is
`67f729a0f729535c68a9f7ba244f6999289799f1e2271aa2d264c37079415268`.
It binds these parent bytes:

| Parent | SHA-256 |
|---|---|
| A22 recovery report | `d22040817758472d68587f48b070e6a16686a4f0419005cad85836b17c9bccc3` |
| A23 plan | `859a31f0ed505450f78321d738f43b0d4f204ed745834b1436ab000536470ad1` |
| A31 packet | `d7c700253d3b6a6666cb3f321960be00e3aa91a834cef3f0f232df7b7d661ec2` |
| A31 report | `0d86a0a8441c29720c4934f13c036dcf95eb643afea3844f5071f476587e1a65` |

Final latest-byte implementation artifact hashes:

| Artifact | SHA-256 |
|---|---|
| Closed Draft 2020-12 schema | `e27f3d6fa9eaf3bb914640877ba3b5bed7ebbb73c94ba1cebaca97ce037ed4fd` |
| Pure validator | `09c20af369517a60c65b7126929bc94e5fcfa79c6ff26e3e0f2e3a1601b31cd7` |
| Focused tests | `e89fcee7a30c0afd2d3e3f039db2d6aed0fdefbb1f4d3de8b92d4eccda80c041` |
| Canonical packet file | `046cc5785b8fba430661559a15c73afe35cf517154882b69aa5da7487500ebbe` |
| Contract documentation | `e3505f79e9b9610efb1c969258e1b5d3a3c3b53db9472c3a505ccc8f6221117e` |

## Recorded snapshot and result

The bounded read-only snapshot ended at
`2026-07-21T04:40:19+07:00` with `11,820,344 KiB` available on
`/dev/disk3s5`. The exact root metadata and displayed allocations produced:

| Candidate | Allocated / logical KiB | Nominal projected free | 15 GiB result |
|---|---:|---:|---:|
| C01 Cargo target | 3,125,988 / 3,098,930 | 14,946,332 | 782,308 short |
| C02a one npx entry | 2,619,468 / 2,397,745 | 14,439,812 | 1,288,828 short |
| C05a pnpm v3 generation | 1,931,228 / 1,705,487 | 13,751,572 | 1,977,068 short |
| C05b pnpm v10 generation | 2,950,664 / 2,683,175 | 14,771,008 | 957,632 short |

No candidate alone crosses 15 GiB even on optimistic displayed-allocation
arithmetic; none approaches the 20 GiB promotable target. Every guaranteed
minimum reclaim is zero because unique APFS extents/clones/snapshots, complete
consumer absence, link isolation, offline recovery, and candidate-specific
operations are not proved.

The broader `_npx`, npm content cache, Go module cache, and pnpm store roots
remain wholesale-ineligible. Current pnpm v11 and the Cargo registry remain
keep-by-default. The validator rejects substituting any of those paths merely
because a broader root is large enough nominally.

## Contract behavior

The pure validator:

- pins branch, HEAD, all four parent hashes, candidate order/path/class/
  disposition/root identity/allocation, thresholds, policy lists, and ten
  canonical blockers;
- recomputes each candidate metadata digest and the packet digest;
- rejects duplicate/reordered/substituted candidates, optimistic reclaim,
  proof/eligibility/operation promotion, wholesale/keep substitution,
  multi-target grants, aggregate reclaim credit, automatic continuation,
  stale/exact-expiry requests, parent drift, unknown fields, and every
  authority/effect promotion;
- rejects Proxy/accessor/shared/cyclic/sparse/deep/wide graphs before semantic
  reads and returns a distinct recursively frozen clone;
- imports only `node:crypto` and `node:util` and has no filesystem, process,
  environment, network, database, route, approval transition, or execution
  primitive.

## Verification receipt

- Node syntax: `PASS` for validator and test.
- Strict Draft 2020-12 Ajv: `PASS` for synthetic and exact canonical packets.
- Focused Vitest: `PASS`, 1 file / 18 tests / 18 passed.
- `npm run check`: `PASS`.
- Complete dev-control suite: `PASS`, 43 files / 344 tests / 344 passed.
- Cargo, Docker, disposable Postgres, browser, provider/model, and live
  connector tests: not run; resource admission and external gates remain held.

The first adversarial review found two P2 issues: timestamps could be resealed
to refresh historical metadata, and the canonical test could previously skip
a missing config file. The module/schema now const-pin review/task/run IDs,
capture/expiry times, and the exact packet digest; the missing-file escape is
removed. Direct reproductions and focused 18/18 pass. The final latest-byte
code-review verdict is `CLEAN` and the independent evidence verdict is
`VERIFIED` for this exact static comparison scope.

The evidence checker independently reproduced syntax, focused 18/18, strict
schema/runtime parity, parent/candidate/packet digests, arithmetic, expiry, and
timestamp-reseal rejection. It did not replay the full 344-test suite because
that audit prohibited server/listen/fetch-bearing files; 43 files / 344 tests
is the root execution receipt, not an independent network-free replay.

At `2026-07-21T04:59:19+07:00`, free space was `11,812,640 KiB`, down
`7,704 KiB` from the packet. The current 15 GiB shortfall was `3,916,000 KiB`;
C01 then projected only `14,938,628 KiB`, still `790,012 KiB` short. This drift
does not change the blocked decision and is not written back into the immutable
historical packet.

## Remaining blockers

The packet requires ten explicit blockers, including no qualifying single
target, absent bootstrap authority, absent candidate-specific operations,
zero APFS/link/clone/consumer/recovery proof, unresolved staged recovery, and
the unresolved migration-0007 one-vs-13 registry semantics.

After capacity is separately restored, the safe order remains B10.1 runtime
refusal/quarantine, registry-semantic resolution, migration 0007 plus
disposable Postgres/RLS proof, the narrow Rust action-time collector, and only
then one separately attested human one-target canary.

No deletion, Trash move, cache/store prune, command execution, process stop,
install, Cargo command, build, database/model/service start, MCP/A2A connection,
provider call, Cloudflare mutation, Telegram/LINE send, Git push/merge, or
deploy occurred.
