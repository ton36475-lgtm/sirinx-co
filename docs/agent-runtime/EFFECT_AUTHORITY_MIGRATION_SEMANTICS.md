# Effect-Authority Migration 0007 Semantics

Status: `DECISION_FROZEN / SQL_NOT_IMPLEMENTED / ALL_CIRCUITS_HOLD / PRODUCTION_HOLD`

This decision resolves the migration-0007 one-versus-thirteen registry drift
without creating authority. It is a static design contract. It does not add or
apply SQL, create roles, issue a ticket or grant, open a circuit, register an
executor or route, connect an MCP/A2A peer, or perform an external effect.

Machine-readable packet:
`config/agent-runtime/effect-authority-migration.semantics.plan-only.v1.json`

Canonical packet digest:

```text
ccb4a5afc0a2ee33114859dd777e4ebcd758f03abf92a103f075405c9324fcea
```

## Decision

Migration `0007_agent_runtime_effect_authority.sql` is one shared, additive
authority kernel over the existing 0005 ticket, grant, and outbox groundwork.
Its registry seed is the complete ordered A27 manifest:

- exactly 13 action/circuit definition rows;
- exactly 13 matching circuit-state rows;
- every circuit starts `HOLD`, version one, with no active grant or action;
- no ticket, grant, attestation, admission, outbox row, login, route, executor
  registration, or open circuit is seeded.

`RESOURCE_CLEANUP / resource_cleanup` is the second row of that shared
13-row registry. It is not a cleanup-only authority ledger and it is not the
only definition installed by 0007. Wording that says the first migration
inserts "exactly one binding" describes the earlier cleanup-only sketch and is
superseded by this decision.

The distinction is:

| Layer | Count at 0007 install | Authority |
|---|---:|---|
| Action/circuit definitions | 13 | none |
| Circuit-state rows | 13, all `HOLD` | none |
| Tickets, grants, attestations, admissions, claims | 0 | none |
| Runnable executors and registered effect routes | 0 | none |
| First later canary eligible for a separate review | at most one: `RESOURCE_CLEANUP` | still requires its own exact ticket, human grant, admission, and open circuit |

Canary eligibility does not open a circuit and does not make an executor
available. Provider/model, connector, A2A, Cloudflare, messaging, push, merge,
migration, install, and deploy effects remain held until their own later
contracts and approvals exist.

## Canonical registry pin

The database candidate must reproduce the exact row order and tuple bindings
from `config/agent-runtime/action-circuits.plan-only.v1.json`. The A27
domain-separated manifest digest remains:

```text
b2421996825817400d31f88757843225403ed2080541812c4db889e1ffe3cbb0
```

Every row keeps approval schema `2.0`, `effectState=PREPARED`,
`enabled=false`, `executorAvailable=false`, and `routeRegistered=false` in the
pre-migration contract. LINE remains unbound. Customer messaging remains held
and unavailable until it gains a reviewed channel-specific contract.

## Shared persistence boundary

0007 extends rather than duplicates 0005-0006:

- `agent_runtime_action_tickets` remains the ticket ledger;
- `agent_runtime_approval_grants` remains the single-use grant ledger;
- `agent_runtime_outbox` remains the durable effect-claim ledger;
- a generic v2 action-intent/scope binding stores the immutable closed artifact
  reference and digest for one action; cleanup-specific evidence stays in its
  reviewed schema instead of creating a second cleanup approval ledger;
- principal attestations, action/circuit bindings, held circuits, v2 approval
  bindings, and independent action-time admissions are additive authority
  objects;
- `REQUESTING` is the durable pre-I/O boundary. An ambiguous result after that
  boundary becomes `EFFECT_UNKNOWN` and is never automatically replayed.

The generic runtime application retains the exact 0006 denial for tickets,
grants, outbox, verification, artifacts, and all new authority objects. Each
effect capability receives only its fixed function entry points; no executor
gets generic table DML or the ability to issue its own grant.

## Bootstrap authority

The new kernel cannot authorize its own installation. Migration 0007 and its
prerequisite role bootstrap require the pre-existing, human-operated release
process. Before any candidate may be applied, one external ticketed production
migration decision must bind at least:

- exact repository revision and reviewed migration checksum;
- exact target environment and expected 0005-0006 inventory/checksums;
- exact operator/DBA identity and time window;
- prerequisite NOLOGIN role inventory and safe attributes;
- disposable empty-state, prior-state, RLS, race, crash, and restore receipts;
- rollback and forward-recovery procedures;
- independent review receipt.

Role provisioning is separately ticketed and never stores credentials in the
repository. The migration creates no LOGIN role and aborts if prerequisite
roles are absent, privileged, inheritable in an unsafe way, or have unexpected
memberships. Applying 0007 leaves all 13 circuits held and creates no authority
to perform a second effect.

After 0007 is proven and installed, later migrations and effects consume the
kernel through their own action tickets. They do not inherit the bootstrap
ticket and cannot treat a release gate, bearer token, agent card, UI status, or
structural receipt as an executable grant.

## Runtime admission and compatibility

0007 must land with a version-aware exact inventory update. The current 0006
runtime admits exactly its reviewed table/policy/function inventory; it must
not be loosened to a greater-than-or-equal count.

- old code presented with schema 0007 refuses startup;
- 0007-aware code presented with schema 0006 may run only existing non-effect
  services and reports the authority kernel unavailable;
- 0007-aware code presented with schema 0007 admits only the exact reviewed
  relations, policies, functions, owners, ACLs, role memberships, 13 registry
  rows, 13 held circuits, and zero seeded authority rows;
- unknown rows, policies, overloads, grants, open circuits, or executors fail
  closed.

## Implementation gate

The SQL file remains absent and deferred. Implementation requires resource
admission first, followed by the exact disposable Postgres matrix and an
independent review of the candidate bytes. Until those receipts exist:

```text
MIGRATION_0007                 = NOT IMPLEMENTED
REGISTRY_DECISION              = 13 DEFINITIONS / 13 HELD CIRCUITS
SEEDED_AUTHORITY_ROWS          = 0
OPEN_CIRCUITS                  = 0
LIVE_MCP_OR_A2A_CONNECTIONS    = NOT PROVEN
TELEGRAM_OR_LINE_SEND          = PROHIBITED
CLOUDFLARE_OR_DATABASE_EFFECT  = PROHIBITED
PRODUCTION                     = HOLD
```
