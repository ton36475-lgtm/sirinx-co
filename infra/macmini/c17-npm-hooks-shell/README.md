# C17 — npm lifecycle shell for a host-global `core.hooksPath`

Status: applied on mac-mini-m2 (2026-10-23) · reversible · no secret, no repo edit

## The failure

This host sets a **global** git hooks path in `~/.gitconfig`:

```
[core]
    hooksPath = /Users/sirinx/.codex/git-hooks
```

Hermes' root `package.json` runs `lefthook install` from its `prepare` script,
and lefthook refuses any `core.hooksPath` that is not the repository default —
it prints `Custom hooks paths are not supported by default` and exits 1.

Inside `hermes update` the node-dependency step is `npm ci`, so:

- on **0.21.6** the `prepare` script propagated that exit status and `npm ci`
  aborted → the whole node-dependency step failed (A47 hit this six times);
- on **0.22.5** the `prepare` script swallows the status, so `npm ci` succeeds
  but the hooks are silently never installed (A49).

Either way the cause is the same, and editing the hermes checkout is not a fix:
`hermes update` pulls over it.

## Why the obvious repairs are wrong

| Candidate | Why not |
| --- | --- |
| `git config --global --unset core.hooksPath` | destroys the codex hooks for every repository on the host |
| `git config --local core.hooksPath .git/hooks` | lefthook still refuses: any *explicitly set* value counts as custom, even the default path (measured) |
| `GIT_CONFIG_COUNT=… core.hooksPath=` (empty) | git rejects it: `The empty string is not a valid path` (measured) |
| `lefthook install --force` | writes hermes hooks into the shared codex hooks directory and overwrites existing `.old` files |
| `GIT_CONFIG_GLOBAL=/dev/null` everywhere | hides `user.name`/`user.email`, aliases and credential helpers from every git child |
| patching `package.json` / `node-deps.mjs` | lives in the checkout; the next `hermes update` removes it |

## The fix

Two small artifacts outside the checkout, plus one npm config line:

1. **`~/.hermes/gitconfig-nohooks`** — a copy of `~/.gitconfig` with only
   `core.hooksPath` removed. Verified to differ from the real file by exactly
   that one key, so identity, aliases, credential helpers and everything else
   still apply.
2. **`~/.hermes/bin/npm-script-shell`** — npm's `script-shell`. It exports
   `GIT_CONFIG_GLOBAL` to that shim and `exec`s `/bin/sh`.
3. **`script-shell=`** in `~/.npmrc` — npm runs *lifecycle scripts* through it,
   so the override reaches `npm ci` → `prepare` → `lefthook install` and nothing
   else. Normal interactive `git` still sees the codex hooks path.

Because all three live outside `~/.hermes/hermes-agent`, `hermes update` cannot
overwrite them, and because `script-shell` is only used for npm scripts, the
host's global git behaviour for humans and agents is unchanged.

## Apply / re-apply

```sh
sh infra/macmini/c17-npm-hooks-shell/install.sh --dry-run
sh infra/macmini/c17-npm-hooks-shell/install.sh --apply
```

The shim is a copy, so **re-run `--apply` after editing `~/.gitconfig`**
(identity, aliases, credential helpers). `~/.npmrc` is backed up to
`~/.npmrc.bak-<timestamp>` before the line is appended; the script refuses to
overwrite a different existing `script-shell`.

## Proof (measured 2026-10-23)

```
$ npm config get script-shell
/Users/sirinx/.hermes/bin/npm-script-shell

$ cd ~/.hermes/hermes-agent
$ rm -f .git/hooks/pre-commit
$ env -u GIT_CONFIG_GLOBAL node scripts/build/node-deps.mjs \
    --source "$PWD" --workspace apps/desktop --workspace ui-tui --workspace web
sync hooks: ✔️(pre-commit)
added 1278 packages in 20s
rc=0                      # hook present afterwards; no refusal banner

$ grep -n hooksPath ~/.gitconfig
11:     hooksPath = /Users/sirinx/.codex/git-hooks      # untouched
$ git status --porcelain                                 # checkout clean
```

Identity through the shim: `user.email`/`user.name` unchanged; key-set diff
against the real global config is exactly `core.hookspath`.

## Rollback

```sh
rm -f ~/.hermes/gitconfig-nohooks ~/.hermes/bin/npm-script-shell
# remove the script-shell line from ~/.npmrc (or restore ~/.npmrc.bak-<timestamp>)
```

Nothing inside `~/.hermes/hermes-agent` or the codex hooks directory changed.

## Residual risk

- A project whose install script needs the *codex* hooks path during `npm ci`
  now sees the repository default instead. No such script exists in this repo
  or in hermes today.
- If `~/.gitconfig` changes and the shim is not regenerated, npm lifecycle
  scripts keep using the older identity/credentials. `install.sh` prints the
  regeneration command.
- npm reads **one** user config. Hermes sets `NPM_CONFIG_USERCONFIG` to
  `<hermes home>/npmrc` when that file exists, which would shadow `~/.npmrc` — so
  a future `~/.hermes/<profile>/npmrc` must carry the same `script-shell=` line,
  otherwise C17 returns for that profile.
