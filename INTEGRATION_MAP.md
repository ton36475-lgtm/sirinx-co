# SIRINX Integration Map — Every Real System, One Mesh

Built from an L1 Perception scan of actual files on disk/GitHub
(2026-07-18). Each row is a real system with its verified location and
its connection point into the mesh.

## Connection backbone (implemented, partial, and externally unverified)

| Layer | Mechanism | Evidence status |
| --- | --- | --- |
| Work queue | `web_pending_work` + `sirinx-control /api/a2a/sync`; `pg_notify` is emitted by storage migrations | Server-side schema/endpoints implemented; peer polling client and NOTIFY listener remain B5 |
| Capability routing | OmniRoute (`/api/a2a/route`) — capabilities discovered from 50 skill directories | Implemented and locally tested; cross-node live smoke **UNVERIFIED** |
| Knowledge | D1 schema + `brain-sync-worker` source (`/api/brain/sync\|search\|notes`) | Source present; current live D1/deployment state **UNVERIFIED** |
| API contract | Versioned local Postman v2.1 dry-run collection in `postman/`; legacy external workspace `549f0d6b…` / collection `e6b5fcae…` | Local artifact statically validated and loopback-only by default; full runtime run and external workspace accessibility **UNVERIFIED** |

## System inventory → connection points

### 1. Obsidian Brain (hermes-os — verified files)

| Real asset | Path | Connects via |
| --- | --- | --- |
| Federation config: 7 vaults, proposal-only writes | `hermes-os/config/obsidian_brain_federation.json` | vault list = sync sources for brain-sync-worker |
| Chroma sync (vault → vector index + JSONL fallback) | `hermes-os/{rag,sync}/obsidian_chroma_sync.py` | keeps running locally; edge copy adds FTS5 + cross-node access |
| Knowledge API (`/knowledge/status\|query\|all`) | `hermes-os/knowledge_api.py` | can proxy misses to `/api/brain/search` |
| Brain roots + note walker (5 roots incl. `/Users/sirinx/Documents/Obsidian Vault/SIRINX`) | `sirinx-co/services/dev-control-api/src/brain.mjs` | note shape mapped 1:1 → `brain_notes` (`meta` carries summary/headings/links/tasks/obsidianUrl) |
| Transfer packets + tag proposals | `hermes-os/outputs/obsidian-brain-federation/2026-06-13/` | packet fields fit `brain_notes.tags` + `meta` |

Sync loop for the Mac node: read vault → build note records
(brain.mjs shape) → `POST /api/brain/sync` with `since` = last run →
apply returned `changed[]` locally. Last-write-wins; deletions are
tombstones. Federation rule preserved: **proposal-only, no source
overwrite** — the edge DB is a replica+index, never the authority.

### 2. GhostClaw OS (media production)

Reality check from the scan: `ghost-claw-os` is 17 design docs + an
Expo app template — server routers are TODO stubs, DB has only a
`users` table. So the integration is contract-first, not code-lift:

| Real asset | Path | Connects via |
| --- | --- | --- |
| Product/system design (11 modules, queue-worker) | `ghost-claw-os/ghost-claw-docs/` | implement later as `sirinx-ghostclaw` crate; job intake = `web_pending_work` (`source: "ghostclaw"`) |
| Asset Memory design (Drive "Sirinx" + Sheet "SIRINX_Media_Asset_DB") | `ghost-claw-docs/11-ASSET-MEMORY-LOGIC.md` | asset records later join `brain_notes` (`source: "ghostclaw-asset"`) |
| Mobile app template + Gemma4 client (`localhost:8000`) | `ghost-claw-os/{app,lib/gemma4-client.ts}` | mobile talks to `sirinx-web` API like other apps |
| ⚠ Android keystore committed in repo | `ghost-claw-os` (eas build assets) | **security follow-up: rotate + purge before that repo is imported** |

### 3. Hermes A2A (Python, port 9000)

`hermes-os` A2A team coordinator (`a2a_team_coordinator.py`, Antigravity2
card, CeoControl at `127.0.0.1:9000`) speaks the same card concept —
bridge = its card registered into OmniRoute via `POST /api/a2a/sync`.

### 4. Already-connected systems (recap)

Supabase SIRINX schema (3 web tables, RLS) ↔ sirinx-web/control · Hermes
dashboard 8710 → control API 8711 (Node long-tail + Rust core) ·
47-slot Ronin plan/schema/role roster, currently backed by 6 agent files
and 4 coded Rust lead agents · 50 skill directories (`.claude/skills/`)
→ OmniRoute capability discovery · mux launcher (`scripts/agents-mux.sh`).

## Gaps intentionally left gated

- brain-sync-worker and its D1 schema source are **written**; a schema
  header records an apply date, but current live D1 state is
  **UNVERIFIED**. `wrangler deploy` waits for the `deploy` gate +
  `BRAIN_SYNC_TOKEN`.
- GhostClaw implementation waits for its quarantine review
  (`REPO_AUDIT_AND_MERGE_MAP.md` risk process) + keystore rotation.
- ChromaDB embeddings stay local-only (no provider calls) per
  `obsidian_brain_federation.json` `provider_call: false`.
