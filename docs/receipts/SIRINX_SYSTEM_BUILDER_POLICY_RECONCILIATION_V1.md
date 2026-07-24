# SIRINX System Builder Policy Reconciliation V1 — Receipt

Date: 2026-07-23 (Asia/Bangkok)
Status: `DONE_LOCAL_POLICY_ONLY`
Architecture: `SIRINX_NEURAL_FABRIC_V1`
Child mission: `SIRINX_SYSTEM_BUILDER_FOUNDATION_V1_LOCAL_ONLY`
Slice: `B1_POLICY_RECONCILIATION`

## Grant binding

```text
APPROVAL =
  APPROVE_IMPLEMENTATION
  SIRINX_NEURAL_FABRIC_V1_N0B_SYSTEM_BUILDER_POLICY_RECONCILIATION_LOCAL_ONLY
BASE_SHA = efaaccab8b02cc5979b51499f0683f1a847488a6
PLAN_BODY_SHA256 =
  a6a39ada9b7897651e9875d8e9029064be75a38c8fa4de55c8cd9d89467c39ca
ALLOWED_PATHSET_SHA256 =
  c590796ea995354c509f84f8a74337b9eb5be4bc01f3a1d32680042040c4df69
ONE_USE = true
CMUX_SESSION = sirinx
MAX_AGENTS = 3
MAX_WRITERS = 2
PROVIDER_CALL = DENY
EXTERNAL_WRITE = DENY
```

The one-use grant was consumed by this B1 slice only. It does not authorize
B2-B10, provider use, service start, database access, external messaging,
commit, merge, push, deployment, or production mutation.

## Ownership and execution topology

```text
O3_SUCCESSOR_LANE = lane.governance.system-builder-policy-reconciliation
O3_EXCLUSIVE_WRITE_LEASE = ACQUIRED_AND_RELEASED
CONCURRENT_WRITERS = 1
ACTIVE_AGENT_INSTANCES = 3
ROOT_WRITER = Codex
READ_ONLY_REVIEWERS = 2
CMUX_RUNTIME_LAUNCH = NOT_REQUIRED_NOT_EXECUTED
STAGED_PATHS = 0
```

The two helper lanes performed read-only inspection and independent review.
They did not edit files, run tests, access secrets, call providers, or start
services.

## Result

The canonical policy now enforces:

- Hermes is engineering-manager-only and cannot author product code, hold a
  product write lease, or self-approve.
- Claude Code and Codex are the two bounded maker roles.
- OpenCode is the sole independent read-only verifier. Repairs return to a
  maker under a new lease, then OpenCode re-verifies.
- Kimi is optional and read-only; when active it consumes one of the three
  agent slots.
- maximum three active agent instances, maximum two writers, one independent
  verifier, one writer per path, and isolated worktrees.
- merge, push, deploy, production use, DNS, production database, marketplace,
  and customer messaging remain `HUMAN_RED`.
- production use additionally requires provider-key rotation.
- provider calls require a separate exact, one-use, digest-bound gate;
  automatic or undeclared fallback is denied.
- generated OMX guidance, CLI rosters, cmux panes, and historical P092
  topology cannot expand authority.

## Files

| Path | Result | SHA-256 |
|---|---|---|
| `AGENTS.md` | reconciled O3 governance overlay | `4ea079e9ac1ec079d09ab9cb6bd14ef24877e2018931061a689a75bb27ce4c6c` |
| `.ai/constitution.md` | replaced historical dual-model topology | `7c9e9d619e63b9385adc813fa6e6f2df68ae237ede2332b04744e1acfcb84f87` |
| `docs/guidance-schema.md` | added overlay precedence and task/receipt contract | `ca9211c320e530accea0fdea25a9411509659508cea309a05e38d7f579bb9d35` |
| `policies/hermes-3-agent-operating-model.v1.json` | added closed machine policy | `498e9af00eb87509932c0f3c493de22028edb17d01e76786bab323062d91e1f2` |
| `scripts/verify-hermes-3-agent-operating-model.mjs` | added policy/document/topology validator | `0710b1146a1748101a874118b5f8183ff002a0a8a9a0a8e9775286929f57310c` |
| `tests/hermes-3-agent-operating-model.test.mjs` | added positive and fail-closed fixtures | `01907804e1cf2c6a49a8060a69ae9fa485118f4032f153d738763cf09ddff344` |
| `docs/receipts/SIRINX_SYSTEM_BUILDER_POLICY_RECONCILIATION_V1.md` | this receipt | computed after final write |

Sorted six-artifact manifest SHA-256:
`83649deb49cbd12de98de8f7a700ee7e7e0768a6aeab7863a585870b7c1409ce`.

## Verification

```text
node --test tests/hermes-3-agent-operating-model.test.mjs
RESULT = PASS
TESTS = 29
FAILED = 0

node scripts/verify-hermes-3-agent-operating-model.mjs
RESULT = POLICY_OK

npm run check
RESULT = PASS

INDEPENDENT_GOVERNANCE_REVIEW = PASS
INDEPENDENT_VALIDATOR_REVIEW = PASS
```

Negative fixtures prove rejection of:

- six active agents and three active writers;
- Hermes as worker/candidate author;
- OpenCode write access and self-review;
- Kimi default/write authority and an uncounted optional adapter;
- missing or multiple independent reviewers;
- non-human or automated `HUMAN_RED` approval;
- production use without key rotation;
- provider calls without an exact grant and auto/undeclared fallback;
- unknown policy keys, malformed inputs, and invalid OMX markers.

## Safety read-back

```text
PRODUCT_RUNTIME_IMPLEMENTED = NO
HERMES_BUILDER_USE = BLOCKED_PENDING_B2_B8
KEY_READ = NO
SECRET_READ = NO
PROVIDER_CALLS = 0
SERVICES_STARTED = 0
DATABASE_ACTIONS = 0
EXTERNAL_MESSAGES = 0
EXTERNAL_WRITES = 0
COMMITS = 0
PUSHES = 0
DEPLOYS = 0
```

## Residual risks

- B1 is governance enforcement, not an Authority Kernel implementation.
- P092 source files remain unchanged and historical; precedence is enforced by
  the canonical policy instead of rewriting those out-of-scope files.
- `package.json` was not changed because it is outside the approved B1 path
  set. Direct verification commands remain canonical for this slice.
- The broader worktree still contains unrelated user-owned changes. No
  commit-all boundary exists.

## Next

B3 security-boundary repair may proceed only under its own exact one-use gate.
B2 Rust migration-core workspace closeout is independent and also requires its
own task-specific gate. B4 remains blocked until both B2 and B3 pass. Hermes
must not use the builder before B0-B8 close with current evidence.
