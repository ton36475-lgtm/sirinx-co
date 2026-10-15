# ULTRADEEP BotTeam + BC AI Router + Tailscale Mesh + Clay 3D — Consolidated Plan (2026-10-05)

Status: `PLAN_ONLY / DRY_RUN` — no clone, no install, no deploy, no prod write, no backup access.
Workspace: `/Users/sirinx/SIRINXDev/sirinx-co` · Method: MillerDev + sirinx-master-plan SKILL · Truth Protocol on.

## 0. ทวนคำสั่ง (Restated order)
- ทำงานใน sirinx workspace, ultra-deep research ทุกคำ
- สร้าง BotTeam (47 Ronin + Hermes + Cline + JCode + FreeBuff + OpenCode)
- ลูกค้าไม่มี AI → จัด BC AI Router ใช้ AI ฟรีไปก่อน (bcairouter.bcaicloud.com)
- Tailscale: iPhone 12 / 12 Pro Max / S22 Ultra + ทุก nodes + ห้ามแตะ backup ส่วนตัว (iCloud/Google/OneDrive/chat logs)
- ใช้ sirinx.co + sirinx.org + Blender MCP + ldraw-nova (quarantine) + Clay 3D WebGL + Obsidian brain + automation + backend + Postman + Mermaid grid
- Solar AI auto load-balancing = อนาคตเท่านั้น ห้ามเคลม zero-day / ประหยัดไฟการันตี

## 1. Tailscale Mesh — verified (L1 mesh-surveyor)
Tailnet `tondhm.z99@gmail.com`, MagicDNS `tail73d7f2.ts.net`, self `macminisirinx 100.90.189.112` owner+admin.

| Node | IP | Role | Allowed | Blocked |
|---|---|---|---|---|
| macminisirinx | 100.90.189.112 | control-plane | verify, gates, cert | no auto-push/prod-write |
| vm-2-126-ubuntu | 100.72.202.12 | cloud-worker | ping/HTTPS/Taildrop opt-in | no SSH w/o ticket |
| s22-ultra | 100.80.141.60 | mobile-command + sole exit-offer | approve/stop only | never FS/shell/backup, never auto set exit-node |
| iphone-12 | 100.122.18.39 | approval-only | approve/stop | same mobile blocks (identify by DNS+IP, HostName=localhost) |
| iphone-12-pro-max | 100.78.80.55 | approval-only | approve/stop | same |
| aiagent | 100.67.78.88 | windows-worker OFFLINE 9h | queue only | no dispatch while offline |

Path: `Mobile (view/approve/stop) -> GitHub/Codex/Hermes (proposal+ticket) -> Mac mini (verify+gates) -> worker/edge`. Secrets never sync.
5 probes: tailscale ping x3, cert status (Mac only), netcheck+MagicDNS recheck, exit-node list/suggest only, Taildrop explicit cp + get (no daemon).

**Backup ruling:** iCloud / Google Cloud backup / OneDrive / chat-log / cache reads = DENIED. Mobile gets dashboard/Telegram/GitHub views only (ALL_DEVICE_TOPOLOGY).

## 2. BC AI Router free-first (L3 router-designer) — DESIGN_ONLY
Evidence: `GET bcairouter.bcaicloud.com -> 200 ~20KB Thai SPA (เกตเวย์ AI ส่วนตัว)`, `bcaicloud.com -> 404`, repo grep 0 hits. NO public API docs — DO NOT invent endpoints. P1 paid lane = NOT_CONFIGURED.
Order: L0 sirinx-local-deterministic (LIVE, estCost 0) -> F1 qwen3.6-local-ollama (not-observed) -> F2 cf-workers-ai-free (plan-only) -> F3 supabase-pg-retrieval (partial) -> P1 bc-paid RESERVED (blocked, needs provider_call OPEN + PROVIDER_CALL ticket + exact contract).
API: `POST /api/bc-route {prompt,consent,dryRun,Idempotency-Key} -> {lane,estCost:0,dryRun:true,providerCalled:false}`. HOLD default forces dryRun. OmniRoute `skill:bc-router-free`. 8 open questions for operator (ownership, new gate, Ollama inventory, Workers AI quota, DATABASE_URL, PDPA copy, Rust vs Node placement, maxCostTHB:0 default).

## 3. Clay 3D WebGL prototype (L4 clay-prototyper) — PLAN, no build (disk 4.4GiB < 15GiB floor)
Reuse: sirinx-web Axum :8080 + sirinx-store (Postgres canonical) + apps/public-web Three.js (SolarCarportViewer Clay MeshPhysicalMaterial, ProvinceSolarScene, sunMath, 77 provinces PVGIS) + sirinx.org knowledge cards read-only.
Backlog: B-WEBGL-01 route lazy/click-to-start -> 02 province parity 77 -> 03 ROI+lead reuse -> 04 consent analytics -> 05 knowledge-cards passthrough -> 06 Postman extension (collection e6b5fcae) -> 07 Mongo opt-in mirror (adaptive_sync HOLD, no dual-write). Mermaid grid: FRONTEND / BACKEND / BRAIN (proposal-only LWW+tombstones) / AUTOMATION (Ronin L1->L4, gates, pg_notify).
Solar auto load-balancing: CONCEPT ONLY, needs metered profiles + PE sign-off + gates + hazard sim. No autonomous switching claims.

## 4. ldraw-nova quarantine (L2) — VERDICT: FAIL / DO NOT IMPORT / DO NOT CLONE
AGPL-3.0 (+ CC-BY-SA-4.0 data) vs MIT-only intake = HARD BLOCK. 177MiB git + ~5GB Docker + sibling docker repo unreviewed + TYPESAFE_API_KEY paid surface. No Blender MCP server in repo (only .glb Custom Properties manual open). Disk 4.7GiB < 15GiB (20GiB Docker). Allowed: contract-first interface study only (plan.json schema, .glb props). Dry-run worktree plan recorded, DO NOT EXECUTE.

## 5. BotTeam spawned (this session, team-zu0di)
- mesh-surveyor (L1), router-designer (L3), clay-prototyper (L4+3D), quarantine-reviewer (L2) — all completed runs run_00001..00004.
- Hermes/Cline/JCode/FreeBuff/OpenCode lanes: registered as 15 unique A2A identities concept; live handshake needs fresh heartbeat + Bearer + ticket (per A17/INTEGRATION_MAP). No activation performed.

## 6. Next actions (human decides)
1. Free disk to >=15GiB (20GiB for Docker) + fresh df receipt (B10/B11).
2. Answer 8 BC questions; approve provider_call gate? (C5 order).
3. Approve B-WEBGL-01..07 sequencing in MASTER_PLAN B (same-commit update when work lands).
4. Keep ldraw-nova REJECT_IMPORT; Blender MCP stays plan-only candidate in mcp-connections registry (deny-all).
5. Mobile stays approval-node; no backup-access approval possible under PDPA/consent rules.

Full teammate outputs: retrieve via team runs run_00001..run_00004 (completed). No secrets touched. No push/deploy.
