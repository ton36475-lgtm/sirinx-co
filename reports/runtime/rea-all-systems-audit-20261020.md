# REA across every SIRINX system — artifact audit + plan execution (2026-10-20)

Status: `STATIC_ARTIFACT_AUDIT / ZERO_TARGET_EXECUTION / PARTIAL_COVERAGE`
Tool: `rea 6.7.0` (`/Users/sirinx/.local/bin/rea`, 207 MCP tools / 153 commands, skill 42 after repair)
Method: MillerDev — inspect → plan → implement → verify → report, with Truth Protocol on.

This report answers one order: *"do everything possible from the plan, and use REA against all of
our systems."* Two things had to be separated honestly before any command ran:

1. **REA applies to shipped artifacts, not source trees.** The REA skill itself routes ordinary
   analysis of a complete source repository to normal repository tools. Running REA over our own
   Rust/Node source would produce a weaker, second-hand copy of what `README`/`Cargo.toml`/tests
   already state. So REA was pointed at the surfaces where the repository is *not* the truth: the
   built bundles that actually ship.
2. **"All systems" therefore splits into three verdicts**, each recorded with evidence rather than
   asserted: `REA_RUN`, `NO_ARTIFACT_TO_ANALYZE`, `EXTERNALLY_BLOCKED`.

## 1. System matrix

| # | System | What ships | REA verdict | Evidence |
| --- | --- | --- | --- | --- |
| 1 | `crates/sirinx-{core,roi,agents,autoloop,store,a2a,web,control}` | nothing on this host (`target/` absent, 0 compiled binaries) | `NO_ARTIFACT_TO_ANALYZE` | `ls target` empty; disk was 4.79 GiB free at audit start (< 15 GiB floor), so no build may be started to manufacture one |
| 2 | `apps/public-web` | `dist/` 37 MB, 532 files | **`REA_RUN`** | `reports/runtime/rea/public-web.receipt.json` |
| 3 | `sites/ghostclaw-hermes-v3-command-center` | `dist/` 2.7 MB (client + server + `.openai/hosting.json`) | **`REA_RUN`** | `reports/runtime/rea/command-center.receipt.json` |
| 4 | `apps/thaimart-seller-guard` | MV3 extension loaded unpacked (manifest + 3 JS + CSP) | **`REA_RUN`** | `reports/runtime/rea/thaimart-seller-guard.receipt.json` |
| 5 | `apps/dev-dashboard` | no `dist`/`build`/`.next` | `NO_ARTIFACT_TO_ANALYZE` | directory listing |
| 6 | `apps/mobile-command` | `README.md` only — no app artifact, no `package.json` | `NO_ARTIFACT_TO_ANALYZE` | directory listing |
| 7 | `services/{dev-control-api,hermes-api,telegram-command-bot}` | raw `.mjs` executed by `node` — the source *is* the shipped artifact | `SOURCE_IS_ARTIFACT` | `dev-control-api` has no `build`/`bundle`/`compile` script; `hermes-api` and `telegram-command-bot` carry no `package.json` at all and are launched by root scripts |
| 8 | `infra/cloudflare/brain-sync-worker` | `src/worker.js` + `wrangler.toml` + `schema.sql`; bundling happens at deploy time | `NO_ARTIFACT_TO_ANALYZE` | no `dist`/bundle in tree |
| 9 | `infra/lightvela`, `infra/omarchy` | shell bootstrap scripts only | `SOURCE_IS_ARTIFACT` | `bash -n`/`shellcheck` gates from A37 |
| 10 | Cline 3.0.73 archive (`…/SIRINX_AI_WORK_20261020/cline-bot`) | npm tree, not an Electron `.app`/`.asar` | `NO_ARTIFACT_TO_ANALYZE` | 267 MB `node_modules` + `verify-computer-use.mjs`; no bundle exists to decompile |
| 11 | Native/Android/iOS targets | no `.apk`/`.ipa`/`.app` in the repo | `NO_ARTIFACT_TO_ANALYZE` | artifact sweep found only two `libvips` dylibs inside `node_modules` |

Seven of eleven systems cannot be "REA'd" for a structural reason, not a permission reason. Saying
otherwise would be a claim without evidence.

## 2. What the shipped bundles actually contain

All numbers below are REA static observations of inert bytes. No page was loaded, no request was
sent, no bundle bootstrap code was executed.

