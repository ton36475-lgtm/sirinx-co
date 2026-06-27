# KOB Opus/Fable and Codex 5.6 Plan

This plan keeps model names as profile aliases instead of hard-coded provider
IDs. The adapter discovers installed CLI support before executing anything.

Local KOB agent instruction file:

- Repo copy: `docs/a2async/KOB_AGENT.md`
- Local KOB copy: `~/.kob-cli/agent.md`

KOB CLI help currently exposes `config` for `~/.kob-cli/config.env` but does
not expose a dedicated `agent.md` command. Treat `~/.kob-cli/agent.md` as the
local instruction source for operator use and future KOB adapter discovery.

## Profile Aliases

| Alias                      | Intended role                                      | Notes                                                                                |
| -------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `KOB_PRIMARY_MODEL=opus-5` | architecture, synthesis, repo integration strategy | Resolve through KOB model discovery.                                                 |
| `KOB_FAST_MODEL=fable-5`   | fast routing, compression, daily summaries         | Resolve through KOB model discovery.                                                 |
| `CODEX_MODEL=codex-local`  | repo execution and implementation                  | Use the active Codex worker/session or local Codex CLI, not KOB-hosted Codex models. |
| `GLM52_MODEL=glm-5.2`      | long-context fallback                              | External API use remains gated by provider policy.                                   |

## Runtime Discovery Snapshot

Captured on 2026-06-27 from local KOB smoke tests:

| Purpose                 | Candidate                             | Status                                                     | Routing decision                                                                   |
| ----------------------- | ------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Current KOB planner     | `anthropic/claude-opus-4.8`           | available, returned `KOB_OPUS_READY`                       | Use as current confirmed planner model.                                            |
| KOB fast planner        | `anthropic/claude-fable-5`            | unavailable due insufficient KOB credits                   | Keep as candidate; fallback to Opus 4.8.                                           |
| KOB Codex candidate     | `openai/gpt-5.3-codex`                | available in KOB, but intentionally not used for this task | Do not route repo execution through KOB.                                           |
| Codex executor          | `codex-local` / current Codex session | active implementation worker                               | Use for repo edits, docs, scripts, and validation.                                 |
| Codex 5.6               | `codex-5.6`                           | not discovered as a concrete local executable model        | Keep as legacy profile alias only.                                                 |
| Manus artifact producer | `manus`                               | desktop artifact surface visible                           | Sync metadata and exported file hashes into A2A; Codex reviews before repo import. |

## Responsibility Split

KOB should produce:

- Architecture options.
- Context-compressed handoffs.
- Multi-repo integration order.
- Task slicing.
- Risk and blocker summaries.

Codex should produce, using the active local Codex worker/session rather than
KOB-hosted Codex models:

- Repo inspections.
- File edits.
- Patches and implementation artifacts.
- Test, lint, typecheck, and build evidence.
- Diff summaries and handoff notes.

## Execution Rule

KOB and Codex must not mutate the same repo lane at the same time. A2A tasks
hand off work from planner to executor, then collect executor artifacts before
the planner compresses the result into memory.

## Fallbacks

If KOB cannot authenticate or the requested model alias is unavailable, the
adapter writes a blocked artifact and leaves the task in `skipped/` or
`quarantined/` depending on policy. It must not guess credentials or print
secret-bearing config.
