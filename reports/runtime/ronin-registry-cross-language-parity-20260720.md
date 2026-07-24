# 47-Ronin Cross-Language Registry Evidence — 2026-07-20

Verdict: `LOCAL_PASS / PRODUCTION_HOLD`

Repository baseline HEAD: `1f05814c3e9d173e525234d69b3ce7f2d1b01a57`
Branch: `agent/b1-b2-command-center`
Evidence scope: dirty local worktree; no candidate commit or remote SHA exists
for this slice

## Implemented slice

- One canonical artifact lives at
  `crates/sirinx-agents/data/ronin-role-registry.v1.json`.
- Its SHA-256 is
  `861c80d968c67f21be13864cea22be67451f2f37bcd4104a01c467b79629ed10`.
- Rust embeds and validates that crate-contained artifact and exposes an
  immutable typed registry.
- The shared JavaScript loader validates the same artifact and drives runtime
  cards, enterprise cards, and the registry CLI validator.
- A closed semantic SHA-256 fingerprint plus exact-key checks rejects authority,
  principal, reporting, action-class, identifier, and unknown-field drift.
- Runtime and enterprise payloads are version `1.1`: 47 logical roles map to
  14 execution principals, Kai remains one separate non-execution liaison, and
  the compatibility surface remains 15 cards.
- Canonical card IDs replace position-derived enterprise IDs while
  `legacyCardId` preserves compatibility metadata.
- Source-write eligibility is restricted to roles 37–39 by the combined L4,
  Codex-principal, exact-boundary, and `B_EXACT_LEASE` predicates.
- A caller-provided writer string is recorded only as an unverified claim; it
  cannot set `sourceLeaseHeld` or `canWriteSource` before the P2 durable receipt
  validator exists.
- Legacy business aliases derive from stable IDs in `agent-team.mjs`; they are
  not a third numeric roster and never use its position-derived `number` field.
- All external-write, spawn, live-send, provider, queue, deploy, and migration
  capabilities remain disabled or held.
- All 47 numbered role cards plus Kai were reviewed against the canonical 22
  fields. Role 34 owns bounded A2A/Telegram authority, L4-42 is the independent
  checker, and L4-43 owns receipt/rollback handoff.
- Background contract v1.1 has stable role assignments, a three-worker limit,
  and zero enabled schedules.

## Local evidence

- Relevant Node registry/card suite: `36 passed` across four files.
- Node registry validator:
  `RONIN_REGISTRY_VALID roles=47 departments=16/9/10/8/4 cards=47 card_fields=22 background_contract=1.1 workers_max=3 external_actions=false schedules_enabled=0`.
- `cargo test -p sirinx-agents --locked --offline`: `78 passed`.
- Targeted `cargo clippy` with warnings denied: `PASS`.
- Workspace formatting check: `PASS`.
- `cargo package --list` includes
  `data/ronin-role-registry.v1.json` exactly once.
- The former `docs/agents/ronin/registry.json` path is absent; the canonical
  artifact is not a symlink.
- Free disk at final documentation is approximately `3.8 GiB`.
- An initial `pnpm exec` test attempt unexpectedly entered pnpm workspace
  dependency reconciliation and registry metadata checks. It was interrupted;
  output reported zero downloads/additions before interruption and the tracked
  lockfile did not change. The successful test run used the existing local
  Vitest binary directly; ignored `node_modules` state is not certified.

## Truth boundary

This evidence belongs to an uncommitted dirty worktree. It is not a clean
checkout, CI receipt, packaged-build receipt, migration receipt, browser-smoke
receipt, PR review, merge receipt, or deploy receipt. Low disk remains below
the 15 GiB admission threshold for installs, full builds, model downloads,
Docker, or disposable Postgres. No provider, Telegram, queue, Cloudflare,
Git-remote, database, merge, or deploy action occurred.

## Independent review

The initial review found two blocking fail-open paths and one duplicated legacy
roster: semantic registry drift could pass JavaScript validation, a caller
string could masquerade as a source lease, and runtime cards repeated 47 legacy
aliases. After correction, the reviewer reran differential negative probes and
29 focused tests and returned a clean verdict with no remaining blocking
findings.

The remaining non-blocking packaging constraint is explicit: a standalone
`dev-control-api` npm artifact would not contain the crate-owned JSON at its
monorepo-relative path. Any future standalone packaging must bundle the same
canonical artifact as package data without creating an independently maintained
authority copy.

## Remaining gates

1. Recover admitted disk capacity through a separately approved, recoverable
   cleanup workflow.
2. Execute the local migration 0005 candidate and first durable store slice on
   disposable Postgres from empty and prior migration states, then run race,
   tamper, failure-injection, non-owner RLS, and restore checks.
3. Create an exact candidate commit only after the user separately authorizes
   commit/push handling; then run clean-checkout CI and the external release
   chain under individual tickets.

Next safe action: restore admitted disk capacity, then verify the already-local
P2 candidate on disposable Postgres while keeping all external effects held.
