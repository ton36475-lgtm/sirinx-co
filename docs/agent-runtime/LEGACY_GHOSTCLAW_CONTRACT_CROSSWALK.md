# Legacy and Canonical Agent Contract Crosswalk

Status: truth-preserving migration guide

## Why this crosswalk exists

The repository currently contains multiple 47-item views that serve different
purposes. Their array positions must not be treated as interchangeable numeric
role IDs.

| Surface | Meaning | Authority |
|---|---|---|
| `crates/sirinx-agents/src/roster.rs` | numeric roles 01–47 and L1–L5 ranges | canonical numeric authority |
| `crates/sirinx-agents` implementations | executable Rust agents for a subset of IDs | implementation evidence only |
| `services/dev-control-api/src/agent-team.mjs` | 47 business-role aliases and 12 owner profiles | business/profile projection |
| `runtime-agent-cards.mjs` | runtime principals and surface cards | candidate routing metadata |
| `agentic-enterprise.mjs` | candidate generic role/dispatch view | candidate, not landed canonical registry |
| `.claude/agents/*-lead.md` | executable department heads | department-level delegation surface |
| `crates/sirinx-agents/data/ronin-role-registry.v1.json` | crate-contained passive role-specific contract | canonical semantic artifact validated by Rust |
| `docs/agents/ronin/cards/*.md` | passive human-readable role cards | review aid only; no execution authority |
| A2A `AgentCard` | external runtime/node identity | protocol identity, not Ronin role |

Examples of collisions: business-array position 2 is not Rust role 02
`FbGroupScanner`; business-array position 17 is not Rust role 17 Jūnai; and
business-array position 36 is not Rust role 36 Gengo. Consumers must use stable
namespaces and never join these views by array position.

## Canonical identifiers

```text
Ronin numeric identity: roleId = 1..47
Ronin stable card ID:    ronin-01 .. ronin-47
Functional role ID:     namespaced kebab-case string
Runtime principal ID:   independent identifier such as codex or hermes
Business/profile alias: independent legacy string
A2A Agent Card ID:      protocol/runtime URL or identifier
```

Kai has `roleId = 0` only in legacy/runtime convenience code and is outside the
47 operational/research roster. The human approver is also outside the roster.

## Migration rules

1. Keep Rust ranges authoritative.
2. Treat the passive registry as the semantic source during review.
3. Add cross-language parity tests before wiring the registry into runtime.
4. Introduce an explicit mapping table for business aliases; never infer by
   array index.
5. Preserve implemented IDs 01–04, 17–19, 26, and 36 and their existing
   pipeline semantics.
6. Reserve `AgentCard` for A2A; name internal records `RoninRoleCard`.
7. Keep generated/passive cards outside `.claude/agents/` until each executable
   agent's tools and authority are separately approved.
8. Migrate one department at a time with count, uniqueness, range, semantic,
   source-reference, and behavior tests.

## Legacy GhostClaw/A2A interpretation

- A2A/queue folders are routing context, not completion.
- `done/` placement without a terminal receipt remains unverified.
- A pane, spawned process, handshake, UI card, or health response is evidence
  of presence only.
- Existing custom SIRINX sync routes stay private compatibility shims until A2A
  v1 conformance and trust controls pass.
- Telegram and command-center surfaces remain ingress/projection layers, never
  shell or approval authority.

## Runtime implementation sequence

The safe order is crate-contained passive registry → JSON Schema validation →
Rust `RoninRoleCard` validation → JS/API projection generated from the Rust
contract → durable task/run/lease store → dry-run scheduler → one isolated
maker/checker pilot → A2A/Cloudflare/Telegram adapters behind separate gates.
