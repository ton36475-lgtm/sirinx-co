# UNIFIED BACKLOG — SIRINX Fusion (Mac × Windows reconciliation)

Date: 2026-10-10 (Mac time) · Merges: D:\SIRINX\...\UNIFIED_FUSION_RECONFIG_PLAN_20261013.md (Windows, 148 lines)
with ~/project-hermes/reports/SIRINX_MULTI_DOMAIN_FUSION_MASTER_PLAN_20261010.md (Mac)
Purpose: single shared backlog both nodes work from. Lives in sirinx-co repo → syncs by git when push unblocks.

## CORRECTION to Windows plan P0 (evidence from the Mac itself, 2026-10-10 13:09 +07)

- **Mac mini M2 was never offline.** Live at reconciliation time: uptime 2:45,
  launchd `ai.hermes.gateway` PID 1547 exit 0, services listening (a2a :9000, hub :8765,
  mlx :8080, bluezy :8100), tailnet Self Online, sirinx-co HEAD 7276381 with 94 uncommitted
  files preserved.
- The OFFLINE node is **aiagent (Windows, 100.67.78.88) — offline, last seen 29m ago** per
  `tailscale status`. The "Mac offline" reading came from Remote Desktop Commander, whose
  device agent runs ON aiagent; when aiagent drops, RDC reports every other node as
  unreachable. RDC outage ≠ Mac outage.
- Therefore real P0 = **restore aiagent Windows box** (wake/reboot/power plan/RDC agent),
  NOT "recover the Mac". No Mac recovery action is required.
- DWB on Mac side: broker pid 2954 + unix socket present, no mismatches (verified 2026-10-09,
  re-confirmed today). The `D:\` vs `D:\SIRINX` transport mismatch is Windows-side only.
- D:\ is NOT mounted on Mac (0 smbfs). Shared files must travel via git (sirinx-co) or
  Tailscale file share — not assumed visible on both nodes.

## Unified backlog (merged, owner-gated)

| # | Task (from either plan) | Owner node | Evidence gate | Approval needed |
|---|---|---|---|---|
| P0-W | aiagent Windows: bring online, verify RDC agent v0.2.51, fix DWB transport key `D:\`→`D:\SIRINX` | Windows | tailscale Online + DWB snapshot showing matching keys | owner on Windows |
| P0-M | GitHub email verify → push 3df1154+7276381 → first REAL green CI on GitHub | Mac | gh run logs | owner (email click) |
| P1 | Merge evidence: sirinx-co HEAD + 94-file dirty tree + skills + prior reports (DONE on Mac, this file) | Mac | this file | none |
| P1-W | Windows reads this backlog from repo after P0-W; confirms parity ledger of both plans | Windows | comment on commit | none |
| P2 | Task schema + policy gate + receipts + credential rules (both plans agree) | Mac draft | schema file | owner review |
| P3 | Telegram fusion dry-run: intake queue, dedupe, stop command, rollback — NO real sends | Mac | dry-run log | owner |
| P4 | Holatel (8 photos, 4 Oct 2026, Phitsanulok city) → holatelProjectMedia.ts pattern, skip people shots | Mac | check/test/build green | owner before commit |
| P5 | Village Tha Pho (7 photos, 16 Aug) → new project page after owner confirms village name | Mac | same | owner |
| P6 | pstack pack install + 1-prompt end-to-end test → report honest verdict | Mac | install receipt + test log | owner |
| P7 | Sub-domains IA + keyword maps (ai./cloud. × .co/.org) — design only until DNS exists | Mac | design docs | DNS by owner |
| P8 | thaimart official store plan (2-lang catalog) | Mac | plan file | seller account by owner |
| P9 | Provider catalog + deep-research workflow: capability/quality/latency/cost matrix, endpoint-scoped benchmarks only | Mac | benchmark receipts | per-provider spend |
| P10 | CI/CD + a11y + mobile checks + knowledge ingestion provenance/dedup/PII scan | Mac | pipeline runs | — |

## Standing constraints (unchanged, both plans)

- REPORTED ≠ VERIFIED; commits/pushes/DNS/real-sends = explicit per-item approval.
- API keys: OS keychain/secret manager only; never in chat, repo, or logs.
- sirin.org ≠ sirinx.org until ownership proven. No INET/thaimart claims until written permission.
- No automatic gateway restarts; config changes proposed as diffs first.
