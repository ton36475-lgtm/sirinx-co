# C17 closed — npm lifecycle shell for the host-global `core.hooksPath` (2026-10-23)

Status: `APPLIED_LOCAL / REVERSIBLE / ZERO_CHECKOUT_EDIT / ZERO_GLOBAL_GIT_EDIT`

Follows A47 (first workaround), A49 (the recurrence that proved the workaround
was still manual). Every probe below was run on this host in this session.

## 1. Root cause, narrowed

`~/.gitconfig` sets a host-global hooks path (`core.hooksPath =
/Users/sirinx/.codex/git-hooks`). Hermes' root `prepare` script runs
`lefthook install`; lefthook refuses *any* explicit `core.hooksPath`, exits 1,
and `npm ci` inside `hermes update` dies with it.

Measured behaviour of every candidate repair, hermes checkout, lefthook 2.1.14:

| Probe | Result |
| --- | --- |
| `lefthook install`, no override | rc 1, target `/Users/sirinx/.codex/git-hooks` |
| `git config --local core.hooksPath .git/hooks` then install | rc 1 — still "custom", even at the default path |
| `GIT_CONFIG_COUNT=1 … core.hooksPath=` (empty) | rc 1 — git: `The empty string is not a valid path` |
| `GIT_CONFIG_COUNT=1 … core.hooksPath=$PWD/.git/hooks` | rc 1 |
| `GIT_CONFIG_GLOBAL=/dev/null` | rc 0, `sync hooks: pre-commit` — works, but hides identity and credential helpers |
| forced `npm ci` on 0.22.5 with no override | **rc 0** — the new `prepare` swallows lefthook's status, so the step no longer fails; the hooks are just never installed |

So the failure that killed A49's update was the 0.21.6 `prepare` propagating the
status. On 0.22.5 the same wall degrades silently instead of failing.

## 2. What was applied

All three artifacts sit outside `~/.hermes/hermes-agent`, so `hermes update`
cannot overwrite them. Installer:
`infra/macmini/c17-npm-hooks-shell/install.sh` (`--dry-run` default).

| Artifact | Content |
| --- | --- |
| `~/.hermes/gitconfig-nohooks` (14 lines, mode 600) | copy of `~/.gitconfig` minus `core.hooksPath`; key-set diff against the real file is exactly `core.hookspath` |
| `~/.hermes/bin/npm-script-shell` (755) | exports `GIT_CONFIG_GLOBAL` to that shim, then `exec /bin/sh "$@"` |
| `~/.npmrc` | one appended line `script-shell=/Users/sirinx/.hermes/bin/npm-script-shell`; original backed up to `~/.npmrc.bak-20261023-220335` |

`script-shell` is used **only** for npm lifecycle scripts, so interactive git,
agent git and the codex hooks path are untouched.

## 3. Proof

```
$ npm config get script-shell
/Users/sirinx/.hermes/bin/npm-script-shell

$ cd ~/.hermes/hermes-agent
$ rm -f .git/hooks/pre-commit
$ env -u GIT_CONFIG_GLOBAL node scripts/build/node-deps.mjs \
    --source "$PWD" --workspace apps/desktop --workspace ui-tui --workspace web
sync hooks: ✔️(pre-commit)
added 1278 packages in 20s
rc=0
pre-commit now: installed
```

* No `Custom hooks paths are not supported by default` block.
* No `GIT_CONFIG_GLOBAL` in the calling shell — the fix carries itself.
* `grep hooksPath ~/.gitconfig` → line 11 unchanged.
* `git status --porcelain` in the hermes checkout → empty (nothing dirty).
* `~/.hermes/gitconfig-nohooks` still yields `user.email = tony@example.com`,
  `user.name = Tony`.
* Wrapper sanity: `sh -n` and `shellcheck -S warning` rc 0; inside an npm script
  `process.env.GIT_CONFIG_GLOBAL` is the shim path; repo script
  `npm run verify:mono-001` still passes.

## 4. Rollback

```sh
rm -f ~/.hermes/gitconfig-nohooks ~/.hermes/bin/npm-script-shell
# drop the script-shell line, or restore ~/.npmrc.bak-20261023-220335
```

Nothing in `~/.hermes/hermes-agent` or `~/.codex/git-hooks` was modified.

## 5. Residual risk (documented, not hidden)

| # | Risk | Mitigation |
| --- | --- | --- |
| 1 | The shim is a copy: editing `~/.gitconfig` (identity, credentials, aliases) does not reach npm lifecycle scripts until it is regenerated | re-run `install.sh --apply`; the script prints that instruction |
| 2 | A lifecycle script that expects the codex hooks path during `npm ci` now sees `.git/hooks` | none present in this repo or in hermes; rollback above |
| 3 | The fix is host-local; a fresh macOS host re-hits the wall | the installer + README are committed under `infra/macmini/c17-npm-hooks-shell/` |

## 6. What this pass did not do

No edit to `~/.gitconfig`, `~/.codex/git-hooks`, or any file inside
`~/.hermes/hermes-agent`. No repo source change beyond
`infra/macmini/c17-npm-hooks-shell/` and the plan/report. No commit, push,
deploy, cloud mutation, provider call, or send.
