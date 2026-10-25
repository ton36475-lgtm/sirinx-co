# Hermes agent update — 0.21.6 → 0.22.5 (2026-10-23)

Status: `UPDATED / NODE_DEPS_REPAIRED_LOCAL / ZERO_REPO_CHANGE / ZERO_CLOUD_MUTATION`

Follows `hermes-a2a-repair-20261022.md` (A47). Every number below was measured
on this host in this session.

## 1. The update that ran

The `solis` dashboard (pid 4874, spawned by the dashboard at pid 1593) started
`hermes update` itself at **14:31:09Z** (`2026-10-23T14:31:09.387696+00:00`),
desktop mode, `assume_yes=false`. It was already in flight when this session
started, so it was monitored rather than restarted.

| | |
| --- | --- |
| before | `0.21.6+199.g1744a19`, HEAD `1744a19e0df568c647e4f3ff9c37f2a284a282fb` |
| after | `0.22.5+197.gcb757fa`, HEAD `cb757fac59c92b49e9b8f2910e5cd7ab75efffdd` |
| receipt | `~/.hermes/logs/update_receipts/latest.json` → `outcome: success`, finished `14:41:47Z` (10 m 38 s) |
| skip | `pre_update_backup` — `updates.pre_update_backup` is `off` |

Profile/config work in the same run: 15 profiles migrated `v50 → v52`
(`agent8c`, `backend`, `data`, `design`, `devops`, `frontend`, `growth`,
`maxplus-kimi3`, `planner`, `qa`, `sales`, `scribe`, `shogun`,
`sirinx-research`, `sirinx-sec`), `webmcp` `↑13 updated`, `solis` already up to
date. Three profiles emitted
`platform 'cli' references unknown toolset 'messaging' / 'moa' / 'rl'` — a
config warning, not an update failure, and not repaired here.

## 2. What the update did not finish

`outcome: success` covers the source half only. The node-dependency follow-up
**failed** (`~/.hermes/logs/update.log` lines 14492–14760, 14727–14872):

```
node-deps: installing workspace dependencies with npm ci (apps/desktop, ui-tui, web)...
  core.hooksPath is set globally to '/Users/sirinx/.codex/git-hooks'
  Custom hooks paths are not supported by default.
```

`npm ci` → root `prepare` → `lefthook install` refuses this host's **global**
`core.hooksPath`, which is exactly C17. The workspaces were left partially
installed (`apps/desktop` 6 entries, `ui-tui` 2, `web` 4).

## 3. Repair — same step, workaround applied to the child only

```
cd ~/.hermes/hermes-agent
GIT_CONFIG_GLOBAL=/dev/null node scripts/build/node-deps.mjs \
  --source ~/.hermes/hermes-agent --reuse \
  --workspace apps/desktop --workspace ui-tui --workspace web
```

The update's own three workspaces, nothing wider. `GIT_CONFIG_GLOBAL=/dev/null`
hides the host-global git config from the `npm` child only — the global config
itself was **not** edited, and no `lefthook --reset-hooks-path` was run.

| Step | Result |
| --- | --- |
| `npm ci` | `added 1278 packages in 19s` |
| `prepare` → `lefthook install` | **succeeded** — `sync hooks: ✔️(pre-commit)` (the step that failed 6+ times before) |
| electron runtime | `electron 44.9.3` prepared, `node_modules/electron/dist/Electron.app` present |
| root `node_modules` | 754 entries |
| exit code | 0 |

This is the second confirmation that C17's cause is the global hooks path and
that the env override is a working, non-destructive remedy.

Residual: `npm ls --depth=0` reports `ELSPROBLEMS` for two workspaces the
update never targets — `@hermes/bootstrap-installer` and `@hermes/root-tests`.
They are outside the `ui` set, so their absence is expected for a partial
install and no attempt was made to widen the install past what upstream runs.

## 4. Post-update verification

| Probe | Result |
| --- | --- |
| `hermes --version` | `Hermes Agent v0.22.5+197.gcb757fa (2026.9.24) · stable · local cb757fac59c9`, `Up to date` |
| `hermes status` | gateway **✓ running** (default-profile multiplexer); the pre-update `source update could not be finished` and `install out of sync (venv …)` warnings are gone |
| `hermes pm doctor` | ✓ node 26.12.1 · ✓ npm 12.0.2 · ✓ python 3.14.9 · ✓ uv 0.13.5 · ✓ ripgrep · ✓ ffmpeg · ✓ cua-driver 0.21.0 — the **C16** `node`/`python` store-digest failures no longer appear |
| `GET https://gateway.sirinx.co/health` | 200 `{"status":"ok","platform":"hermes-agent","version":"0.22.5"}` |
| `GET http://127.0.0.1:9000/.well-known/agent-card.json` | 200 |
| `POST http://127.0.0.1:9000/` JSON-RPC, no token | **401** |
| `GET https://a2a.sirinx.co/.well-known/agent-card.json` | 200 |
| listeners | `127.0.0.1:9000` (A2A), `:8642` (gateway), `:9119` (dashboard), `:20128` (9router), `100.90.189.112:9005`, `:9006` |
| disk | 18,944,872 KiB free (≈18.1 GiB) at the end of the pass — above the 15 GiB floor, unlike A47's 12,847,120 KiB |

## 5. Still open

| # | Item | Owner |
| --- | --- | --- |
| 1 | dashboard pid 1593 (profile `solis`) still runs pre-update code; `hermes status` keeps asking its owner to relaunch `hermes serve` / `hermes dashboard` | operator — not restarted here, a restart kills an attached session |
| 2 | C17 is confirmed, not fixed: every future `hermes update` will hit the same `npm ci`/`lefthook` wall | operator decision (codex hooks vs. wrapper env) |
| 3 | `messaging` / `moa` / `rl` unknown-toolset warnings on 3 profiles | separate config pass |

## 6. Repo-side npm check (same request)

`npm outdated` at the repo root returns `{}` — the three devDependencies
(`ajv` 8.20.0, `ajv-formats` 3.0.1, `vitest` ^5.0.5) are current, so no root
install/update was run. `sites/ghostclaw-hermes-v3-command-center` does report
18 packages with newer `Latest` versions (`next` 16.4.3, `react` 19.3.1,
`typescript` 7.0.2, `wrangler` 4.152.0, …), but those are A35's **exact** pins
— moving them is B14 (clean worktree, frozen-lock install, fresh build, all
source/render contracts), not an `npm update`.

## 7. What this pass did not do

No repo source change, no commit, no push, no PR. No Cloudflare, DNS, tunnel,
Access, Worker, or Pages mutation; no deploy. No provider/model call, no A2A
task enqueued. No secret read or printed. The host-global git config and
`~/.codex/git-hooks` were left untouched; no package was installed outside
`~/.hermes/hermes-agent`. The dashboard process was not restarted.