| Metric | public-web | command-center | thaimart-seller-guard |
| --- | --- | --- | --- |
| Evidence id | `ev_eef7d638…112b` | `ev_1c8e91fe…016` | `ev_5d049085…17a` |
| Root artifact sha256 | `4dae8451…5a4d` | `870f9302…d1ac` | `ce4b761c…b316` |
| Files inventoried / parsed | 207 / 96 | 51 / 41 | 5 / 3 |
| AST nodes visited | 531,428 | 177,557 | 1,832 |
| Graph nodes / edges | 1,351 / 3,289 | 446 / 1,001 | 11 / 12 |
| Endpoint candidates | 49 network + 39 route | 21 network + 1 route | 1 network |
| Storage | 8 `localStorage` | 6 `sessionStorage` | none |
| Parse failures | 0 | 0 | 0 |
| Integrity contradictions | 0 | 0 | 0 |
| Coverage | `partial` (1 file heap-capped) | `partial` (5 files heap-capped) | `partial` (no heap cap; analyzer's standing bound) |

Command Center ships **exactly one route** (`route:/`): the deployed Sites app is a single
read-only briefing page, which matches the A15 "bilingual, read-only, owner-only" claim at the
artifact level.

## 3. Reconciliation findings (artifact vs source claim)

### 3.1 Command Center stack is no longer the "older stack"
A35 (2026-08-16) recorded that installed dependencies and `dist` remained the older stack. On this
host that is no longer true:

| Check | Result |
| --- | --- |
| `package-lock.json` pins | `next 16.3.1`, `react 19.2.8`, `react-dom 19.2.8`, `vinext 1.0.0-beta.6`, `vite 8.2.1` |
| Installed tree | `next 16.3.1`, `react 19.2.8`, `react-dom 19.2.8` (installed 2026-10-11) |
| `npm ls next react react-dom --depth=0` | clean, rc 0 (no `ELSPROBLEMS` at this depth) |
| `dist/server/BUILD_ID` mtime | 2026-10-20T12:16:07Z — built *after* the install |
| `dist/server/wrangler.json` | `compatibility_date: 2026-05-15`, `main: index.js`, **zero** D1/R2/KV/queue bindings |

So B14's first two steps (frozen lock install, dependency closure) are already satisfied on this
host. What B14 still lacks is not installation — it is a **reproducible build receipt**: I did not
rebuild (`npm run build`) because the workload disk floor is 4.79 GiB against a 15 GiB requirement,
so the provenance of the `dist` inputs remains unproven even though its contents are now measured.

### 3.2 public-web external surface (measured, not assumed)
Literal hosts inside the shipped client assets, by occurrence:

`www.sirinx.co 2858` · `schema.org 327` · `fonts.googleapis.com 324` · `d2xsxph8kpxj0f.cloudfront.net 147` ·
`fonts.gstatic.com 108` · `re.jrc.ec.europa.eu 77` (PVGIS, expected) · `images.unsplash.com 27` ·
`w3.org 25` · `line.me/github.com/react.dev 2 each` · `cdn.example.com 1`

Tracker sweep of shipped JS/HTML — `gtag`, `googletagmanager`, `facebook.net`, `plausible`,
`posthog`, `hotjar`, `clarity.ms`, `doubleclick`, `segment.io`: **0 files each**, and
`navigator.sendBeacon` appears in **0** files. The consent-safe analytics claim survives the
artifact check.

Three real items to fix (recorded as B16, not silently patched):

1. `https://cdn.example.com/image.jpg` is shipped as a form placeholder default — a placeholder
   string in a production bundle.
2. `d2xsxph8kpxj0f.cloudfront.net/310519663541525436/…` (147 refs) is a third-party CloudFront
   distribution carrying hero imagery, outside our Cloudflare account: if it is deleted or
   rate-limited, images break with no local fallback.
3. `fonts.googleapis.com` / `fonts.gstatic.com` (432 refs) mean every visitor's browser contacts
   Google for fonts — a PDPA/privacy-relevant third-party call that no document currently declares.

### 3.3 ThaiMart extension: "read-only" holds at the artifact level
`manifest.json` requests `activeTab`, `storage`, `tabs`; `host_permissions` are only
`seller.thaimart.com` + loopback `127.0.0.1:8790`/`localhost:8790`; `extension_pages` CSP pins
`connect-src` to those two loopback origins. Grep of the shipped files confirms exactly two
hosts (`seller.thaimart.com`, `127.0.0.1`) and no other egress. The description's "read-only"
claim is consistent with the artifact — with the standing caveat that `tabs` + `activeTab` still
allow URL/title observation, which the description does not spell out.

## 4. Plan steps executed in this session

| Plan item | Action | Result |
| --- | --- | --- |
| Mesh plan **P0** (truth refresh) | `tailscale status --json` | backend `Running`, 11 peers, **2 online** (`vm-2-126-ubuntu`, `sirinx-sandbox`), `aiagent` still offline since 2026-10-16T16:26:26Z; all paths DERP `sin`. Unchanged from A40 — no activation attempted. Closed with its own artifact: `reports/runtime/tailnet-mesh-truth-20261020.md` |
| **A38** lane drift repair | `rea setup --client {codex,hermes}` after `--dry-run` review | skill identity **34 → 42**; codex and hermes registrations re-pointed from `npx rea-agents@6.4.0`/stale to `~/.local/bin/rea mcp`; all four lanes (claude_code, codex, opencode, hermes) now `aligned` at 6.7.0; backups written (`config.toml.rea.backup*`, `config.yaml.rea.backup`) |
| **A38** native engines | — | Hopper / Ghidra / IDA / JADX / Kuna remain absent by design: `doctor.healthy=false` is expected for JS-only work, and installing Hopper is a paid action nobody approved |
| Everything else in B | — | blocked by the 15 GiB workload floor (4.79 GiB free at audit start, **3.41 GiB** at final read-back) or by human gates (C1–C7); no build, install, deploy, send, or push was performed |

## 5. Verification

| Check | Command | Result |
| --- | --- | --- |
| Script syntax | `node --check scripts/rea-artifact-audit.mjs` | rc 0 |
| Receipt repeatability | `node scripts/rea-artifact-audit.mjs --target=… --label=…` re-run | same Evidence id (`ev_5d049085…`), same subject digest and same statistics; `receiptSha256` changes only because `generatedAt` is part of the sealed receipt — the Evidence bundle is reused, not re-analysed |
| REA lane truth | `rea doctor --json` | skill 42 / expected 42, 4/4 lanes aligned, CLI 6.7.0 |
| Lock ↔ installed parity | `npm ls next react react-dom --depth=0` | rc 0, 16.3.1 / 19.2.8 |
| Bundle facts | `grep -rEo 'https?://…'` over shipped assets | counts as listed in §3.2 |
| Plan validators | `node scripts/verify-pr-mono-001.mjs`, `node scripts/verify-next-phase.mjs` | both rc 0 after the MASTER_PLAN edit |
| Check wiring | `node -p require('./package.json').scripts.check` | new script added to the `node --check` chain |
| `npm run check` (full) | — | **not run**: its final stage is `command-center:build`. A fresh Next build at 4.79 GiB free contradicts the 15 GiB workload floor that A22/B12 froze, and the build is not needed to validate a report + a syntax-checked script |
| `npm run control:test` | — | **not re-run**: no file under `services/` changed after its last green run (507/507) in this same session |

## 6. Limitations (must not be read as absences)

- Coverage is `partial` for all three bundles. For the two web bundles that is partly a real gap:
  1 file (public-web `vendor-react`) and 5 files (Command Center `server/index.js`,
  `server/ssr/index.js`, two framework chunks, one client framework chunk) exhausted the analysis
  heap and were *not* fully projected. The ThaiMart extension has **zero** heap-capped files yet
  still reports `partial`, which tells you `partial` is the analyzer's standing bound rather than a
  finding about that bundle. Either way, a file absent from the graph is a budget/coverage limit,
  not proof of nothing.
- Static only. Static endpoints/imports do not prove runtime behaviour; a bundle can fetch an URL
  constructed at runtime that no static pass can see. §3.2 is therefore a *lower bound* on
  external surface, not a complete egress list.
- Full Evidence bundles (100 MB / 218 MB) were **not** committed and were deleted after receipt
  extraction, because the host sits at 3.41 GiB free — below the 15 GiB workload floor — and 319 MB
  of ephemeral JSON is a real cost there. Nothing irreplaceable is lost: each receipt seals the
  `evidenceId`, root artifact and subject digests, every statistic, and the full limitation list,
  and `node scripts/rea-artifact-audit.mjs --target=<bundle> --label=<name>` regenerates the same
  analysis from the same artifact bytes on demand.
- `dist` mtime is not provenance. Nothing here proves which commit or which toolchain produced the
  bundles; that needs B14's reproducible build receipt.
- No Rust crate, Node service, worker, or mobile app was analysed by REA — for the reasons in §1,
  not because they were reviewed and found clean.
