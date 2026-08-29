# Resource Cleanup — Per-Target Packet (HOLD-only)

Status: `PACKET_ONLY / NO_DELETION_PERFORMED / SIZES_OPERATOR_MEASURED / AWAITING_ONE_USE_GRANT`
Date: 2026-07-22 (Asia/Bangkok) · Prepared by: Claude Cowork (read-only; no deletion, no `du`/shell run — sandbox disk-down)
Frame: A22–A33 resource-recovery contracts. Reclaim regenerable build artifacts only; execution is a separate human one-use grant.

## Emergency context
Operator-reported free space: **5,380,968 KiB ≈ 5.13 GiB**, floor **16 GiB** → ~11 GiB under, trend falling (14.4 → 9.9 → 5.13 this session). `sirinx-co/target/` was re-observed populated with fresh Cargo incremental builds, so active rebuilds are consuming disk now. Disk-full risk to PostgreSQL container + SQLite app DB is real; reclaim is the top action.

## Hard exclusions — OUT OF SCOPE, never a target (per operator directive)
1. **Repositories / source** — any tracked source tree (`sirinx-co`, `sirinx-agent-native-os`, `sirinx-obsstack-*`, and the *source* of vendored intake repos). Only their regenerable build outputs are eligible.
2. **AI runtimes / models** — Ollama/vLLM/llama model files, GGUF/safetensors, inference binaries, model caches.
3. **Agent manifests** — `.claude/`, agent cards, `*.plan-only.*.json`, connection registries, skill dirs.
4. **Active Docker volumes** — named volumes and the PostgreSQL data volume. (Dangling *images* and *build cache* are separate — see T7, operator-confirmed only.)
5. **User data** — SQLite app DB, Postgres data, `~/Downloads`, documents, keychains, `.env`/secret stores.

## Target manifest — regenerable build artifacts only

Sizes are **operator-measured** (I cannot run `du`; APFS clones mean on-disk ≠ logical — no reclaim is guaranteed until measured). Run the verify column before granting.

| # | Target path | Type | Regenerable by | Verify size | Risk |
|---|---|---|---|---|---|
| T1 | `~/SIRINXDev/sirinx-co/target/` | Cargo build (verified present, `.rustc_info.json`) | `cargo build` | `du -sh ~/SIRINXDev/sirinx-co/target` | none — gitignored artifact; forces one rebuild |
| T2 | `~/SIRINXDev/sirinx-agent-native-os/tools/repo-intake/2026-06-06/github-trending-first-page/chopratejas__headroom/target/` | vendored Cargo build (verified present) | `cargo build` in that dir if ever needed | `du -sh <path>` | none — June audit snapshot, not active |
| T3 | `~/SIRINXDev/sirinx-agent-native-os/tools/repo-intake/2026-06-06/.../node-headroom-compression/node_modules/` | vendored npm deps (verified present) | `npm install` | `du -sh <path>` | none — vendored snapshot |
| T4 | other `node_modules/` under `*/tools/repo-intake/**` and `*/tools/github-trending-lab/**` | vendored npm deps | `pnpm/npm install` | `find ~/SIRINXDev/*/tools -type d -name node_modules -prune -exec du -sh {} +` | none — snapshots only; **do not** touch the active `sirinx-co/node_modules` |
| T5 | `~/Library/Developer/Xcode/DerivedData/` (if present) | Xcode build cache | Xcode rebuild | `du -sh ~/Library/Developer/Xcode/DerivedData` | none — pure cache |
| T6 | `~/Library/Caches/` dev caches: `pnpm`, `Homebrew`, `ms-playwright`, `deno`, `go-build` (individually) | package/tool caches | re-download on demand | `du -sh ~/Library/Caches/<name>` | low — re-fetch cost only; keep pnpm store only if offline installs needed |
| T7 | Docker **dangling images + build cache** (NOT volumes) | reclaimable layers | rebuild image | `docker system df` then `docker image prune` / `docker builder prune` (operator) | medium — confirm no active image depends; **never** `-a --volumes` |

**Explicitly NOT targets:** `sirinx-co/node_modules` (active dep tree), any `data/`/`*.sqlite`/`pg` volume, any model dir, `.claude/`.

## Reclaim arithmetic
Unknown until T1–T7 are measured. Do not assume a total. A32 already proved no single in-repo candidate reaches the floor alone, so expect to run **several** targets. T1 (sirinx-co/target) is almost certainly the largest single win and the safest — start there.

## Execution protocol (one-use grant, human)
1. Measure T1–T7 with the verify commands; record actual free space `df -h /`.
2. Issue ONE one-use grant bound to ONE target (start T1). No blanket grant, no `KEEP=1` override.
3. Operator runs the single reclaim (e.g. `cargo clean` for T1, or `rm -rf <exact path>`), then **re-measure** `df -h /`.
4. If still under 16 GiB floor, issue the next single-target grant (T2 → T4 → T5 → T6 → T7). Stop-and-remeasure after each.
5. Log each: target, pre/post free space, command. This packet is the plan; the grant + command are the human's act.

## Truth boundary
No file was deleted, moved to Trash, pruned, or measured by me this round. No provider call, send, migration, push, or Docker mutation occurred. Sizes and the "present" flags for T5–T7 are operator-verifiable; T1–T3 presence is confirmed by file-tool glob, sizes are not. Registration leases, the expired lane lease, and the live-sync gate review (`a2a-live-sync-gate-review-20260721.md`) are separate items — cleanup does not touch them.
