# SIRINX Integration Map — Every Real System, One Mesh

Built from an L1 Perception scan of actual files on disk/GitHub
(2026-07-18). Each row is a real system with its verified location and
its connection point into the mesh.

## Connection backbone (already live)

| Layer | Mechanism |
| --- | --- |
| Work queue | Supabase `web_pending_work` + pg_notify → `sirinx-control /api/a2a/sync` |
| Capability routing | OmniRoute (`/api/a2a/route`) — capabilities auto-loaded from 50 skills |
| Knowledge | D1 `sirinx-unified-db` (APAC/SIN) → `brain-sync-worker` (`/api/brain/sync|search|notes`) |
| API contract | Postman collection **"SIRINX Platform API"** (workspace `549f0d6b…`, collection `e6b5fcae…`) |

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

Supabase SIRINX (3 web tables, RLS) ↔ sirinx-web/control · Hermes
dashboard 8710 → control API 8711 (Node long-tail + Rust core) ·
6 Ronin lead sub-agents + 47-role roster (`.claude/agents/`) · 50 skills (`.claude/skills/`)
→ OmniRoute capabilities · mux launcher (`scripts/agents-mux.sh`).

## Gaps intentionally left gated

- brain-sync-worker is **written and D1 schema is live**, but
  `wrangler deploy` waits for the `deploy` gate + `BRAIN_SYNC_TOKEN`.
- GhostClaw implementation waits for its quarantine review
  (`REPO_AUDIT_AND_MERGE_MAP.md` risk process) + keystore rotation.
- ChromaDB embeddings stay local-only (no provider calls) per
  `obsidian_brain_federation.json` `provider_call: false`.
