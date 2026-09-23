# Portfolio media handoff — 24 September 2026

Task: `sirinx-portfolio-20260924`. User-supplied session correlation: `01a0ce5f-d16f-7ae0-8b4d-2e2df820bdcc`. This identifier links the workstreams; it is not evidence of direct session messaging or live synchronization.

Repository: `ton36475-lgtm/sirinx-co`. Isolated working branch: `feat/verified-portfolio-media-20260924`. Base: recovery PR #10, `fix/cloudflare-recovery-20260919`, commit `bbfa6ba553890d56058d2b754ae63d27359801fa`; inspected main was `76ae569416c136eb9097e78fcf8277746e9d6cb2`. Preserve the recovery branch and its deployment/Cloudflare work.

## Scope and source accounting

Real installation media is the priority; ThaiMart stays on hold. Preserve original pixels/geometry, equipment, faces and installation condition. Corrections are deterministic exposure/color/sharpening operations, not generated reconstruction.

| Intake | Count / handling |
| --- | --- |
| All source files | 66: 57 still images, 4 videos, 5 documents |
| Installation still sources | 45; 15 verified resized duplicates → 30 distinct corrected stills |
| Named public candidates | 27 stills: Royal Park 11, Holatel 10, residence 6 |
| Unassigned installation stills | 3; keep outside named/public galleries |
| Reference images | 12; exclude from real-installation portfolio |
| Video sources | 4 files → 3 unique videos; one exact duplicate |
| Named public video candidate | 1 residential drone video; its 15-second excerpt is a derivative, not another source |
| Unassigned unique videos | 2; keep non-public pending attribution |

Confirmed covers: Royal Park `1000076002`, Holatel `1000075878`, residence `1000075975`. Only Royal Park has user-confirmed Solis branding. Equipment model, capacity, savings and commissioning dates remain unknown. The residential scope is a home inside the named development, not the whole estate or a developer endorsement.

## Existing backend and import

Inspected `apps/public-web/server/db.ts` / `drizzle/schema.ts` use **MySQL via Drizzle/mysql2**. `server/storage.ts` uses the existing **Forge storage proxy**, not a Supabase/R2 adapter. Those files are identical at the inspected main and recovery commits. Do not provision another backend.

Environment variable **names only**: `DATABASE_URL`, `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`. Runtime access/credentials are not verified here. No live database/storage write, publication or deployment has been executed by the media importer.

`scripts/import-real-installations.ts` is create-only and defaults to dry-run. It validates exactly 27 JPGs, uploads through `storagePut` only with explicit `--apply`, creates drafts with `published:false`, stores returned IDs and pending operations in a durable receipt, and blocks existing-title collisions and receipt retries. Unknown numeric/date fields are omitted. Follow `scripts/IMPORT_REAL_INSTALLATIONS.md`; use `node --import tsx`, not the standalone CLI in this restricted runner.

The existing `galleryImages` column is a JSON-string array of image URLs. It has no video, caption, responsive-source or asset-ID schema. Videos remain sidecar metadata and static frontend assets; the importer uploads JPGs only. A CDN cover URL cannot by itself reconstruct the source asset ID/`coverId` or WebP variants: use the receipt's explicit asset-ID-to-URL mapping and do not manufacture CDN `srcset` URLs.

## Frontend/runtime connection

The recovery base hardcoded its portfolio and did not consume `project.list`. The companion frontend work adds the curated static catalog and explicit `VITE_PORTFOLIO_SOURCE=backend` mode. Enable backend mode only when the existing `/api/trpc` Node/Express runtime is reachable and the required rows have been reviewed/published. Draft import alone must not be treated as public publication. Static Cloudflare Pages hosting does not start this Express server.

The public `/admin` UI is intentionally disabled outside internal hosts/dev.sirinx.co, and the inspected App had no project-management admin route. Keep importer execution on the trusted backend host. Coordinate through this isolated branch/PR and receipts; do not claim direct control of another Codex session.

## Next operator steps

1. Review the branch diff, media provenance and final build/browser results supplied with the PR.
2. Run the local dry-run against the complete release bundle; retain its plan and hashes.
3. Verify the authorized backend environment without exposing values. Check existing project titles before selecting a single import operator.
4. Apply only the reviewed draft import with a new durable receipt; read back IDs and uploaded URLs. Reconcile any pending/ambiguous write manually; never force a retry by removing receipts.
5. Verify frontend backend-mode mapping, image URLs, covers and loading/error states; publish/deploy through the recovery workstream with actual receipts.

Validation at handoff: four importer tests and local real-media dry-run passed. Final project-wide checks, browser evidence, remote PR status and any future runtime actions must be added by the coordinating agent, without inferring them from these local results.

## Verified local gates

App TypeScript: pass. Vitest: 64 tests in 9 files pass. Importer targeted TypeScript: pass; 4 Node tests pass. All 100 public media files match the frozen release. Vite build, SEO generation (94 routes) and esbuild server bundle pass using `node --import tsx` for SEO. The nominal build command hits restricted-runner tsx IPC `EPERM` after Vite succeeds; no build-script change was needed.

Browser visual verification is **unmet**: no working local Chromium, official download returned an invalid empty archive, and the cloud browser cannot reach localhost. Keep this PR draft until a working browser verifies mobile/desktop layout, filters, lightbox and video. No production or backend action is inferred from local gates.
