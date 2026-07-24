# SIRINX 47 Ronin Passive Role Registry

This directory is the human-readable, non-executable specification for the
SIRINX 47 Ronin agentic-coding organization.

It does not register agents, start workers, grant capabilities, open a gate,
call a provider, send Telegram messages, write production data, push Git,
deploy, or mutate Cloudflare. Runtime behavior remains fail-closed.

## Authority

- `crates/sirinx-agents/src/roster.rs` is authoritative for numeric role
  ranges: L1 `01-16`, L2 `17-25`, L3 `26-35`, L4 `36-43`, and L5 `44-47`.
- [`crates/sirinx-agents/data/ronin-role-registry.v1.json`](../../../crates/sirinx-agents/data/ronin-role-registry.v1.json)
  supplies the crate-contained passive functional descriptions and maps each
  role to an existing runtime principal. It does not replace Rust authority.
- The 47 entries are logical roles, not 47 resident processes.
- Runtime dispatch may use at most three worker lanes. One source-mutating
  maker and its checker must never share a role or lease.
- Postgres is the sole durable task, lease, approval, gate, and receipt
  authority. Files, UI cards, queues, Durable Objects, and process presence are
  projections or evidence only.
- Kai is outside the numbered 47 and may produce drafts only. Every
  customer-visible send remains human-gated.

## Contents

- [`crates/sirinx-agents/data/ronin-role-registry.v1.json`](../../../crates/sirinx-agents/data/ronin-role-registry.v1.json)
  — canonical machine-readable passive specification embedded and validated
  by Rust.
- `cards/ronin-01-*.md` through `cards/ronin-47-*.md` — one passive card per
  logical Ronin.
- `cards/kai-customer-liaison.md` — the unnumbered, draft-only Kai card.

The Markdown cards intentionally contain no frontmatter so that no agent
loader can mistake them for executable role definitions.

## Layer model

| Layer | Range | Count | Head | Default authority |
| --- | --- | ---: | --- | --- |
| L1 Perception | 01-16 | 16 | Kuranosuke (01) | Read-only observation |
| L2 Analysis | 17-25 | 9 | Jūnai (17) | Read-only analysis |
| L3 Decision | 26-35 | 10 | Kihei (26) | Plans and decisions only |
| L4 Coordination | 36-43 | 8 | Gengo (36) | Exact-lease local work only |
| L5 Research | 44-47 | 4 | Mimura (44) | Read-only advisory research |

Operational flow is L1 → L2 → L3 → L4. L5 advises a requesting layer but
cannot execute. Unknown inputs, targets, providers, models, tiers, receipts,
or authority fail closed.

## Action-class vocabulary

- `A` — read-only, bounded observation or analysis.
- `B_PLAN_ONLY` / `B_COORDINATION` — internal planning or coordination record;
  no source effect.
- `B_EXACT_LEASE` — reversible local work against exact paths and an unexpired
  Postgres-backed lease.
- `B_FIXTURE_ONLY` — isolated test or disposable fixture mutation only.
- `C_MAKER_CHECKER` — confidential local work requiring an independent
  checker before any promotion.
- `D_TICKETED_ONLY` — a future external or material mutation may proceed only
  with one exact, unexpired, action-specific human ticket. This registry does
  not activate any D action.
- `X` — prohibited and non-approvable.

Install, provider call, live send, push, merge, production migration,
Cloudflare mutation, and deploy remain separate D tickets. Generic approval,
self-approval, inherited approval, or a UI status is invalid authority.

## Runtime principal mapping

The mapping mirrors `services/dev-control-api/src/runtime-agent-cards.mjs`:

| Principal | Role IDs | Boundary |
| --- | --- | --- |
| `sirinx-rust-runtime` | 01-04, 17-19, 26, 36 | Compiled roles only |
| `webmcp` | 05-07, 45 | Read-only web observation/research |
| `claude-code` | 08-10, 20-21, 30-31, 42 | Read-only inspection/design/checking |
| `claude-cowork` | 11-12, 32, 46 | Read-only artifact/workspace advisory |
| `hermes` | 13, 27-29, 35 | Read-only orchestration and planning |
| `manus` | 14, 47 | Read-only external research |
| `droid` | 15 | Read-only mobile/device evidence |
| `pi` | 16 | Read-only context summarization |
| `kimi-code` | 22-23, 44 | Read-only QA/security/deep review |
| `codex` | 24, 33-34, 37-39 | Exact-path lease candidate for L4 only |
| `copilot-cli` | 25 | Read-only suggestions/review |
| `opencode` | 40 | Exact bounded artifact job only |
| `antigravity2` | 41 | Candidate-output-only prototype |
| `openclaw` | 43 | System-owned scope; no repo source write |

Principal presence, an app window, a static card, or a queue acknowledgment is
not a runtime handshake or completion receipt.

## Validation

The registry is valid only when all of these remain true:

1. JSON parses.
2. `roles` contains exactly 47 unique IDs equal to `1..47`.
3. Department counts are exactly `16/9/10/8/4`.
4. Every `cardId` and `functionalRoleId` is unique.
5. `maxConcurrentWorkers` is exactly `3` and external actions remain disabled.
6. Every passive Markdown card mirrors all canonical identity, mission,
   responsibility, input, output, evidence, prohibition, escalation, cadence,
   implementation-status, and source-reference fields.
7. There are 47 numbered cards plus the separate Kai card.
8. Every plan-only background assignment binds the canonical role ID, card ID,
   functional role ID, role-card cadence, and a non-empty subset of that role's
   outputs; all schedules remain disabled.

This directory remains additive, human-readable documentation. The canonical
machine artifact lives inside `sirinx-agents`; changes to runtime Rust,
JavaScript, agent loaders, gates, or deployment state require separate scoped
work.

Run the local invariant check with:

```text
node scripts/validate-ronin-role-registry.mjs
```
