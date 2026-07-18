# SIRINX System Architecture

License: MIT · Canonical repo: `ton36475-lgtm/sirinx-co` · Target: www.sirinx.co

## 1. System context

```mermaid
flowchart LR
    subgraph Internet
        C[Customers / SMEs]
        O[Operators]
    end
    subgraph Edge [Cloudflare - gated]
        CF[www.sirinx.co]
        CFA[dev.sirinx.co + Access]
    end
    subgraph Node [Any SIRINX node]
        W[sirinx-web :8080]
        K[sirinx-control :8711]
        D[dev-dashboard :8710]
        N[dev-control-api Node long-tail]
    end
    subgraph Data [Supabase Postgres]
        DB[(web_leads / web_analytics_events / web_pending_work / web_control_gates / web_failure_events / web_lessons)]
    end
    C --> CF --> W
    O --> CFA --> K
    O --> CFA --> D
    W --> DB
    K --> DB
    D --> N
    DB -- pg_notify --> K
```

## 2. Crate graph (Rust workspace, 8 crates)

```mermaid
flowchart TD
    core[sirinx-core\ndomain types]
    roi[sirinx-roi\nROI estimator]
    agents[sirinx-agents\n47 Ronin runtime]
    autoloop[sirinx-autoloop\nloop + ApprovalGate]
    store[sirinx-store\nStore trait: Memory | Postgres\nincluding durable gates]
    a2a[sirinx-a2a\ncards + OmniRoute + sync]
    web[sirinx-web\naxum :8080]
    control[sirinx-control\naxum :8711]

    autoloop --> agents & core & store
    store --> core
    a2a --> core
    web --> core & roi & store
    control --> core & store & a2a
```

Rule of the graph: `sirinx-core` has no internal dependencies; binaries
(`sirinx-web`, `sirinx-control`) never depend on each other — they share
state only through the database.

## 3. Agent organization (47 Ronin)

Runtime enforcement in `sirinx-agents::Dispatcher` — an agent may only
publish to the next layer; L5 advises any operational layer; budgets:
L1 4K → L2 8K → L3 16K → L4 32K, L5 128K, Kai 16K.

```mermaid
flowchart LR
    L1[L1 Perception 01-16\nKuranosuke] --> L2[L2 Analysis 17-25\nJūnai]
    L2 --> L3[L3 Decision 26-35\nKihei]
    L3 --> L4[L4 Coordination 36-43\nGengo COO]
    L5[L5 Research 44-47\nMimura] -.advisory.-> L1 & L2 & L3 & L4
    KAI[Kai chatbot] --- CUST[Customers]
```

The same structure exists as Claude Code sub-agents (`.claude/agents/`)
and as process rules (`AGENT_TEAM_PLAN.md`).

## 4. A2A mesh + OmniRoute

Every node runs `sirinx-control` and publishes an agent card whose
capabilities auto-load from its installed skills (`.claude/skills/` →
`skill:<name>` tags).

```mermaid
sequenceDiagram
    participant M as mac-mini-m2
    participant S as cloud node
    participant DB as Postgres queue
    M->>S: POST /api/a2a/sync {card, knownWorkIds}
    S->>S: OmniRoute.register(peer card)
    S->>DB: list pending work
    S-->>M: {missing_work, peer_agents}
    Note over M,S: either node can now POST /api/a2a/route<br/>{"capabilities":["skill:..."]} → best card
    DB--)S: pg_notify web_pending_work
```

## 5. Safety architecture (defense in depth)

| Layer | Mechanism | Where |
| --- | --- | --- |
| Release gates | 5 fixed gates hold-by-default; persisted open requires ticket | `sirinx-core` + `sirinx-store` + `sirinx-control` |
| Tool gating | ApprovalGate DryRun / Allowlist / Approved | `sirinx-autoloop` |
| Loop bounds | hard `max_steps` per autonomous run | `sirinx-autoloop` |
| Recovery bounds | safe failure kinds, structured lessons, capped retry/backoff | `sirinx-core` + `sirinx-store` + `sirinx-autoloop` |
| Layer discipline | no layer skipping, enforced at dispatch | `sirinx-agents` |
| AuthN | bearer token on control `/api/*` | `sirinx-control` |
| Data | RLS on all tables, no public policies | Supabase |
| Consent | analytics allowlist + consent flag | `sirinx-core` |
| Process | Human ตัดสินใจสุดท้าย | `GO_LIVE_GATE_CHECKLIST.md` |

At startup, `sirinx-control` creates the fixed five-gate safe-hold map
and overlays only known, valid decisions loaded from `Store`. Each gate
decision is serialized with an async mutex, written to Store first, and
only then applied to the runtime cache; persistence failure returns a
generic 500 and leaves runtime state unchanged for an `open`. A restrictive
`hold` applies locally first; if its write fails, a local emergency override
keeps that node held until a later successful decision. Before any action is
authorized, the node reads that gate from Store again and repairs its local
cache; a missing, invalid, or failed authoritative read cannot reuse a stale
open decision. Operator gate listings and metrics also refresh the complete
snapshot from Store; they fail unavailable instead of reporting a stale open.

`AutoLoop::run_with_recovery` loads lessons before every tool attempt.
Failures persist only the bounded tool name and a closed error kind; planners
derive closed, non-executable guidance that is deduplicated in Store. Only
`bad_args` and `failed` on tools that explicitly declare themselves retry-safe
may retry, with both a per-step retry cap and the original global `max_steps`
budget. Side-effecting tools are non-retryable by default, preventing duplicate
sends or deployments after an ambiguous failure. Every retry re-enters
`ToolRegistry::invoke`, so the same `ApprovalGate` is enforced each time;
`unknown` always stops immediately.

## 6. Quality pipeline

`cargo fmt` → `clippy -D warnings` → `cargo test --workspace` →
`npm run check` (governance) → `npm run control:test` (120) → CI
(`.github/workflows/ci.yml`) → PR review → merge → (gated) deploy via
distroless Docker images (`DEPLOY_RUST.md`).
