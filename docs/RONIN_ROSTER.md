# 47 Ronin Roster — Identity, Chain of Command, Status

The honest version of "AI passports": every slot's id, layer, codename
(where one is actually assigned in code), model lane, and — critically
— whether it's **coded** (has a real `impl Agent`) or a **placeholder**
(reserved slot number only). Source of truth is code, not this doc: see
`crates/sirinx-agents/src/roster.rs` and `crates/sirinx-agents/src/ronin.rs`.
If this table and the code ever disagree, the code wins.

## Chain of command (enforced in code, not aspirational)

`Layer::next_operational()` (`crates/sirinx-agents/src/layer.rs`) is the
actual escalation rule:

```
Perception (L1) → Analysis (L2) → Decision (L3) → Coordination (L4) → (terminal)
Research (L5) and Chatbot (Kai) are advisory — they don't sit in this chain.
```

This is the same rule already written into the SIRINX platform CLAUDE.md
as a hard constraint: **"ห้ามข้ามชั้น agent — L1 → L2 → L3 → L4 เท่านั้น"**
(no skipping agent layers). No agent calls a layer above itself directly;
work flows up one layer at a time. That *is* the chain-of-command /
discipline system — there's no separate "military" framework to bolt on,
because the rule already exists and is enforced by the type system
(`Layer::next_operational()` returns `None` past Coordination, so there's
no code path to escalate further even if something tried).

## Roster table

| Slot | Layer | Codename | Status | Token budget | Model lane |
| --- | --- | --- | --- | --- | --- |
| 0 (Kai) | Chatbot | Kai | placeholder — codename only, no `impl Agent` yet | 16K | sonnet5 |
| 1 | Perception | Kuranosuke | **coded** — lead intake, `ronin.rs:40-59` | 4K | sonnet5 |
| 2–15 | Perception | *(unassigned)* | placeholder | 4K | sonnet5 (default) |
| 16 | Perception | Kin'emon | placeholder — codename reserved, no `impl Agent` (candidate for B4's scoped starter) | 4K | sonnet5 |
| 17 | Analysis | Jūnai | **coded** — ROI-threshold scoring, `ronin.rs:87-110` | 8K | sonnet5 |
| 18–24 | Analysis | *(unassigned)* | placeholder | 8K | sonnet5 (default) |
| 25 | Analysis | Jūrōzaemon | placeholder — codename reserved only | 8K | sonnet5 |
| 26 | Decision | Kihei | **coded** — decision/proposal logic, `ronin.rs:122-146` | 16K | sonnet5, escalate to opus-4-8 for hard cases |
| 27–35 | Decision | *(unassigned)* | placeholder | 16K | sonnet5 (default) |
| 36 | Coordination | Gengo | **coded** — orchestrator, auto-enqueues follow-up work, `ronin.rs:149-251` | 32K | opus-4-8 (complex orchestration) |
| 37–42 | Coordination | *(unassigned)* | placeholder | 32K | opus-4-8 (default for this layer) |
| 43 | Coordination | Yasoemon | placeholder — codename reserved only | 32K | opus-4-8 |
| 44 | Research | Mimura | placeholder — codename reserved (AI trend scanning, advisory) | 128K | sonnet5 |
| 45 | Research | Yokogawa | placeholder — codename reserved | 128K | sonnet5 |
| 46 | Research | Kayano | placeholder — codename reserved (benchmark research) | 128K | sonnet5 |
| 47 | Research | Terasaka | placeholder — codename reserved | 128K | sonnet5 |

**Reality check:** 4 of 48 slots (Kuranosuke/Junai/Kihei/Gengo) have real
code. 8 more have a reserved codename but no implementation. 36 are bare
numbers with no name and no code. Anyone reading this table gets the
true picture; nobody should read "47 Ronin" as "47 running agents."

## Coordination protocol for external workers (Codex, Hermes, OpenCode, etc.)

There is no "swarm spawn" mechanism that reaches into another tool's own
process from this repo — that has to run *inside* that tool. What does
exist, and is real:

1. `CODEX_HANDOFF.md` — onboarding doc any worker reads first.
2. `scripts/a2a-handshake.sh <agent-id> <name> <capabilities>` — registers
   that worker's `AgentCard` on `sirinx-control`'s OmniRoute (durable
   since B15), pulls the shared queue, shows unclaimed work.
3. `MASTER_PLAN.md` — the one plan every worker (human or agent) reads
   before claiming anything.

A worker running inside Claude Cowork, Codex CLI, Hermes, or OpenCode
follows the same three steps from wherever it actually runs. This repo
cannot push code into those tools' runtimes; each tool has to pull.

## Recurring planning cadence

Not built yet — needs an operator decision on cadence (daily/weekly,
and at what time) before a recurring job is created. See the model's
reply for the open question.
